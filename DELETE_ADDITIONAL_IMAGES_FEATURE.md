# Delete Additional Images Feature

## Overview
This feature allows users to delete both existing uploaded images and newly selected images (before upload) from the product form. Images marked for deletion are removed from both the database and filesystem after form submission.

## Features

### 1. Delete Newly Selected Images (Before Upload)
- **Location:** Images selected from device but not yet uploaded
- **Action:** Immediate removal from selection
- **UI:** Trash icon appears on hover
- **Effect:** Image is removed from preview, no server action needed

### 2. Delete Existing Uploaded Images
- **Location:** Images already uploaded and stored in database
- **Action:** Mark for deletion (deferred until form submission)
- **UI:** 
  - Trash icon appears on hover
  - Marked images show "Sẽ xóa" (Will delete) overlay
  - Border changes to red
  - Opacity reduced to 50%
  - Icon changes to X (undo mark)
- **Effect:** Image is deleted from database and filesystem on save

## User Interface

### Newly Selected Images
```
┌─────────────────┐
│     Preview     │  ← Hover shows trash icon
│                 │
│        🗑️       │  ← Click to remove immediately
└─────────────────┘
```

### Existing Uploaded Images

**Normal State:**
```
┌─────────────────┐
│   Uploaded      │  ← Green border
│     Image       │
│        🗑️       │  ← Hover shows trash icon
└─────────────────┘
```

**Marked for Deletion:**
```
┌─────────────────┐
│   Uploaded      │  ← Red border, 50% opacity
│     Image       │
│   "Sẽ xóa"     │  ← Overlay text
│        ❌       │  ← X icon (click to undo)
└─────────────────┘
```

## Implementation Details

### Frontend State Management

**File:** `src/app/(admin)/admin/products/page.tsx`

#### New State Variables
```typescript
const [imagesToDelete, setImagesToDelete] = useState<{ [key: number]: number[] }>({});
```
- Tracks storage media IDs marked for deletion
- Key: product ID
- Value: array of media IDs to delete

#### Handler Functions

1. **handleMarkImageForDeletion(productId, mediaId)**
   - Marks an existing image for deletion
   - Adds media ID to deletion list

2. **handleUnmarkImageForDeletion(productId, mediaId)**
   - Removes mark from an image
   - Removes media ID from deletion list

3. **handleRemoveSelectedImage(productId, index)**
   - Removes a newly selected image
   - Updates both file list and preview list

4. **handleDeleteMarkedImages(productId)**
   - Sends deletion request to API
   - Deletes marked images from database and filesystem
   - Clears deletion list on success

### API Endpoint

**File:** `src/app/api/storage-medias/delete/route.ts`

#### POST `/api/storage-medias/delete`

**Request:**
```json
{
  "mediaIds": [1, 2, 3]
}
```

**Response:**
```json
{
  "success": true,
  "deletedCount": 3,
  "deletionResults": [
    {
      "id": 1,
      "path": "public/images/products/product_123.webp",
      "deleted": true
    },
    {
      "id": 2,
      "path": "public/images/products/product_456.webp",
      "deleted": true
    },
    {
      "id": 3,
      "path": "public/images/products/product_789.webp",
      "deleted": false,
      "reason": "File not found"
    }
  ]
}
```

**Process:**
1. Validates media IDs
2. Fetches media records from database
3. Deletes files from filesystem
4. Deletes records from database
5. Returns deletion results

### Save Flow

When saving a product:

```
1. Save main product image (if changed)
2. Save product data to database
3. ✨ Delete marked images (NEW)
   - Send deletion request to API
   - Remove files from filesystem
   - Remove records from database
4. Upload new additional images
5. Show success message
6. Refresh product list
```

## Usage Guide

### For Users

#### Removing Newly Selected Images

1. Select images from device
2. Preview appears below file input
3. Hover over any preview image
4. Click trash icon 🗑️
5. Image is removed immediately

#### Deleting Existing Uploaded Images

1. Edit a product with existing additional images
2. Hover over any uploaded image
3. Click trash icon 🗑️
4. Image shows "Sẽ xóa" overlay with red border
5. To undo: Click X icon ❌
6. Click "Lưu" to save changes
7. Marked images are deleted from server

### Visual Feedback

- **Newly selected images:** Disappear immediately when deleted
- **Existing images marked for deletion:**
  - Red border
  - 50% opacity
  - "Sẽ xóa" text overlay
  - X icon to undo
- **Hover states:** Trash icon appears on hover for both types

## Code Examples

### Mark Image for Deletion
```typescript
const handleMarkImageForDeletion = (productId: number, mediaId: number) => {
  setImagesToDelete(prev => ({
    ...prev,
    [productId]: [...(prev[productId] || []), mediaId]
  }));
};
```

### Remove Selected Image
```typescript
const handleRemoveSelectedImage = (productId: number, index: number) => {
  setSelectedAdditionalImages(prev => {
    const updated = { ...prev };
    const files = [...(updated[productId] || [])];
    files.splice(index, 1);
    if (files.length === 0) {
      delete updated[productId];
    } else {
      updated[productId] = files;
    }
    return updated;
  });
  
  // Also update previews
  setAdditionalImagesPreviews(prev => {
    // ... similar logic
  });
};
```

### Delete from Server
```typescript
const handleDeleteMarkedImages = async (productId: number): Promise<boolean> => {
  const mediaIds = imagesToDelete[productId];
  if (!mediaIds || mediaIds.length === 0) return true;

  const response = await fetch('/api/storage-medias/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mediaIds }),
  });

  if (!response.ok) {
    throw new Error('Failed to delete images');
  }

  // Clear deletion list
  setImagesToDelete(prev => {
    const updated = { ...prev };
    delete updated[productId];
    return updated;
  });

  return true;
};
```

## UI Components

### Newly Selected Image with Delete Button
```tsx
<div className="relative h-20 bg-gray-100 rounded border-2 border-gray-200 group">
  <img src={preview} className="w-full h-full object-cover rounded" />
  <button
    type="button"
    onClick={() => handleRemoveSelectedImage(productId, idx)}
    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
  >
    <TrashIcon className="w-3 h-3" />
  </button>
</div>
```

### Existing Image with Delete/Undo Button
```tsx
<div className={`relative h-20 bg-gray-100 rounded border-2 group ${
  isMarkedForDeletion ? 'border-red-500 opacity-50' : 'border-green-200'
}`}>
  <img src={media.path.replace('public', '')} className="w-full h-full object-cover rounded" />
  <button
    type="button"
    onClick={() => {
      if (isMarkedForDeletion) {
        handleUnmarkImageForDeletion(productId, media.id);
      } else {
        handleMarkImageForDeletion(productId, media.id);
      }
    }}
    className={`absolute top-1 right-1 rounded-full p-1 transition-all ${
      isMarkedForDeletion
        ? 'bg-yellow-500 hover:bg-yellow-600 opacity-100'
        : 'bg-red-500 hover:bg-red-600 opacity-0 group-hover:opacity-100'
    } text-white`}
  >
    {isMarkedForDeletion ? <XMarkIcon className="w-3 h-3" /> : <TrashIcon className="w-3 h-3" />}
  </button>
  {isMarkedForDeletion && (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
      <span className="text-white text-xs font-bold">Sẽ xóa</span>
    </div>
  )}
</div>
```

## Error Handling

### Client-Side
- Shows alert if deletion fails
- Preserves deletion marks if save fails
- Provides clear error messages

### Server-Side
- Validates media IDs
- Checks file existence before deletion
- Returns detailed deletion results
- Handles partial failures gracefully

### Example Error Response
```json
{
  "error": "Failed to delete storage media",
  "message": "Database connection error"
}
```

## Database Operations

### Delete Query
```typescript
const deleteResult = await prisma.storageMedia.deleteMany({
  where: {
    id: {
      in: mediaIds
    }
  }
});
```

### Fetch Before Delete
```typescript
const mediaRecords = await prisma.storageMedia.findMany({
  where: {
    id: {
      in: mediaIds
    }
  }
});
```

## File System Operations

### Delete File
```typescript
import { unlink } from 'fs/promises';
import { existsSync } from 'fs';

const filepath = path.join(process.cwd(), media.path);
if (existsSync(filepath)) {
  await unlink(filepath);
}
```

## Testing Checklist

### Newly Selected Images
- [ ] Select multiple images
- [ ] Hover shows trash icon
- [ ] Click trash removes image from preview
- [ ] Removed image doesn't upload on save
- [ ] Can remove all selected images

### Existing Uploaded Images
- [ ] Edit product with existing images
- [ ] Hover shows trash icon
- [ ] Click trash marks image for deletion
- [ ] Marked image shows visual feedback
- [ ] Click X icon unmarks image
- [ ] Save deletes marked images from database
- [ ] Save deletes marked images from filesystem
- [ ] Can mark/unmark multiple times
- [ ] Can mark multiple images

### Edge Cases
- [ ] Delete all existing images
- [ ] Mark for deletion then cancel edit
- [ ] Mark for deletion then add new images
- [ ] Delete non-existent file (handles gracefully)
- [ ] Network error during deletion

## Future Enhancements

1. **Bulk Operations**
   - Select multiple images at once
   - Delete all button

2. **Confirmation Dialog**
   - Ask for confirmation before marking
   - Show count of images to be deleted

3. **Undo After Save**
   - Keep deleted images for 30 days
   - Restore deleted images

4. **Image Preview**
   - Click to view full size
   - Lightbox gallery

5. **Drag to Reorder**
   - Drag and drop to change order
   - Save order preference

## Related Files

- `src/app/(admin)/admin/products/page.tsx` - Product form with delete UI
- `src/app/api/storage-medias/delete/route.ts` - Deletion API endpoint
- `src/lib/features/products/productsSlice.ts` - Product state management
- `prisma/schema.prisma` - StorageMedia model definition
