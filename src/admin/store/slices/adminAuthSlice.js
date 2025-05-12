import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  adminUser: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const adminAuthSlice = createSlice({
  name: 'adminAuth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    loginSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.adminUser = action.payload;
      state.error = null;
    },
    loginFailure: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.adminUser = null;
      state.error = action.payload;
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.adminUser = null;
      state.error = null;
    },
    checkAuthStart: (state) => {
      state.isLoading = true;
    },
    checkAuthSuccess: (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = true;
      state.adminUser = action.payload;
    },
    checkAuthFailure: (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.adminUser = null;
    },
  },
});

export const {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  checkAuthStart,
  checkAuthSuccess,
  checkAuthFailure,
} = adminAuthSlice.actions;

export default adminAuthSlice.reducer;