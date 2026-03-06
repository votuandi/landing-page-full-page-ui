import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Partner {
  id: number;
  name: string;
  image: string;
  order: number;
  isActive: boolean;
}

interface PartnersState {
  partners: Partner[];
  loading: boolean;
  error: string | null;
  editingPartnerId: number | null;
}

const initialState: PartnersState = {
  partners: [],
  loading: false,
  error: null,
  editingPartnerId: null,
};

// Async thunks for API calls
export const fetchPartners = createAsyncThunk(
  'partners/fetchPartners',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/partners?orderBy=order');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: Failed to fetch partners`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      return data as Partner[];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const createPartner = createAsyncThunk(
  'partners/createPartner',
  async (partner: Omit<Partner, 'id'>, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partner),
      });

      if (!response.ok) {
        throw new Error('Failed to create partner');
      }

      const savedPartner = await response.json();
      return savedPartner;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create partner');
    }
  }
);

export const updatePartner = createAsyncThunk(
  'partners/updatePartner',
  async ({ id, partner }: { id: number; partner: Partial<Partner> }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/partners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partner),
      });

      if (!response.ok) {
        throw new Error('Failed to update partner');
      }

      const savedPartner = await response.json();
      return savedPartner;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update partner');
    }
  }
);

export const deletePartner = createAsyncThunk(
  'partners/deletePartner',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/partners/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete partner');
      }

      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete partner');
    }
  }
);

const partnersSlice = createSlice({
  name: 'partners',
  initialState,
  reducers: {
    setEditingPartner: (state, action: PayloadAction<number | null>) => {
      state.editingPartnerId = action.payload;
    },
    addNewPartner: (state) => {
      const newPartner: Partner = {
        id: 0, // Temporary ID
        name: '',
        image: '',
        order: state.partners.length,
        isActive: true,
      };
      state.partners.unshift(newPartner);
      state.editingPartnerId = 0;
    },
    updateLocalPartner: (state, action: PayloadAction<Partner>) => {
      const index = state.partners.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.partners[index] = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch partners
    builder
      .addCase(fetchPartners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPartners.fulfilled, (state, action) => {
        state.loading = false;
        state.partners = action.payload;
      })
      .addCase(fetchPartners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create partner
    builder
      .addCase(createPartner.pending, (state) => {
        state.error = null;
      })
      .addCase(createPartner.fulfilled, (state, action) => {
        // Replace the temporary partner (id: 0) with the saved one
        const index = state.partners.findIndex(p => p.id === 0);
        if (index !== -1) {
          state.partners[index] = action.payload;
        }
        state.editingPartnerId = null;
      })
      .addCase(createPartner.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update partner
    builder
      .addCase(updatePartner.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePartner.fulfilled, (state, action) => {
        const index = state.partners.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.partners[index] = action.payload;
        }
        state.editingPartnerId = null;
      })
      .addCase(updatePartner.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete partner
    builder
      .addCase(deletePartner.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePartner.fulfilled, (state, action) => {
        state.partners = state.partners.filter(p => p.id !== action.payload);
      })
      .addCase(deletePartner.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setEditingPartner, addNewPartner, updateLocalPartner, clearError } = partnersSlice.actions;
export default partnersSlice.reducer;
