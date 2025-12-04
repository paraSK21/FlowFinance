// ====================
// frontend/src/store/slices/transactionSlice.js
// ====================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchTransactions = createAsyncThunk('transactions/fetch', async (params) => {
  const response = await api.get('/transactions', { params })
  return response.data
})

const transactionSlice = createSlice({
  name: 'transactions',
  initialState: {
    transactions: [],
    total: 0,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload.transactions || []
        state.total = action.payload.total || 0
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
        state.transactions = []
      })
  }
})

export default transactionSlice.reducer
