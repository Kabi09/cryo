import { configureStore } from '@reduxjs/toolkit';
import createSagaMiddleware from 'redux-saga';

import authReducer from './slices/authSlice';
import salesReducer from './slices/salesSlice';
import productionReducer from './slices/productionSlice';
import inventoryReducer from './slices/inventorySlice';
import qualityReducer from './slices/qualitySlice';
import logisticsReducer from './slices/logisticsSlice';
import serviceReducer from './slices/serviceSlice';
import systemReducer from './slices/systemSlice';

import rootSaga from './rootSaga';

const sagaMiddleware = createSagaMiddleware();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sales: salesReducer,
    production: productionReducer,
    inventory: inventoryReducer,
    quality: qualityReducer,
    logistics: logisticsReducer,
    service: serviceReducer,
    system: systemReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: false, serializableCheck: false }).concat(sagaMiddleware)
});

sagaMiddleware.run(rootSaga);

export default store;
