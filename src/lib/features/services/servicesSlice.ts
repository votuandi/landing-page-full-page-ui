import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { Benefit, ProcessStep } from "@/types";

export interface Service {
  id: number;
  title: string;
  description: string | null;
  image: string | null;
  features: string[];
  price: string | null;
  category: string;
  duration: string | null;
  warranty: string | null;
  benefits?: Benefit[] | null;
  implementationProcess?: ProcessStep[] | null;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface ServicesState {
  services: Service[];
  loading: boolean;
  error: string | null;
  editingServiceId: number | null;
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    limit: number;
  } | null;
}

const initialState: ServicesState = {
  services: [],
  loading: false,
  error: null,
  editingServiceId: null,
  pagination: null,
};

// Async thunks
export const fetchServices = createAsyncThunk(
  "services/fetchServices",
  async (params: { page?: number; limit?: number; search?: string; category?: string } = {}) => {
    const { page = 1, limit = 10, search, category } = params;
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category && { category }),
    });

    const response = await fetch(`/api/services?${queryParams}`);
    if (!response.ok) {
      throw new Error("Failed to fetch services");
    }
    return response.json();
  }
);

export const createService = createAsyncThunk(
  "services/createService",
  async (service: Omit<Service, "id" | "createdAt" | "updatedAt">) => {
    const response = await fetch("/api/services", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(service),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to create service");
    }

    return response.json();
  }
);

export const updateService = createAsyncThunk(
  "services/updateService",
  async ({ id, service }: { id: number; service: Partial<Service> }) => {
    const response = await fetch(`/api/services/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(service),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to update service");
    }

    return response.json();
  }
);

export const deleteService = createAsyncThunk(
  "services/deleteService",
  async (id: number) => {
    const response = await fetch(`/api/services/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete service");
    }

    return id;
  }
);

const servicesSlice = createSlice({
  name: "services",
  initialState,
  reducers: {
    setEditingService: (state, action: PayloadAction<number | null>) => {
      state.editingServiceId = action.payload;
    },
    addNewService: (state) => {
      const newService: Service = {
        id: 0,
        title: "",
        description: "",
        image: "",
        features: [],
        price: "",
        category: "household",
        duration: "",
        warranty: "",
        benefits: [],
        implementationProcess: [],
        isActive: true,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.services.unshift(newService);
      state.editingServiceId = 0;
    },
    updateLocalService: (state, action: PayloadAction<Service>) => {
      const index = state.services.findIndex((s) => s.id === action.payload.id);
      if (index !== -1) {
        state.services[index] = action.payload;
      }
    },
    removeNewService: (state) => {
      state.services = state.services.filter((s) => s.id !== 0);
      state.editingServiceId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch services
      .addCase(fetchServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload.services;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch services";
      })
      // Create service
      .addCase(createService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createService.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the temporary service (id: 0) and add the new one
        state.services = state.services.filter((s) => s.id !== 0);
        state.services.unshift(action.payload);
        state.editingServiceId = null;
      })
      .addCase(createService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to create service";
      })
      // Update service
      .addCase(updateService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateService.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.services.findIndex((s) => s.id === action.payload.id);
        if (index !== -1) {
          state.services[index] = action.payload;
        }
        state.editingServiceId = null;
      })
      .addCase(updateService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to update service";
      })
      // Delete service
      .addCase(deleteService.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteService.fulfilled, (state, action) => {
        state.loading = false;
        state.services = state.services.filter((s) => s.id !== action.payload);
      })
      .addCase(deleteService.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to delete service";
      });
  },
});

export const {
  setEditingService,
  addNewService,
  updateLocalService,
  removeNewService,
} = servicesSlice.actions;

export default servicesSlice.reducer;
