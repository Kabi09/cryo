const POVerification = require('../models/POVerification');
const CustomerPO = require('../models/CustomerPO');
const Quotation = require('../models/Quotation');
const QuotationRevision = require('../models/QuotationRevision');
const ProformaInvoice = require('../models/ProformaInvoice');
const STATUSES = require('../constants/statuses');
const { AppError } = require('../utils/apiResponse');

class POVerificationService {
  static async runVerification(customerPoId, userId) {
    const po = await CustomerPO.findById(customerPoId);
    if (!po) {
      throw new AppError('Customer PO not found', 404, 'PO_NOT_FOUND');
    }

    const quotation = await Quotation.findById(po.quotationId);
    let acceptedRevision = null;
    if (po.revisionId) {
      acceptedRevision = await QuotationRevision.findById(po.revisionId);
    }
    const proforma = po.proformaId ? await ProformaInvoice.findById(po.proformaId) : null;

    // Use accepted revision numbers if revision exists, otherwise quotation
    const referenceSource = acceptedRevision || quotation;
    if (!referenceSource) {
      throw new AppError('No quotation reference found for this PO', 400, 'NO_QUOTATION_REFERENCE');
    }

    const itemComparisons = [];
    const commercialComparisons = [];
    const termComparisons = [];
    const mismatchSummary = [];

    // 1. Line Items Comparison
    po.items.forEach(poItem => {
      const refItem = referenceSource.items.find(
        i => i.sku === poItem.sku || String(i.productId) === String(poItem.productId)
      );

      if (!refItem) {
        itemComparisons.push({
          sku: poItem.sku,
          name: poItem.name,
          quotationQty: 0,
          poQty: poItem.quantity,
          quotationUnitPrice: 0,
          poUnitPrice: poItem.unitPrice,
          quotationTotal: 0,
          poTotal: poItem.total,
          status: 'MISMATCH',
          diffNotes: `Item ${poItem.sku || poItem.name} in PO is not present in accepted quotation.`
        });
        mismatchSummary.push(`Item ${poItem.sku} not present in quotation.`);
      } else {
        const qtyMatch = refItem.quantity === poItem.quantity;
        const priceMatch = Math.abs(refItem.unitPrice - poItem.unitPrice) < 0.01;
        const totalMatch = Math.abs(refItem.total - poItem.total) < 0.01;

        const isMatch = qtyMatch && priceMatch && totalMatch;
        let notes = 'Line item matches approved quotation specifications.';
        if (!isMatch) {
          const reasons = [];
          if (!qtyMatch) reasons.push(`Qty differs (Quote: ${refItem.quantity}, PO: ${poItem.quantity})`);
          if (!priceMatch) reasons.push(`Unit price differs (Quote: ₹${refItem.unitPrice}, PO: ₹${poItem.unitPrice})`);
          notes = reasons.join(', ');
          mismatchSummary.push(`${refItem.sku}: ${notes}`);
        }

        itemComparisons.push({
          sku: poItem.sku,
          name: poItem.name,
          quotationQty: refItem.quantity,
          poQty: poItem.quantity,
          quotationUnitPrice: refItem.unitPrice,
          poUnitPrice: poItem.unitPrice,
          quotationTotal: refItem.total,
          poTotal: poItem.total,
          status: isMatch ? 'MATCH' : 'MISMATCH',
          diffNotes: notes
        });
      }
    });

    // 2. Commercials Comparison
    const grandTotalDiff = Math.abs(referenceSource.grandTotal - po.totalAmount);
    const grandTotalMatch = grandTotalDiff < 1.0; // Within 1 rupee rounding
    if (!grandTotalMatch) {
      mismatchSummary.push(`Total Amount mismatch: Approved Quote ₹${referenceSource.grandTotal} vs PO ₹${po.totalAmount}`);
    }

    commercialComparisons.push({
      parameter: 'GRAND_TOTAL',
      quotationValue: referenceSource.grandTotal,
      poValue: po.totalAmount,
      status: grandTotalMatch ? 'MATCH' : 'MISMATCH',
      diffNotes: grandTotalMatch
        ? 'Total amount matches approved quotation.'
        : `Discrepancy of ₹${grandTotalDiff.toFixed(2)} between Quote and PO.`
    });

    // 3. Commercial Terms Comparison
    const paymentTermsMatch = referenceSource.paymentTerms && po.paymentTerms &&
      referenceSource.paymentTerms.trim().toLowerCase() === po.paymentTerms.trim().toLowerCase();
    termComparisons.push({
      termType: 'PAYMENT_TERMS',
      quotationTerm: referenceSource.paymentTerms || 'Not specified',
      poTerm: po.paymentTerms || 'Not provided',
      status: paymentTermsMatch ? 'MATCH' : (po.paymentTerms ? 'MISMATCH' : 'NOT_PROVIDED'),
      diffNotes: paymentTermsMatch ? 'Payment terms match.' : 'PO payment terms differ from quotation terms.'
    });
    if (!paymentTermsMatch) {
      mismatchSummary.push('Payment terms mismatch between Quotation and PO.');
    }

    const deliveryTermsMatch = referenceSource.deliveryTerms && po.deliveryTerms &&
      referenceSource.deliveryTerms.trim().toLowerCase() === po.deliveryTerms.trim().toLowerCase();
    termComparisons.push({
      termType: 'DELIVERY_TERMS',
      quotationTerm: referenceSource.deliveryTerms || 'Not specified',
      poTerm: po.deliveryTerms || 'Not provided',
      status: deliveryTermsMatch ? 'MATCH' : (po.deliveryTerms ? 'MISMATCH' : 'NOT_PROVIDED'),
      diffNotes: deliveryTermsMatch ? 'Delivery terms match.' : 'PO delivery terms differ from quotation terms.'
    });

    const warrantyTermsMatch = referenceSource.warrantyTerms && po.warrantyTerms &&
      referenceSource.warrantyTerms.trim().toLowerCase() === po.warrantyTerms.trim().toLowerCase();
    termComparisons.push({
      termType: 'WARRANTY_TERMS',
      quotationTerm: referenceSource.warrantyTerms || 'Not specified',
      poTerm: po.warrantyTerms || 'Not provided',
      status: warrantyTermsMatch ? 'MATCH' : (po.warrantyTerms ? 'MISMATCH' : 'NOT_PROVIDED'),
      diffNotes: warrantyTermsMatch ? 'Warranty terms match.' : 'PO warranty terms differ from quotation terms.'
    });

    const overallStatus = mismatchSummary.length === 0 ? STATUSES.PO_VERIFICATION.MATCH : STATUSES.PO_VERIFICATION.MISMATCH;

    // Update PO Status
    po.status = overallStatus === STATUSES.PO_VERIFICATION.MATCH
      ? STATUSES.CUSTOMER_PO.VERIFIED
      : STATUSES.CUSTOMER_PO.HOLD;
    if (overallStatus !== STATUSES.PO_VERIFICATION.MATCH) {
      po.holdReason = mismatchSummary.join(' | ');
    }
    po.verifiedAt = new Date();
    po.verifiedBy = userId;
    await po.save();

    const verificationNumber = `POV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const verification = new POVerification({
      verificationNumber,
      customerPoId: po._id,
      quotationId: quotation._id,
      revisionId: acceptedRevision ? acceptedRevision._id : null,
      proformaId: proforma ? proforma._id : null,
      itemComparisons,
      commercialComparisons,
      termComparisons,
      overallStatus,
      mismatchSummary,
      verifiedBy: userId,
      verifiedAt: new Date()
    });

    await verification.save();
    return verification;
  }
}

module.exports = POVerificationService;
