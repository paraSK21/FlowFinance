// ====================
// frontend/src/store/slices/authSlice.js
// ====================
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/login', credentials)
    localStorage.setItem('token', response.data.token)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Login failed' })
  }
})

export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const response = await api.post('/auth/register', userData)
    localStorage.setItem('token', response.data.token)
    return response.data
  } catch (error) {
    return rejectWithValue(error.response?.data || { error: 'Registration failed' })
  }
})

export const loadUser = createAsyncThunk('auth/loadUser', async () => {
  const response = await api.get('/auth/profile')
  return response.data
})

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token'),
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      localStorage.removeItem('token')
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message
      })
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload?.error || action.error.message
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.user = action.payload
      })
  }
})

export const { logout } = authSlice.actions
export default authSlice.reducer
