import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface BannerSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  backgroundImage: string;
  backgroundColor: string;
  isActive: boolean;
}

interface BannersState {
  banners: BannerSlide[];
  loading: boolean;
  error: string | null;
  editingBannerId: number | null;
}

const initialState: BannersState = {
  banners: [],
  loading: false,
  error: null,
  editingBannerId: null,
};

// Async thunks for API calls
export const fetchBanners = createAsyncThunk(
  'banners/fetchBanners',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/banners?orderBy=order');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: Failed to fetch banners`;
        throw new Error(errorMessage);
      }
      const data = await response.json();
      // Map API response to BannerSlide format
      const mappedBanners: BannerSlide[] = data.map((banner: any) => ({
        id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle || '',
        description: banner.description || '',
        buttonText: banner.buttonText || '',
        buttonLink: banner.buttonLink || '',
        backgroundImage: banner.backgroundImage || '',
        backgroundColor: banner.backgroundColor || 'bg-gradient-to-r from-blue-600 to-purple-600',
        isActive: banner.isActive,
      }));
      return mappedBanners;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'An error occurred');
    }
  }
);

export const createBanner = createAsyncThunk(
  'banners/createBanner',
  async (banner: Omit<BannerSlide, 'id'> & { order: number }, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/banners', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(banner),
      });

      if (!response.ok) {
        throw new Error('Failed to create banner');
      }

      const savedBanner = await response.json();
      return savedBanner;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to create banner');
    }
  }
);

export const updateBanner = createAsyncThunk(
  'banners/updateBanner',
  async ({ id, banner }: { id: number; banner: Partial<BannerSlide> & { order?: number } }, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(banner),
      });

      if (!response.ok) {
        throw new Error('Failed to update banner');
      }

      const savedBanner = await response.json();
      return savedBanner;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update banner');
    }
  }
);

export const deleteBanner = createAsyncThunk(
  'banners/deleteBanner',
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/banners/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete banner');
      }

      return id;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete banner');
    }
  }
);

const bannersSlice = createSlice({
  name: 'banners',
  initialState,
  reducers: {
    setEditingBanner: (state, action: PayloadAction<number | null>) => {
      state.editingBannerId = action.payload;
    },
    addNewBanner: (state) => {
      const newBanner: BannerSlide = {
        id: 0, // Temporary ID
        title: '',
        subtitle: '',
        description: '',
        buttonText: '',
        buttonLink: '',
        backgroundImage: '',
        backgroundColor: 'bg-gradient-to-r from-blue-600 to-purple-600',
        isActive: false,
      };
      state.banners.unshift(newBanner);
      state.editingBannerId = 0;
    },
    updateLocalBanner: (state, action: PayloadAction<BannerSlide>) => {
      const index = state.banners.findIndex(b => b.id === action.payload.id);
      if (index !== -1) {
        state.banners[index] = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch banners
    builder
      .addCase(fetchBanners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanners.fulfilled, (state, action) => {
        state.loading = false;
        state.banners = action.payload;
      })
      .addCase(fetchBanners.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Create banner
    builder
      .addCase(createBanner.pending, (state) => {
        state.error = null;
      })
      .addCase(createBanner.fulfilled, (state, action) => {
        // Replace the temporary banner (id: 0) with the saved one
        const index = state.banners.findIndex(b => b.id === 0);
        if (index !== -1) {
          state.banners[index] = action.payload;
        }
        state.editingBannerId = null;
      })
      .addCase(createBanner.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Update banner
    builder
      .addCase(updateBanner.pending, (state) => {
        state.error = null;
      })
      .addCase(updateBanner.fulfilled, (state, action) => {
        const index = state.banners.findIndex(b => b.id === action.payload.id);
        if (index !== -1) {
          state.banners[index] = action.payload;
        }
        state.editingBannerId = null;
      })
      .addCase(updateBanner.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Delete banner
    builder
      .addCase(deleteBanner.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteBanner.fulfilled, (state, action) => {
        state.banners = state.banners.filter(b => b.id !== action.payload);
      })
      .addCase(deleteBanner.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setEditingBanner, addNewBanner, updateLocalBanner, clearError } = bannersSlice.actions;
export default bannersSlice.reducer;
