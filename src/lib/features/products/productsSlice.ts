import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Product {
  id: number;
  title: string;
  introduction: string | null; // Giới thiệu
  description: string | null; // Mô tả
  specifications: string | null; // Thông số kỹ thuật
  guarantee: string | null; // Bảo hành
  categoryId: number;
  category?: {
    id: number;
    name: string;
  };
  price: string | null; // Giá sau khuyến mãi
  original_price: string | null; // Giá gốc
  isActive: boolean;
  isBestSeller: boolean; // Sản phẩm bán chạy
  showInHomePage: boolean; // Hiển thị trên trang chủ
  imageUrl: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductsState {
  products: Product[];
  loading: boolean;
  error: string | null;
  editingProductId: number | null;
  pagination: PaginationInfo | null;
}

const initialState: ProductsState = {
  products: [],
  loading: false,
  error: null,
  editingProductId: null,
  pagination: null,
};

// Async thunks
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async ({ page = 1, limit = 10, categoryId, search }: { page?: number; limit?: number; categoryId?: number; search?: string } = {}) => {
    let url = `/api/products?page=${page}&limit=${limit}`;
    if (categoryId) {
      url += `&categoryId=${categoryId}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }
    return response.json();
  }
);

export const createProduct = createAsyncThunk(
  'products/createProduct',
  async (product: {
    title: string;
    introduction?: string | null;
    description?: string | null;
    specifications?: string | null;
    guarantee?: string | null;
    categoryId: number;
    price?: string | null;
    original_price?: string | null;
    isActive?: boolean;
    isBestSeller?: boolean;
    showInHomePage?: boolean;
    imageUrl?: string | null;
    order?: number;
  }) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create product');
    }
    return response.json();
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async ({ id, product }: { id: number; product: Partial<Product> }) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update product');
    }
    return response.json();
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: number) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete product');
    }
    return id;
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setEditingProduct: (state, action: PayloadAction<number | null>) => {
      state.editingProductId = action.payload;
    },
    addNewProduct: (state) => {
      const newProduct: Product = {
        id: 0, // Temporary ID for new product
        title: '',
        introduction: null,
        description: null,
        specifications: null,
        guarantee: null,
        categoryId: 0,
        price: null,
        original_price: null,
        isActive: true,
        isBestSeller: false,
        showInHomePage: false,
        imageUrl: null,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.products.unshift(newProduct);
      state.editingProductId = 0;
    },
    updateLocalProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    removeNewProduct: (state) => {
      state.products = state.products.filter((p) => p.id !== 0);
      state.editingProductId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch products';
      })
      // Create product
      .addCase(createProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProduct.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the temporary product and add the real one
        state.products = state.products.filter((p) => p.id !== 0);
        state.products.unshift(action.payload);
        state.editingProductId = null;
      })
      .addCase(createProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create product';
      })
      // Update product
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.products.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        state.editingProductId = null;
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update product';
      })
      // Delete product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.loading = false;
        state.products = state.products.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete product';
      });
  },
});

export const {
  setEditingProduct,
  addNewProduct,
  updateLocalProduct,
  removeNewProduct,
} = productsSlice.actions;

export default productsSlice.reducer;
