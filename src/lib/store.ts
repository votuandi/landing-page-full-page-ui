import { configureStore } from '@reduxjs/toolkit';
import bannersReducer from './features/banners/bannersSlice';
import databaseReducer from './features/database/databaseSlice';
import introductionReducer from './features/introduction/introductionSlice';
import partnersReducer from './features/partners/partnersSlice';
import productCategoriesReducer from './features/productCategories/productCategoriesSlice';
import productsReducer from './features/products/productsSlice';
import newsReducer from './features/news/newsSlice';
import projectsReducer from './features/projects/projectsSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      banners: bannersReducer,
      database: databaseReducer,
      introduction: introductionReducer,
      partners: partnersReducer,
      productCategories: productCategoriesReducer,
      products: productsReducer,
      news: newsReducer,
      projects: projectsReducer,
    },
  });
};

// Infer the type of makeStore
export type AppStore = ReturnType<typeof makeStore>;
// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
