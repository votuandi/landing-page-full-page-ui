# Product Text Editor Storage Media Fix

## Issue
Uploaded images and videos via the draft-text-editor when creating products were not being saved in the `StorageMedia` table. This only worked correctly when editing existing products.

## Root Cause
The `/api/upload` endpoint (used by the RichTextEditor for products) had a condition that prevented saving to `StorageMedia` when `productId` was `0` (new products):

```typescript
// Old code - only saved when productId existed and was not '0'
if (productId && productId !== '0') {
  await prisma.storageMedia.create({
    // ...
  });
}
```

## Solution
The fix implements the same pattern used by the news editor, which properly handles media uploads for both new and existing items:

### 1. Updated `/api/upload/route.ts`
- **Changed**: Now saves to `StorageMedia` even when `productId` is `0`
- **How**: Sets `parentId` to `null` for new products (productId = 0)
- **Why**: Allows orphaned media files to be associated with the product after creation

```typescript
// New code - saves for both new and existing products
try {
  const parentIdValue = productId && productId !== '0' ? parseInt(productId) : null;
  
  await prisma.storageMedia.create({
    data: {
      parentId: parentIdValue,
      type: isImage ? 'image' : 'video',
      parentType: 'product-text-editor',
      path: filePath,
    },
  });
} catch (dbError) {
  console.error('Error saving to StorageMedia:', dbError);
  // Continue even if DB save fails - the file is already uploaded
}
```

### 2. Updated `/api/products/route.ts` (POST)
- **Added**: Media association logic after product creation
- **How**: Extracts media URLs from `description`, `specifications`, and `guarantee` fields
- **Why**: Links orphaned media files (parentId = null) to the newly created product

```typescript
// After creating the product
// Extract media URLs from content fields
const mediaUrls: string[] = []
const contentFields = [description, specifications, guarantee].filter(Boolean)

// Parse HTML to find <img> and <video> tags
// Convert URLs to storage paths
// Update StorageMedia records where parentId is null

await prisma.storageMedia.updateMany({
  where: {
    path: { in: storagePaths },
    parentId: null,
    parentType: 'product-text-editor'
  },
  data: {
    parentId: product.id
  }
})
```

### 3. Updated `/api/products/[id]/route.ts` (PUT)
- **Added**: Media association logic after product update
- **How**: Same as POST - extracts media URLs and updates orphaned records
- **Why**: Ensures newly uploaded media during edits is properly associated

## How It Works

### Creating a New Product
1. User uploads image/video in RichTextEditor
2. `/api/upload` saves file and creates `StorageMedia` record with `parentId = null`
3. User fills in product details and clicks Save
4. `/api/products` (POST) creates the product
5. POST handler extracts media URLs from content fields
6. POST handler updates `StorageMedia` records, setting `parentId` to the new product's ID

### Editing an Existing Product
1. User uploads image/video in RichTextEditor
2. `/api/upload` saves file and creates `StorageMedia` record with `parentId = productId`
3. User updates product details and clicks Save
4. `/api/products/[id]` (PUT) updates the product
5. PUT handler also checks for orphaned media (in case of concurrent edits)
6. PUT handler updates any orphaned `StorageMedia` records

## Benefits
1. ✅ Consistent behavior between creating and editing products
2. ✅ All media files are tracked in `StorageMedia` table
3. ✅ Easier to manage and clean up unused media files
4. ✅ Matches the implementation pattern used by news articles
5. ✅ Supports both images and videos

## Files Modified
- `src/app/api/upload/route.ts` - Upload endpoint for text editor
- `src/app/api/products/route.ts` - Product creation endpoint
- `src/app/api/products/[id]/route.ts` - Product update endpoint

## Testing Checklist
- [ ] Create a new product with images in description field
- [ ] Create a new product with videos in description field
- [ ] Create a new product with images in specifications field
- [ ] Create a new product with images in guarantee field
- [ ] Edit an existing product and add new images
- [ ] Edit an existing product and add new videos
- [ ] Verify `StorageMedia` records are created with correct `parentType`
- [ ] Verify orphaned media (parentId = null) is updated after product creation
- [ ] Verify media files are properly linked to products

## Database Schema
The `StorageMedia` table stores:
- `id`: Primary key
- `parentId`: ID of the parent record (Product, News, etc.) - can be null initially
- `parentType`: Type of parent ('product-text-editor', 'news-text-editor', etc.)
- `type`: Media type ('image' or 'video')
- `path`: File system path (e.g., 'public/images/products/product_1234567890.webp')
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

## Notes
- The fix follows the same pattern as the news editor implementation
- Error handling ensures product creation/update succeeds even if media association fails
- Media files are saved to disk immediately, database association happens after
- Orphaned media files (parentId = null) can be cleaned up periodically if needed
