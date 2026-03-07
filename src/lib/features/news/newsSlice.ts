import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface News {
  id: number;
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  readTime: string;
  imageUrl: string | null;
  tags: string[];
  isActive: boolean;
  order: number;
  publishedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface NewsState {
  newsList: News[];
  loading: boolean;
  error: string | null;
  editingNewsId: number | null;
  pagination: PaginationInfo | null;
}

const initialState: NewsState = {
  newsList: [],
  loading: false,
  error: null,
  editingNewsId: null,
  pagination: null,
};

// Async thunks
export const fetchNews = createAsyncThunk(
  'news/fetchNews',
  async ({ page = 1, limit = 10, category, search }: { page?: number; limit?: number; category?: string; search?: string } = {}) => {
    let url = `/api/news?page=${page}&limit=${limit}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }
    return response.json();
  }
);

export const createNews = createAsyncThunk(
  'news/createNews',
  async (news: {
    title: string;
    excerpt: string;
    content: string;
    author?: string;
    category?: string;
    readTime?: string;
    imageUrl?: string | null;
    tags?: string[];
    isActive?: boolean;
    order?: number;
    publishedAt?: string;
  }) => {
    const response = await fetch('/api/news', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(news),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create news');
    }
    return response.json();
  }
);

export const updateNews = createAsyncThunk(
  'news/updateNews',
  async ({ id, news }: { id: number; news: Partial<News> }) => {
    const response = await fetch(`/api/news/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(news),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update news');
    }
    return response.json();
  }
);

export const deleteNews = createAsyncThunk(
  'news/deleteNews',
  async (id: number) => {
    const response = await fetch(`/api/news/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete news');
    }
    return id;
  }
);

const newsSlice = createSlice({
  name: 'news',
  initialState,
  reducers: {
    setEditingNews: (state, action: PayloadAction<number | null>) => {
      state.editingNewsId = action.payload;
    },
    addNewNews: (state) => {
      const newNews: News = {
        id: 0, // Temporary ID for new news
        title: '',
        excerpt: '',
        content: '',
        author: 'Administrator',
        category: 'Tin tức',
        readTime: '5 phút đọc',
        imageUrl: null,
        tags: [],
        isActive: true,
        order: 0,
        publishedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.newsList.unshift(newNews);
      state.editingNewsId = 0;
    },
    updateLocalNews: (state, action: PayloadAction<News>) => {
      const index = state.newsList.findIndex((n) => n.id === action.payload.id);
      if (index !== -1) {
        state.newsList[index] = action.payload;
      }
    },
    removeNewNews: (state) => {
      state.newsList = state.newsList.filter((n) => n.id !== 0);
      state.editingNewsId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch news
      .addCase(fetchNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNews.fulfilled, (state, action) => {
        state.loading = false;
        state.newsList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch news';
      })
      // Create news
      .addCase(createNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createNews.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the temporary news and add the real one
        state.newsList = state.newsList.filter((n) => n.id !== 0);
        state.newsList.unshift(action.payload);
        state.editingNewsId = null;
      })
      .addCase(createNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create news';
      })
      // Update news
      .addCase(updateNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateNews.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.newsList.findIndex((n) => n.id === action.payload.id);
        if (index !== -1) {
          state.newsList[index] = action.payload;
        }
        state.editingNewsId = null;
      })
      .addCase(updateNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update news';
      })
      // Delete news
      .addCase(deleteNews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteNews.fulfilled, (state, action) => {
        state.loading = false;
        state.newsList = state.newsList.filter((n) => n.id !== action.payload);
      })
      .addCase(deleteNews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete news';
      });
  },
});

export const {
  setEditingNews,
  addNewNews,
  updateLocalNews,
  removeNewNews,
} = newsSlice.actions;

export default newsSlice.reducer;
