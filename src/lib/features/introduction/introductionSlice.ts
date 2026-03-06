import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Achievement {
  icon: string;
  title: string;
  description: string;
}

export interface QuickIntroduction {
  title: string;
  description: string;
  videoUrl: string;
  achievements: Achievement[];
}

interface IntroductionState {
  data: QuickIntroduction;
  isEditing: boolean;
}

const initialState: IntroductionState = {
  data: {
    title: 'Khám phá Trọng Tín Solar',
    description: 'Xem video giới thiệu để hiểu rõ hơn về công ty, đội ngũ và quy trình làm việc chuyên nghiệp của chúng tôi.',
    videoUrl: '/videos/hero_video.mp4',
    achievements: [
      {
        icon: '🏆',
        title: 'Chứng nhận ISO 9001:2015',
        description: 'Hệ thống quản lý chất lượng quốc tế',
      },
      {
        icon: '⭐',
        title: 'Top 10 nhà phân phối',
        description: 'Năng lượng mặt trời uy tín năm 2023',
      },
      {
        icon: '🤝',
        title: 'Đối tác chính thức',
        description: 'Các thương hiệu hàng đầu thế giới',
      },
      {
        icon: '🔧',
        title: 'Đội ngũ kỹ thuật',
        description: 'Hơn 50 chuyên gia giàu kinh nghiệm',
      },
    ],
  },
  isEditing: false,
};

const introductionSlice = createSlice({
  name: 'introduction',
  initialState,
  reducers: {
    setEditing: (state, action: PayloadAction<boolean>) => {
      state.isEditing = action.payload;
    },
    updateIntroduction: (state, action: PayloadAction<QuickIntroduction>) => {
      state.data = action.payload;
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
    updateAchievement: (state, action: PayloadAction<{ index: number; achievement: Achievement }>) => {
      const { index, achievement } = action.payload;
      if (index >= 0 && index < state.data.achievements.length) {
        state.data.achievements[index] = achievement;
      }
    },
    updateAchievementField: (state, action: PayloadAction<{ index: number; field: keyof Achievement; value: string }>) => {
      const { index, field, value } = action.payload;
      if (index >= 0 && index < state.data.achievements.length) {
        state.data.achievements[index][field] = value;
      }
    },
    saveIntroduction: (state) => {
      // TODO: Add API call to save introduction
      state.isEditing = false;
    },
  },
});

export const {
  setEditing,
  updateIntroduction,
  updateTitle,
  updateDescription,
  updateVideoUrl,
  updateAchievement,
  updateAchievementField,
  saveIntroduction,
} = introductionSlice.actions;

export default introductionSlice.reducer;
