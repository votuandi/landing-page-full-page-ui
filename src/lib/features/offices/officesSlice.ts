import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface Office {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  workingTime: string;
  googleMapEmbedUrl: string | null;
  isMainOffice: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OfficesState {
  offices: Office[];
  loading: boolean;
  error: string | null;
  editingOfficeId: number | null;
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  } | null;
}

const initialState: OfficesState = {
  offices: [],
  loading: false,
  error: null,
  editingOfficeId: null,
  pagination: null,
};

// Async thunks
export const fetchOffices = createAsyncThunk(
  "offices/fetchOffices",
  async (params: { page?: number; limit?: number; search?: string } = {}) => {
    const { page = 1, limit = 10, search } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
    });

    const response = await fetch(`/api/offices?${queryParams}`);
    if (!response.ok) {
      throw new Error("Failed to fetch offices");
    }
    return response.json();
  }
);

export const createOffice = createAsyncThunk(
  "offices/createOffice",
  async (office: Omit<Office, "id" | "createdAt" | "updatedAt">) => {
    const response = await fetch("/api/offices", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(office),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create office");
    }

    return response.json();
  }
);

export const updateOffice = createAsyncThunk(
  "offices/updateOffice",
  async ({ id, office }: { id: number; office: Partial<Office> }) => {
    const response = await fetch(`/api/offices/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(office),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update office");
    }

    return response.json();
  }
);

export const deleteOffice = createAsyncThunk(
  "offices/deleteOffice",
  async (id: number) => {
    const response = await fetch(`/api/offices/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete office");
    }

    return id;
  }
);

const officesSlice = createSlice({
  name: "offices",
  initialState,
  reducers: {
    setEditingOffice: (state, action: PayloadAction<number | null>) => {
      state.editingOfficeId = action.payload;
    },
    addNewOffice: (state) => {
      const newOffice: Office = {
        id: 0,
        name: "",
        phone: "",
        email: "",
        address: "",
        workingTime: "",
        googleMapEmbedUrl: "",
        isMainOffice: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.offices.unshift(newOffice);
      state.editingOfficeId = 0;
    },
    updateLocalOffice: (state, action: PayloadAction<Office>) => {
      const index = state.offices.findIndex((o) => o.id === action.payload.id);
      if (index !== -1) {
        state.offices[index] = action.payload;
      }
    },
    removeNewOffice: (state) => {
      state.offices = state.offices.filter((o) => o.id !== 0);
      state.editingOfficeId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch offices
      .addCase(fetchOffices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOffices.fulfilled, (state, action) => {
        state.loading = false;
        state.offices = action.payload.offices;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchOffices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch offices";
      })
      // Create office
      .addCase(createOffice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOffice.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the temporary office (id: 0) and add the new one
        state.offices = state.offices.filter((o) => o.id !== 0);
        state.offices.unshift(action.payload);
        state.editingOfficeId = null;
      })
      .addCase(createOffice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create office";
      })
      // Update office
      .addCase(updateOffice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOffice.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.offices.findIndex((o) => o.id === action.payload.id);
        if (index !== -1) {
          state.offices[index] = action.payload;
        }
        state.editingOfficeId = null;
      })
      .addCase(updateOffice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update office";
      })
      // Delete office
      .addCase(deleteOffice.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteOffice.fulfilled, (state, action) => {
        state.loading = false;
        state.offices = state.offices.filter((o) => o.id !== action.payload);
      })
      .addCase(deleteOffice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete office";
      });
  },
});

export const {
  setEditingOffice,
  addNewOffice,
  updateLocalOffice,
  removeNewOffice,
} = officesSlice.actions;

export default officesSlice.reducer;
