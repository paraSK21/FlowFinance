// ====================
// frontend/src/store/slices/forecastSlice.js
// ====================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const generateForecast = createAsyncThunk('forecasts/generate', async (days = 90) => {
  const response = await api.post(`/forecasts/generate?days=${days}`)
  return response.data
})

export const fetchForecasts = createAsyncThunk('forecasts/fetch', async (days = 90) => {
  const response = await api.get(`/forecasts?days=${days}`)
  return response.data
})

const forecastSlice = createSlice({
  name: 'forecasts',
  initialState: {
    forecasts: [],
    currentBalance: 0,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(generateForecast.pending, (state) => {
        state.loading = true
      })
      .addCase(generateForecast.fulfilled, (state, action) => {
        state.loading = false
        state.forecasts = action.payload.forecasts
        state.currentBalance = action.payload.currentBalance
      })
      .addCase(fetchForecasts.fulfilled, (state, action) => {
        state.forecasts = action.payload
      })
  }
})

export default forecastSlice.reducer
