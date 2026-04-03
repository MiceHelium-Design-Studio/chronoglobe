import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserDataSyncState } from '../../types/sync';

const initialState: UserDataSyncState = {
  status: 'idle',
  activeUid: null,
  error: null,
  lastSyncedAt: null,
};

const syncSlice = createSlice({
  name: 'userDataSync',
  initialState,
  reducers: {
    setSyncLoading: (state, action: PayloadAction<string>) => {
      state.status = 'loading';
      state.activeUid = action.payload;
      state.error = null;
    },
    setSyncSaving: (state) => {
      state.status = 'saving';
      state.error = null;
    },
    setSyncSuccess: (state, action: PayloadAction<string>) => {
      state.status = 'synced';
      state.lastSyncedAt = action.payload;
      state.error = null;
    },
    setSyncError: (state, action: PayloadAction<string>) => {
      state.status = 'error';
      state.error = action.payload;
    },
    resetSyncState: (state) => {
      state.status = 'idle';
      state.activeUid = null;
      state.error = null;
      state.lastSyncedAt = null;
    },
  },
});

export const {
  setSyncLoading,
  setSyncSaving,
  setSyncSuccess,
  setSyncError,
  resetSyncState,
} = syncSlice.actions;

export default syncSlice.reducer;
