import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface HeroContent {
  id?: number;
  title: string;
  description: string;
  videoUrl: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  feature1Title: string;
  feature1Description: string;
  feature2Title: string;
  feature2Description: string;
}

interface IntroductionState {
  data: HeroContent;
  isEditing: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: IntroductionState = {
  data: {
    title: 'Giải pháp Năng lượng Mặt trời hàng đầu',
    description: 'Chuyên phân phối thiết bị năng lượng mặt trời chất lượng cao. Tấm pin solar, biến tần inverter, pin lưu trữ và giải pháp năng lượng tái tạo toàn diện.',
    videoUrl: '/videos/hero_video.mp4',
    stat1Value: '10+',
    stat1Label: 'Năm kinh nghiệm',
    stat2Value: '1000+',
    stat2Label: 'Dự án hoàn thành',
    stat3Value: '24/7',
    stat3Label: 'Hỗ trợ kỹ thuật',
    feature1Title: 'Thân thiện',
    feature1Description: 'Thân thiện môi trường',
    feature2Title: 'Tiết kiệm điện',
    feature2Description: 'Lên đến 90%',
  },
  isEditing: false,
  loading: false,
  error: null,
};

// Async thunks
export const fetchHeroContent = createAsyncThunk(
  'introduction/fetchHeroContent',
  async () => {
    const response = await fetch('/api/hero');
    if (!response.ok) {
      throw new Error('Failed to fetch hero content');
    }
    return await response.json();
  }
);

export const uploadHeroVideo = createAsyncThunk(
  'introduction/uploadHeroVideo',
  async (videoFile: File) => {
    const formData = new FormData();
    formData.append('video', videoFile);

    const response = await fetch('/api/hero/upload-video', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to upload video');
    }

    return await response.json();
  }
);

export const saveHeroContent = createAsyncThunk(
  'introduction/saveHeroContent',
  async (heroContent: HeroContent) => {
    const response = await fetch('/api/hero', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(heroContent),
    });
    if (!response.ok) {
      throw new Error('Failed to save hero content');
    }
    return await response.json();
  }
);

const introductionSlice = createSlice({
  name: 'introduction',
  initialState,
  reducers: {
    setEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },
    updateField: (state, action: PayloadAction<{ field: keyof HeroContent; value: string }>) => {
      const { field, value } = action.payload;
      (state.data as any)[field] = value;
    },
    updateTitle: (state, action: PayloadAction<string>) => {
      state.data.title = action.payload;
    },
    updateDescription: (state, action: PayloadAction<string>) => {
      state.data.description = action.payload;
    },
    updateVideoUrl: (state, action: PayloadAction<string>) => {
      state.data.videoUrl = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch hero content
      .addCase(fetchHeroContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHeroContent.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchHeroContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch hero content';
      })
      // Save hero content
      .addCase(saveHeroContent.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveHeroContent.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.isEditing = false;
      })
      .addCase(saveHeroContent.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save hero content';
      })
      // Upload hero video
      .addCase(uploadHeroVideo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadHeroVideo.fulfilled, (state, action) => {
        state.loading = false;
        state.data.videoUrl = action.payload.videoUrl;
      })
      .addCase(uploadHeroVideo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to upload video';
      });
  },
});

export const {
  setEditing,
  updateField,
  updateTitle,
  updateDescription,
  updateVideoUrl,
} = introductionSlice.actions;

export default introductionSlice.reducer;
