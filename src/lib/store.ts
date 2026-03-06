import { configureStore } from '@reduxjs/toolkit';
import bannersReducer from './features/banners/bannersSlice';
import introductionReducer from './features/introduction/introductionSlice';
import databaseReducer from './features/database/databaseSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      banners: bannersReducer,
      introduction: introductionReducer,
      database: databaseReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
