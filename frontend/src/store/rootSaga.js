import { all, takeLatest, call, put } from 'redux-saga/effects';
import api from '../services/api';
import { loginRequest, loginSuccess, loginFailure } from './slices/authSlice';
import { setDashboardStats } from './slices/systemSlice';

function* handleLogin(action) {
  try {
    const response = yield call(api.post, '/auth/login', action.payload);
    yield put(loginSuccess(response.data));
  } catch (error) {
    yield put(loginFailure(error.message || 'Login failed'));
  }
}

function* watchAuth() {
  yield takeLatest(loginRequest.type, handleLogin);
}

export default function* rootSaga() {
  yield all([
    watchAuth()
  ]);
}
