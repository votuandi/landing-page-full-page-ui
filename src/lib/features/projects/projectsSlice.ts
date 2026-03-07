import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface Project {
  id: number;
  title: string;
  location: string | null;
  capacity: string | null;
  completedDate: string | null;
  imageUrl: string | null;
  description: string | null;
  detail: string | null;
  category: string;
  client: string | null;
  isDisplay: boolean;
  showInHomepage: boolean;
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

interface ProjectsState {
  projectsList: Project[];
  loading: boolean;
  error: string | null;
  editingProjectId: number | null;
  pagination: PaginationInfo | null;
}

const initialState: ProjectsState = {
  projectsList: [],
  loading: false,
  error: null,
  editingProjectId: null,
  pagination: null,
};

// Async thunks
export const fetchProjects = createAsyncThunk(
  'projects/fetchProjects',
  async ({ page = 1, limit = 10, category, search }: { page?: number; limit?: number; category?: string; search?: string } = {}) => {
    let url = `/api/projects?page=${page}&limit=${limit}`;
    if (category) {
      url += `&category=${encodeURIComponent(category)}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return response.json();
  }
);

export const createProject = createAsyncThunk(
  'projects/createProject',
  async (project: {
    title: string;
    location?: string | null;
    capacity?: string | null;
    completedDate?: string | null;
    imageUrl?: string | null;
    description?: string | null;
    detail?: string | null;
    category?: string;
    client?: string | null;
    isDisplay?: boolean;
    showInHomepage?: boolean;
    order?: number;
  }) => {
    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create project');
    }
    return response.json();
  }
);

export const updateProject = createAsyncThunk(
  'projects/updateProject',
  async ({ id, project }: { id: number; project: Partial<Project> }) => {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update project');
    }
    return response.json();
  }
);

export const deleteProject = createAsyncThunk(
  'projects/deleteProject',
  async (id: number) => {
    const response = await fetch(`/api/projects/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete project');
    }
    return id;
  }
);

const projectsSlice = createSlice({
  name: 'projects',
  initialState,
  reducers: {
    setEditingProject: (state, action: PayloadAction<number | null>) => {
      state.editingProjectId = action.payload;
    },
    addNewProject: (state) => {
      const newProject: Project = {
        id: 0, // Temporary ID for new project
        title: '',
        location: null,
        capacity: null,
        completedDate: null,
        imageUrl: null,
        description: null,
        detail: null,
        category: 'Công nghiệp',
        client: null,
        isDisplay: true,
        showInHomepage: false,
        order: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.projectsList.unshift(newProject);
      state.editingProjectId = 0;
    },
    updateLocalProject: (state, action: PayloadAction<Project>) => {
      const index = state.projectsList.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projectsList[index] = action.payload;
      }
    },
    removeNewProject: (state) => {
      state.projectsList = state.projectsList.filter((p) => p.id !== 0);
      state.editingProjectId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch projects
      .addCase(fetchProjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProjects.fulfilled, (state, action) => {
        state.loading = false;
        state.projectsList = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchProjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch projects';
      })
      // Create project
      .addCase(createProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProject.fulfilled, (state, action) => {
        state.loading = false;
        // Remove the temporary project and add the real one
        state.projectsList = state.projectsList.filter((p) => p.id !== 0);
        state.projectsList.unshift(action.payload);
        state.editingProjectId = null;
      })
      .addCase(createProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create project';
      })
      // Update project
      .addCase(updateProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProject.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.projectsList.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.projectsList[index] = action.payload;
        }
        state.editingProjectId = null;
      })
      .addCase(updateProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update project';
      })
      // Delete project
      .addCase(deleteProject.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProject.fulfilled, (state, action) => {
        state.loading = false;
        state.projectsList = state.projectsList.filter((p) => p.id !== action.payload);
      })
      .addCase(deleteProject.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete project';
      });
  },
});

export const {
  setEditingProject,
  addNewProject,
  updateLocalProject,
  removeNewProject,
} = projectsSlice.actions;

export default projectsSlice.reducer;
