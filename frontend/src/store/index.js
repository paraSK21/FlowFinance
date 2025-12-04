// ====================
// frontend/src/store/index.js
// ====================
import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import accountReducer from './slices/accountSlice'
import transactionReducer from './slices/transactionSlice'
import forecastReducer from './slices/forecastSlice'

const store = configureStore({
  reducer: {
    auth: authReducer,
    accounts: accountReducer,
    transactions: transactionReducer,
    forecasts: forecastReducer
  }
})

export default store
