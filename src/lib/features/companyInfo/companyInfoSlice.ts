import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";

export interface StoryItem {
  title: string;
  detail: string;
}

export interface Milestone {
  time: string;
  title: string;
  detail: string;
}

export interface CoreValue {
  title: string;
  detail: string;
}

export interface Achievement {
  title: string;
  detail: string;
}

export interface WhyChooseUs {
  title: string;
  detail: string;
}

export interface TeamMember {
  amount: string;
  title: string;
  detail: string;
}

export interface CompanyInfo {
  id: number;
  companyName: string;
  logoUrl?: string | null;
  slogan?: string | null;
  
  // Journey/Story section
  storyTitle?: string | null;
  storyDetail?: string | null;
  storyImageUrl?: string | null;
  storyVideoUrl?: string | null;
  storyItems?: StoryItem[] | null;
  
  // Milestones
  milestones?: Milestone[] | null;
  
  // Core values
  coreValues?: CoreValue[] | null;
  
  // Mission
  mission?: string | null;
  
  // Achievements
  achievements?: Achievement[] | null;
  
  // Team
  team?: TeamMember[] | null;
  
  // Why choose us
  whyChooseUs?: WhyChooseUs[] | null;
  
  // Social media
  facebook?: string | null;
  zalo?: string | null;
  youtube?: string | null;
  tiktok?: string | null;
  instagram?: string | null;
}

interface CompanyInfoState {
  data: CompanyInfo | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  uploadingLogo: boolean;
  uploadingStoryImage: boolean;
  uploadingStoryVideo: boolean;
}

const initialState: CompanyInfoState = {
  data: null,
  loading: false,
  saving: false,
  error: null,
  uploadingLogo: false,
  uploadingStoryImage: false,
  uploadingStoryVideo: false,
};

// Async thunks for API calls
export const fetchCompanyInfo = createAsyncThunk(
  "companyInfo/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/company-info");
      if (!response.ok) {
        throw new Error("Failed to fetch company info");
      }
      const data = await response.json();
      return data as CompanyInfo;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "An error occurred"
      );
    }
  }
);

export const updateCompanyInfo = createAsyncThunk(
  "companyInfo/update",
  async (companyInfo: Partial<CompanyInfo>, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/company-info", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(companyInfo),
      });

      if (!response.ok) {
        throw new Error("Failed to update company info");
      }

      const data = await response.json();
      return data as CompanyInfo;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to update company info"
      );
    }
  }
);

export const uploadLogo = createAsyncThunk(
  "companyInfo/uploadLogo",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("logo", file);

      const response = await fetch("/api/company-info/upload-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload logo");
      }

      const data = await response.json();
      return data.logoUrl as string;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to upload logo"
      );
    }
  }
);

export const uploadStoryImage = createAsyncThunk(
  "companyInfo/uploadStoryImage",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/company-info/upload-story-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload story image");
      }

      const data = await response.json();
      return data.imageUrl as string;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to upload story image"
      );
    }
  }
);

export const uploadStoryVideo = createAsyncThunk(
  "companyInfo/uploadStoryVideo",
  async (file: File, { rejectWithValue }) => {
    try {
      const formData = new FormData();
      formData.append("video", file);

      const response = await fetch("/api/company-info/upload-story-video", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to upload story video");
      }

      const data = await response.json();
      return data.videoUrl as string;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Failed to upload story video"
      );
    }
  }
);

const companyInfoSlice = createSlice({
  name: "companyInfo",
  initialState,
  reducers: {
    updateLocalField: (
      state,
      action: PayloadAction<{ field: keyof CompanyInfo; value: any }>
    ) => {
      if (state.data) {
        (state.data as any)[action.payload.field] = action.payload.value;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch company info
      .addCase(fetchCompanyInfo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyInfo.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchCompanyInfo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Update company info
      .addCase(updateCompanyInfo.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateCompanyInfo.fulfilled, (state, action) => {
        state.saving = false;
        state.data = action.payload;
      })
      .addCase(updateCompanyInfo.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      // Upload logo
      .addCase(uploadLogo.pending, (state) => {
        state.uploadingLogo = true;
        state.error = null;
      })
      .addCase(uploadLogo.fulfilled, (state, action) => {
        state.uploadingLogo = false;
        if (state.data) {
          state.data.logoUrl = action.payload;
        }
      })
      .addCase(uploadLogo.rejected, (state, action) => {
        state.uploadingLogo = false;
        state.error = action.payload as string;
      })
      // Upload story image
      .addCase(uploadStoryImage.pending, (state) => {
        state.uploadingStoryImage = true;
        state.error = null;
      })
      .addCase(uploadStoryImage.fulfilled, (state, action) => {
        state.uploadingStoryImage = false;
        if (state.data) {
          state.data.storyImageUrl = action.payload;
        }
      })
      .addCase(uploadStoryImage.rejected, (state, action) => {
        state.uploadingStoryImage = false;
        state.error = action.payload as string;
      })
      // Upload story video
      .addCase(uploadStoryVideo.pending, (state) => {
        state.uploadingStoryVideo = true;
        state.error = null;
      })
      .addCase(uploadStoryVideo.fulfilled, (state, action) => {
        state.uploadingStoryVideo = false;
        if (state.data) {
          state.data.storyVideoUrl = action.payload;
        }
      })
      .addCase(uploadStoryVideo.rejected, (state, action) => {
        state.uploadingStoryVideo = false;
        state.error = action.payload as string;
      });
  },
});

export const { updateLocalField, clearError } = companyInfoSlice.actions;
export default companyInfoSlice.reducer;
