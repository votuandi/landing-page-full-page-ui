# Redux State Management Setup

This document describes the Redux Toolkit implementation for state management in the Landing Page application.

## Overview

The application uses **Redux Toolkit** (RTK) with React-Redux for centralized state management. Redux is configured to manage:

- **Banners**: Banner slides with CRUD operations
- **Introduction**: Quick introduction section content
- **Database**: Database connection status

## Architecture

### Directory Structure

```
src/
├── lib/
│   ├── store.ts                    # Redux store configuration
│   ├── hooks.ts                    # Typed Redux hooks
│   ├── StoreProvider.tsx           # Redux Provider wrapper component
│   └── features/
│       ├── banners/
│       │   └── bannersSlice.ts     # Banner state slice
│       ├── introduction/
│       │   └── introductionSlice.ts # Introduction state slice
│       └── database/
│           └── databaseSlice.ts    # Database status slice
```

## Core Files

### 1. Store Configuration (`src/lib/store.ts`)

The main Redux store configuration using `configureStore` from Redux Toolkit.

```typescript
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
```

### 2. Typed Hooks (`src/lib/hooks.ts`)

Custom typed hooks for better TypeScript support:

```typescript
import { useDispatch, useSelector, useStore } from 'react-redux';
import type { AppDispatch, AppStore, RootState } from './store';

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
```

### 3. Store Provider (`src/lib/StoreProvider.tsx`)

Client-side wrapper component that provides the Redux store to the application:

```typescript
'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { makeStore, AppStore } from './store';

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<AppStore>();
  if (!storeRef.current) {
    storeRef.current = makeStore();
  }
  return <Provider store={storeRef.current}>{children}</Provider>;
}
```

## Feature Slices

### Banners Slice (`src/lib/features/banners/bannersSlice.ts`)

Manages banner slides with full CRUD operations.

#### State Structure

```typescript
interface BannersState {
  banners: BannerSlide[];
  loading: boolean;
  error: string | null;
  editingBannerId: number | null;
}
```

#### Async Thunks

- `fetchBanners()` - Fetch all banners from API
- `createBanner(banner)` - Create a new banner
- `updateBanner({ id, banner })` - Update existing banner
- `deleteBanner(id)` - Delete a banner

#### Synchronous Actions

- `setEditingBanner(id)` - Set which banner is being edited
- `addNewBanner()` - Add a new temporary banner to state
- `updateLocalBanner(banner)` - Update banner locally (without API call)
- `clearError()` - Clear error state

#### Usage Example

```typescript
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchBanners, createBanner, deleteBanner } from '@/lib/features/banners/bannersSlice';

function BannerManager() {
  const dispatch = useAppDispatch();
  const { banners, loading, error } = useAppSelector((state) => state.banners);

  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  const handleDelete = (id: number) => {
    dispatch(deleteBanner(id));
  };

  // ... rest of component
}
```

### Introduction Slice (`src/lib/features/introduction/introductionSlice.ts`)

Manages the quick introduction section content.

#### State Structure

```typescript
interface IntroductionState {
  data: QuickIntroduction;
  isEditing: boolean;
}

interface QuickIntroduction {
  title: string;
  description: string;
  videoUrl: string;
  achievements: Achievement[];
}
```

#### Actions

- `setEditing(boolean)` - Toggle edit mode
- `updateIntroduction(data)` - Update entire introduction object
- `updateTitle(title)` - Update title only
- `updateDescription(description)` - Update description only
- `updateVideoUrl(url)` - Update video URL only
- `updateAchievement({ index, achievement })` - Update specific achievement
- `updateAchievementField({ index, field, value })` - Update specific field of an achievement
- `saveIntroduction()` - Save changes (currently only toggles edit mode)

#### Usage Example

```typescript
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { updateTitle, setEditing } from '@/lib/features/introduction/introductionSlice';

function IntroductionEditor() {
  const dispatch = useAppDispatch();
  const { data, isEditing } = useAppSelector((state) => state.introduction);

  const handleTitleChange = (newTitle: string) => {
    dispatch(updateTitle(newTitle));
  };

  // ... rest of component
}
```

### Database Slice (`src/lib/features/database/databaseSlice.ts`)

Manages database connection status checks.

#### State Structure

```typescript
interface DatabaseState {
  status: DatabaseStatus | null;
  checking: boolean;
}

interface DatabaseStatus {
  connected: boolean;
  status: 'success' | 'error' | 'checking';
  message?: string;
  responseTime?: string;
  databaseUrl?: string;
  databaseInfo?: { version?: string };
  errorCode?: string;
  details?: string;
  timestamp?: string;
}
```

#### Async Thunks

- `checkDatabaseConnection()` - Check database connection status

#### Actions

- `clearDatabaseStatus()` - Clear database status

#### Usage Example

```typescript
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { checkDatabaseConnection } from '@/lib/features/database/databaseSlice';

function DatabaseStatus() {
  const dispatch = useAppDispatch();
  const { status, checking } = useAppSelector((state) => state.database);

  const handleCheck = () => {
    dispatch(checkDatabaseConnection());
  };

  // ... rest of component
}
```

## Integration with Next.js

### Root Layout Setup

The Redux store is provided at the root level in `src/app/layout.tsx`:

```typescript
import StoreProvider from '@/lib/StoreProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>
        <StoreProvider>
          <ConditionalLayout>{children}</ConditionalLayout>
        </StoreProvider>
      </body>
    </html>
  );
}
```

### Using Redux in Components

1. **Import the hooks:**
   ```typescript
   import { useAppDispatch, useAppSelector } from '@/lib/hooks';
   ```

2. **Access state:**
   ```typescript
   const banners = useAppSelector((state) => state.banners.banners);
   const loading = useAppSelector((state) => state.banners.loading);
   ```

3. **Dispatch actions:**
   ```typescript
   const dispatch = useAppDispatch();
   dispatch(fetchBanners());
   ```

4. **Handle async actions:**
   ```typescript
   const handleSave = async () => {
     try {
       await dispatch(createBanner(bannerData)).unwrap();
       // Success handling
     } catch (error) {
       // Error handling
     }
   };
   ```

## Benefits of This Setup

1. **Type Safety**: Full TypeScript support with typed hooks and state
2. **Centralized State**: All application state in one predictable location
3. **DevTools Support**: Redux DevTools for debugging and time-travel
4. **Async Handling**: Built-in async action handling with createAsyncThunk
5. **Immutable Updates**: RTK uses Immer for safe state mutations
6. **Code Organization**: Feature-based slice organization
7. **Performance**: Optimized re-renders with selector memoization

## Best Practices

1. **Always use typed hooks** (`useAppDispatch`, `useAppSelector`) instead of plain Redux hooks
2. **Use `createAsyncThunk`** for all async operations (API calls)
3. **Handle loading and error states** in your components
4. **Use `.unwrap()`** when you need to handle async action results
5. **Keep slices focused** on a single feature or domain
6. **Use selectors** to derive computed state
7. **Avoid storing derived data** - compute it in selectors instead

## Testing

To test Redux-connected components:

```typescript
import { Provider } from 'react-redux';
import { makeStore } from '@/lib/store';

const store = makeStore();

<Provider store={store}>
  <YourComponent />
</Provider>
```

## Future Enhancements

- Add RTK Query for advanced API caching and synchronization
- Implement Redux Persist for state persistence
- Add middleware for logging or analytics
- Create reusable selector functions with `createSelector`
- Add optimistic updates for better UX

## Resources

- [Redux Toolkit Documentation](https://redux-toolkit.js.org/)
- [React-Redux Hooks API](https://react-redux.js.org/api/hooks)
- [Next.js with Redux](https://redux-toolkit.js.org/usage/nextjs)
