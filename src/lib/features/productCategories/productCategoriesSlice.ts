import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    products: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductCategoriesState {
  categories: ProductCategory[];
  loading: boolean;
  error: string | null;
  editingCategoryId: number | null;
  pagination: PaginationInfo | null;
}

const initialState: ProductCategoriesState = {
  categories: [],
  loading: false,
  error: null,
  editingCategoryId: null,
  pagination: null,
};

// Async thunks
export const fetchProductCategories = createAsyncThunk(
  'productCategories/fetchProductCategories',
  async ({ page = 1, limit = 10 }: { page?: number; limit?: number } = {}) => {
    const response = await fetch(`/api/product-categories?page=${page}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to fetch product categories');
    }
    return response.json();
  }
);

export const createProductCategory = createAsyncThunk(
  'productCategories/createProductCategory',
  async (category: { name: string; description?: string | null; imageUrl?: string | null }) => {
    const response = await fetch('/api/product-categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product category');
    }
    return response.json();
  }
);

export const updateProductCategory = createAsyncThunk(
  'productCategories/updateProductCategory',
  async ({ id, category }: { id: number; category: Partial<ProductCategory> }) => {
    const response = await fetch(`/api/product-categories/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(category),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product category');
    }
    return response.json();
  }
);

export const deleteProductCategory = createAsyncThunk(
  'productCategories/deleteProductCategory',
  async (id: number) => {
    const response = await fetch(`/api/product-categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || error.message || 'Failed to delete product category');
    }
    return id;
  }
);

const productCategoriesSlice = createSlice({
  name: 'productCategories',
  initialState,
  reducers: {
    setEditingCategory: (state, action: PayloadAction<number | null>) => {
      state.editingCategoryId = action.payload;
    },
    addNewCategory: (state) => {
      const newCategory: ProductCategory = {
        id: 0, // Temporary ID for new category
        name: '',
        description: null,
        imageUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { products: 0 },
      };
      state.categories.unshift(newCategory);
      state.editingCategoryId = 0;
    },
    updateLocalCategory: (state, action: PayloadAction<ProductCategory>) => {
      const index = state.categories.findIndex((c) => c.id === action.payload.id);
      if (index !== -1) {
        state.categories[index] = action.payload;
      }
    },
    removeNewCategory: (state) => {
      state.categories = state.categories.filter((c) => c.id !== 0);
      state.editingCategoryId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch categories
      .addCase(fetchProductCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProductCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch product categories';
      })
      // Create category
      .addCase(createProductCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProductCategory.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the temporary category and add the real one
        state.categories = state.categories.filter((c) => c.id !== 0);
        state.categories.unshift(action.payload);
        state.editingCategoryId = null;
      })
      .addCase(createProductCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create product category';
      })
      // Update category
      .addCase(updateProductCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.categories.findIndex((c) => c.id === action.payload.id);
        if (index !== -1) {
          state.categories[index] = action.payload;
        }
        state.editingCategoryId = null;
      })
      .addCase(updateProductCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update product category';
      })
      // Delete category
      .addCase(deleteProductCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProductCategory.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = state.categories.filter((c) => c.id !== action.payload);
      })
      .addCase(deleteProductCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete product category';
      });
  },
});

export const {
  setEditingCategory,
  addNewCategory,
  updateLocalCategory,
  removeNewCategory,
} = productCategoriesSlice.actions;

export default productCategoriesSlice.reducer;
