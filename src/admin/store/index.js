import { configureStore } from '@reduxjs/toolkit';
import adminAuthReducer from './slices/adminAuthSlice';
import usersReducer from './slices/usersSlice';
import tasksReducer from './slices/tasksSlice';
import adsReducer from './slices/adsSlice';
import analyticsReducer from './slices/analyticsSlice';

export const store = configureStore({
  reducer: {
    adminAuth: adminAuthReducer,
    users: usersReducer,
    tasks: tasksReducer,
    ads: adsReducer,
    analytics: analyticsReducer,
  },
});

export default store;