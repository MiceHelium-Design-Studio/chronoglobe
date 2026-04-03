import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { User as FirebaseUser } from 'firebase/auth';
import { AuthState } from '../../types/auth';
import { UserBilling } from '../../types/plans';
import { createDefaultBilling } from '../../lib/entitlements';

const initialState: AuthState = {
  user: null,
  loading: false,
  error: null,
  billing: createDefaultBilling(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<FirebaseUser | null>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setBilling: (state, action: PayloadAction<UserBilling>) => {
      state.billing = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.billing = createDefaultBilling();
    },
  },
});

export const {
  setUser,
  setLoading,
  setError,
  setBilling,
  logout,
} = authSlice.actions;
export default authSlice.reducer;
