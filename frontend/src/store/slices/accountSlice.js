// ====================
// frontend/src/store/slices/accountSlice.js
// ====================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const fetchAccounts = createAsyncThunk('accounts/fetch', async () => {
  const response = await api.get('/accounts')
  return response.data
})

export const syncAccounts = createAsyncThunk('accounts/sync', async () => {
  const response = await api.post('/accounts/sync')
  return response.data
})

const accountSlice = createSlice({
  name: 'accounts',
  initialState: {
    accounts: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.loading = false
        state.accounts = action.payload
      })
      .addCase(syncAccounts.fulfilled, (state, action) => {
        // Refetch accounts after sync
      })
  }
})

export default accountSlice.reducer
