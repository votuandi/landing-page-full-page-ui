# Redux Usage Examples

This document provides practical examples of using Redux in the application.

## Basic Component with Redux

### Example 1: Displaying Banners

```typescript
'use client';

import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { fetchBanners } from '@/lib/features/banners/bannersSlice';

export default function BannerList() {
  const dispatch = useAppDispatch();
  
  // Select state from Redux store
  const { banners, loading, error } = useAppSelector((state) => state.banners);

  // Fetch banners on component mount
  useEffect(() => {
    dispatch(fetchBanners());
  }, [dispatch]);

  if (loading) {
    return <div>Loading banners...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      {banners.map((banner) => (
        <div key={banner.id}>
          <h2>{banner.title}</h2>
          <p>{banner.description}</p>
        </div>
      ))}
    </div>
  );
}
```

## Creating and Updating Data

### Example 2: Banner Form with Redux

```typescript
'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { createBanner, updateBanner } from '@/lib/features/banners/bannersSlice';

export default function BannerForm({ bannerId }: { bannerId?: number }) {
  const dispatch = useAppDispatch();
  const banner = useAppSelector((state) => 
    state.banners.banners.find(b => b.id === bannerId)
  );

  const [formData, setFormData] = useState({
    title: banner?.title || '',
    subtitle: banner?.subtitle || '',
    description: banner?.description || '',
    buttonText: banner?.buttonText || '',
    buttonLink: banner?.buttonLink || '',
    backgroundImage: banner?.backgroundImage || '',
    backgroundColor: banner?.backgroundColor || '',
    isActive: banner?.isActive || false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (bannerId) {
        // Update existing banner
        await dispatch(updateBanner({
          id: bannerId,
          banner: { ...formData, order: 0 }
        })).unwrap();
        alert('Banner updated successfully!');
      } else {
        // Create new banner
        await dispatch(createBanner({
          ...formData,
          order: 0
        })).unwrap();
        alert('Banner created successfully!');
      }
    } catch (error) {
      alert('Failed to save banner');
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        placeholder="Title"
      />
      <textarea
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Description"
      />
      <button type="submit">
        {bannerId ? 'Update' : 'Create'} Banner
      </button>
    </form>
  );
}
```

## Deleting Data

### Example 3: Delete Banner with Confirmation

```typescript
'use client';

import { useAppDispatch } from '@/lib/hooks';
import { deleteBanner } from '@/lib/features/banners/bannersSlice';

export default function DeleteBannerButton({ bannerId }: { bannerId: number }) {
  const dispatch = useAppDispatch();

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this banner?')) {
      return;
    }

    try {
      await dispatch(deleteBanner(bannerId)).unwrap();
      alert('Banner deleted successfully!');
    } catch (error) {
      alert('Failed to delete banner');
      console.error(error);
    }
  };

  return (
    <button onClick={handleDelete} className="text-red-600">
      Delete
    </button>
  );
}
```

## Local State Updates

### Example 4: Editing Banner Locally

```typescript
'use client';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { setEditingBanner, updateLocalBanner } from '@/lib/features/banners/bannersSlice';

export default function BannerEditor({ bannerId }: { bannerId: number }) {
  const dispatch = useAppDispatch();
  const banner = useAppSelector((state) => 
    state.banners.banners.find(b => b.id === bannerId)
  );
  const isEditing = useAppSelector((state) => 
    state.banners.editingBannerId === bannerId
  );

  if (!banner) return null;

  const handleEdit = () => {
    dispatch(setEditingBanner(bannerId));
  };

  const handleChange = (field: string, value: any) => {
    dispatch(updateLocalBanner({
      ...banner,
      [field]: value
    }));
  };

  if (!isEditing) {
    return (
      <div>
        <h2>{banner.title}</h2>
        <button onClick={handleEdit}>Edit</button>
      </div>
    );
  }

  return (
    <div>
      <input
        value={banner.title}
        onChange={(e) => handleChange('title', e.target.value)}
      />
      <button onClick={() => dispatch(setEditingBanner(null))}>
        Cancel
      </button>
    </div>
  );
}
```

## Managing Introduction Content

### Example 5: Introduction Editor

```typescript
'use client';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import {
  setEditing,
  updateTitle,
  updateDescription,
  saveIntroduction
} from '@/lib/features/introduction/introductionSlice';

export default function IntroductionEditor() {
  const dispatch = useAppDispatch();
  const { data, isEditing } = useAppSelector((state) => state.introduction);

  const handleSave = () => {
    dispatch(saveIntroduction());
    alert('Introduction saved!');
  };

  if (!isEditing) {
    return (
      <div>
        <h1>{data.title}</h1>
        <p>{data.description}</p>
        <button onClick={() => dispatch(setEditing(true))}>
          Edit
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        value={data.title}
        onChange={(e) => dispatch(updateTitle(e.target.value))}
        placeholder="Title"
      />
      <textarea
        value={data.description}
        onChange={(e) => dispatch(updateDescription(e.target.value))}
        placeholder="Description"
      />
      <button onClick={handleSave}>Save</button>
      <button onClick={() => dispatch(setEditing(false))}>Cancel</button>
    </div>
  );
}
```

## Checking Database Status

### Example 6: Database Connection Checker

```typescript
'use client';

import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { checkDatabaseConnection } from '@/lib/features/database/databaseSlice';

export default function DatabaseStatus() {
  const dispatch = useAppDispatch();
  const { status, checking } = useAppSelector((state) => state.database);

  const handleCheck = () => {
    dispatch(checkDatabaseConnection());
  };

  return (
    <div>
      <button onClick={handleCheck} disabled={checking}>
        {checking ? 'Checking...' : 'Check Database Connection'}
      </button>

      {status && (
        <div className={status.connected ? 'text-green-600' : 'text-red-600'}>
          <p>Status: {status.connected ? 'Connected' : 'Disconnected'}</p>
          <p>Message: {status.message}</p>
          {status.responseTime && <p>Response Time: {status.responseTime}</p>}
        </div>
      )}
    </div>
  );
}
```

## Advanced: Multiple Selectors

### Example 7: Using Multiple Selectors

```typescript
'use client';

import { useAppSelector } from '@/lib/hooks';

export default function Dashboard() {
  // Select from multiple slices
  const activeBanners = useAppSelector((state) => 
    state.banners.banners.filter(b => b.isActive)
  );
  const introTitle = useAppSelector((state) => 
    state.introduction.data.title
  );
  const dbConnected = useAppSelector((state) => 
    state.database.status?.connected || false
  );

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Active Banners: {activeBanners.length}</p>
      <p>Introduction: {introTitle}</p>
      <p>Database: {dbConnected ? '✅ Connected' : '❌ Disconnected'}</p>
    </div>
  );
}
```

## Advanced: Optimistic Updates

### Example 8: Optimistic Banner Update

```typescript
'use client';

import { useAppDispatch } from '@/lib/hooks';
import { updateBanner, updateLocalBanner } from '@/lib/features/banners/bannersSlice';
import type { BannerSlide } from '@/lib/features/banners/bannersSlice';

export default function OptimisticBannerToggle({ banner }: { banner: BannerSlide }) {
  const dispatch = useAppDispatch();

  const handleToggleActive = async () => {
    // Optimistic update - update UI immediately
    dispatch(updateLocalBanner({
      ...banner,
      isActive: !banner.isActive
    }));

    try {
      // Send to server
      await dispatch(updateBanner({
        id: banner.id,
        banner: { isActive: !banner.isActive }
      })).unwrap();
    } catch (error) {
      // Revert on error
      dispatch(updateLocalBanner(banner));
      alert('Failed to update banner');
    }
  };

  return (
    <button onClick={handleToggleActive}>
      {banner.isActive ? 'Deactivate' : 'Activate'}
    </button>
  );
}
```

## Advanced: Custom Hooks

### Example 9: Custom Hook for Banner Operations

```typescript
// hooks/useBannerOperations.ts
import { useCallback } from 'react';
import { useAppDispatch } from '@/lib/hooks';
import {
  createBanner,
  updateBanner,
  deleteBanner,
  type BannerSlide
} from '@/lib/features/banners/bannersSlice';

export function useBannerOperations() {
  const dispatch = useAppDispatch();

  const handleCreate = useCallback(async (banner: Omit<BannerSlide, 'id'> & { order: number }) => {
    try {
      await dispatch(createBanner(banner)).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  const handleUpdate = useCallback(async (id: number, banner: Partial<BannerSlide>) => {
    try {
      await dispatch(updateBanner({ id, banner })).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await dispatch(deleteBanner(id)).unwrap();
      return { success: true };
    } catch (error) {
      return { success: false, error };
    }
  }, [dispatch]);

  return {
    createBanner: handleCreate,
    updateBanner: handleUpdate,
    deleteBanner: handleDelete,
  };
}

// Usage in component
export default function BannerManager() {
  const { createBanner, updateBanner, deleteBanner } = useBannerOperations();

  const handleCreate = async () => {
    const result = await createBanner({
      title: 'New Banner',
      subtitle: '',
      description: '',
      buttonText: '',
      buttonLink: '',
      backgroundImage: '',
      backgroundColor: '',
      isActive: true,
      order: 0
    });

    if (result.success) {
      alert('Banner created!');
    } else {
      alert('Failed to create banner');
    }
  };

  return <button onClick={handleCreate}>Create Banner</button>;
}
```

## Testing Components with Redux

### Example 10: Testing Redux-Connected Components

```typescript
// __tests__/BannerList.test.tsx
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { makeStore } from '@/lib/store';
import BannerList from '@/components/BannerList';

describe('BannerList', () => {
  it('renders banners from Redux store', () => {
    const store = makeStore();
    
    render(
      <Provider store={store}>
        <BannerList />
      </Provider>
    );

    // Your test assertions here
  });
});
```

## Common Patterns

### Pattern 1: Loading States

```typescript
const { loading, error, data } = useAppSelector((state) => state.banners);

if (loading) return <Spinner />;
if (error) return <ErrorMessage message={error} />;
return <DataDisplay data={data} />;
```

### Pattern 2: Conditional Rendering Based on State

```typescript
const isEditing = useAppSelector((state) => state.banners.editingBannerId !== null);
const hasActiveBanners = useAppSelector((state) => 
  state.banners.banners.some(b => b.isActive)
);

return (
  <div>
    {isEditing && <EditForm />}
    {!hasActiveBanners && <NoBannersMessage />}
  </div>
);
```

### Pattern 3: Derived State

```typescript
// Select and compute derived state
const activeBannerCount = useAppSelector((state) => 
  state.banners.banners.filter(b => b.isActive).length
);

const totalAchievements = useAppSelector((state) => 
  state.introduction.data.achievements.length
);
```

## Tips and Best Practices

1. **Always use typed hooks** (`useAppDispatch`, `useAppSelector`)
2. **Handle async errors** with try-catch and `.unwrap()`
3. **Show loading states** for better UX
4. **Use optimistic updates** for instant feedback
5. **Create custom hooks** for reusable logic
6. **Keep selectors simple** - compute in component if needed
7. **Dispatch in useEffect** for data fetching on mount
8. **Use useCallback** for dispatch functions in dependencies

## Common Pitfalls to Avoid

❌ **Don't** mutate state directly (Redux Toolkit handles this with Immer)
❌ **Don't** forget to handle loading and error states
❌ **Don't** dispatch in render (use useEffect or event handlers)
❌ **Don't** select entire state when you only need part of it
❌ **Don't** create new objects/arrays in selectors (causes re-renders)

✅ **Do** use typed hooks
✅ **Do** handle async action results with .unwrap()
✅ **Do** show user feedback for actions
✅ **Do** use memoization for expensive computations
✅ **Do** organize code by feature/domain
