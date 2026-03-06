import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

export interface DatabaseStatus {
  connected: boolean;
  status: 'success' | 'error' | 'checking';
  message?: string;
  responseTime?: string;
  databaseUrl?: string;
  databaseInfo?: {
    version?: string;
  };
  errorCode?: string;
  details?: string;
  timestamp?: string;
}

interface DatabaseState {
  status: DatabaseStatus | null;
  checking: boolean;
}

const initialState: DatabaseState = {
  status: null,
  checking: false,
};

// Async thunk for checking database connection
export const checkDatabaseConnection = createAsyncThunk(
  'database/checkConnection',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/database/status');
      const data = await response.json();
      return data as DatabaseStatus;
    } catch (error) {
      const errorStatus: DatabaseStatus = {
        connected: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Không thể kiểm tra kết nối database',
      };
      return rejectWithValue(errorStatus);
    }
  }
);

const databaseSlice = createSlice({
  name: 'database',
  initialState,
  reducers: {
    clearDatabaseStatus: (state) => {
      state.status = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkDatabaseConnection.pending, (state) => {
        state.checking = true;
        state.status = {
          connected: false,
          status: 'checking',
          message: 'Đang kiểm tra kết nối...',
        };
      })
      .addCase(checkDatabaseConnection.fulfilled, (state, action) => {
        state.checking = false;
        state.status = action.payload;
      })
      .addCase(checkDatabaseConnection.rejected, (state, action) => {
        state.checking = false;
        state.status = action.payload as DatabaseStatus;
      });
  },
});

export const { clearDatabaseStatus } = databaseSlice.actions;
export default databaseSlice.reducer;
