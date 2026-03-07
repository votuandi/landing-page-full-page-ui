# Additional Images Feature - Implementation Summary

## Overview
This document describes the implementation of the additional images feature for products, including storage tracking for both additional product images and text-editor uploaded images.

## Features Implemented

### 1. Database Schema - `storage_medias` Table

**Location:** `prisma/schema.prisma`

A new `StorageMedia` model was added to track all uploaded media files:

```prisma
model StorageMedia {
  id          Int      @id @default(autoincrement())
  parentId    Int?     // Link to the product/news/etc. containing it
  type        String   // "image" or "video"
  parentType  String   // "product", "news", "text-editor", etc.
  path        String   // File path
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  product     Product? @relation(fields: [parentId], references: [id], map: "product_storage_media")
  
  @@index([parentId, parentType])
  @@index([parentType])
}
```

**Fields:**
- `id`: Unique identifier
- `parentId`: Links to the product/news/etc. (nullable for orphaned files)
- `type`: Type of media ("image" or "video")
- `parentType`: Context of the media:
  - `"product"`: Additional product images
  - `"text-editor"`: Images uploaded via rich text editor
  - Future: `"news"`, etc.
- `path`: File path (e.g., `"public/images/product_1772791367335.webp"`)

### 2. API Endpoints

#### A. `/api/products/upload-additional` (POST)
**Purpose:** Upload multiple additional images for a product

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `images`: Multiple image files
  - `productId`: Product ID (optional for new products)

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "imageUrl": "/images/products/product_1772791367335.webp",
      "path": "public/images/products/product_1772791367335.webp",
      "filename": "product_1772791367335.webp"
    }
  ]
}
```

**Features:**
- Validates file types (JPEG, PNG, WebP, GIF)
- Validates file size (max 10MB per file)
- Converts to WebP format (85% quality)
- Resizes to max 1200px width
- Saves to `public/images/products/`
- Creates records in `storage_medias` table with `parentType = "product"`

#### B. `/api/upload` (POST)
**Purpose:** Upload images from rich text editor (divt-text-editor)

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Query Params: `productId` (optional)
- Body: `image` file

**Response:**
```json
{
  "success": true,
  "imageUrl": "/images/products/product_1772791367335.webp",
  "filename": "product_1772791367335.webp"
}
```

**Features:**
- Tracks images uploaded via text editor
- Saves to `storage_medias` table with `parentType = "text-editor"`
- Helps identify orphaned files for future cleanup
- Same validation and conversion as additional images

### 3. Product API Updates

**Files Modified:**
- `src/app/api/products/route.ts`
- `src/app/api/products/[id]/route.ts`

**Changes:**
- Added `storageMedias` relation to product queries
- Filters by `parentType = "product"` to get only additional images
- Returns storage media data with product responses

### 4. Frontend Implementation

#### A. Product Redux Slice
**File:** `src/lib/features/products/productsSlice.ts`

Added `StorageMedia` interface and included it in the `Product` interface:

```typescript
export interface StorageMedia {
  id: number;
  parentId: number | null;
  type: string;
  parentType: string;
  path: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  // ... existing fields
  storageMedias?: StorageMedia[];
}
```

#### B. Product Form UI
**File:** `src/app/(admin)/admin/products/page.tsx`

**New State Variables:**
```typescript
const [selectedAdditionalImages, setSelectedAdditionalImages] = useState<{ [key: number]: File[] }>({});
const [uploadingAdditionalImages, setUploadingAdditionalImages] = useState<{ [key: number]: boolean }>({});
const [additionalImagesPreviews, setAdditionalImagesPreviews] = useState<{ [key: number]: string[] }>({});
```

**New Handlers:**
- `handleAdditionalImagesChange()`: Handles file selection and preview generation
- `handleUploadAdditionalImages()`: Uploads selected images to the server

**UI Components:**
- Multiple file input field for additional images
- Preview grid showing selected images before upload
- Display grid showing already uploaded images
- Upload progress indicators

**Form Field:**
```tsx
<div>
  <label>Ảnh bổ sung (Additional Images)</label>
  <input
    type="file"
    accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
    multiple
    onChange={(e) => handleAdditionalImagesChange(product.id, e)}
    disabled={uploadingAdditionalImages[product.id]}
  />
  {/* Preview and uploaded images display */}
</div>
```

#### C. Rich Text Editor
**File:** `src/components/RichTextEditor.tsx`

**Updates:**
- Added `productId` prop
- Passes productId as query parameter to upload endpoint
- Enables tracking of text-editor images

**Usage:**
```tsx
<RichTextEditor
  value={product.description || ''}
  onChange={(value) => dispatch(updateLocalProduct({ ...product, description: value }))}
  placeholder="Mô tả chi tiết sản phẩm"
  productId={product.id !== 0 ? product.id : undefined}
/>
```

### 5. Save Flow

When creating/editing a product:

1. **Main Product Image:**
   - Uploaded via `/api/products/upload`
   - Saved to `imageUrl` field in Product table

2. **Additional Images:**
   - Selected via multiple file input
   - Uploaded via `/api/products/upload-additional` after product is saved
   - Saved to `storage_medias` table with `parentType = "product"`

3. **Text Editor Images:**
   - Uploaded automatically by divt-text-editor during editing
   - Uploaded via `/api/upload` with productId query param
   - Saved to `storage_medias` table with `parentType = "text-editor"`

## Usage Guide

### For Admins

1. **Navigate to Product Management:**
   - Go to `/admin/products`
   - Click "Thêm Sản phẩm" or edit existing product

2. **Upload Main Image:**
   - Use "Hình ảnh sản phẩm" field
   - Select single image file

3. **Upload Additional Images:**
   - Use "Ảnh bổ sung (Additional Images)" field
   - Select multiple image files (Ctrl/Cmd + Click)
   - Preview appears automatically
   - Images upload when you save the product

4. **Upload Images in Text Editor:**
   - Use the image button in the rich text editor (Description, Specifications, Warranty)
   - Images are tracked automatically
   - Associated with the product via `parentType = "text-editor"`

5. **Save Product:**
   - Click "Lưu" button
   - Main image uploads first
   - Product is saved
   - Additional images upload automatically
   - Success message appears

### Image Requirements

- **Formats:** JPEG, PNG, WebP, GIF
- **Max Size:** 10MB per image
- **Output:** Automatically converted to WebP (85% quality)
- **Dimensions:** Resized to max 1200px width (maintains aspect ratio)

## Database Queries

### Get Product with Additional Images
```typescript
const product = await prisma.product.findUnique({
  where: { id: productId },
  include: {
    storageMedias: {
      where: {
        parentType: 'product'
      }
    }
  }
});
```

### Get All Text Editor Images for a Product
```typescript
const textEditorImages = await prisma.storageMedia.findMany({
  where: {
    parentId: productId,
    parentType: 'text-editor'
  }
});
```

### Find Orphaned Images (Future Cleanup)
```typescript
const orphanedImages = await prisma.storageMedia.findMany({
  where: {
    parentId: null
  }
});
```

## Future Enhancements

1. **Image Deletion:**
   - Add delete button for individual additional images
   - Clean up files from filesystem when deleted from database

2. **Orphaned File Cleanup:**
   - Periodic job to identify and remove orphaned files
   - Images in `storage_medias` with no parent
   - Images in text editor that were removed from content

3. **Image Reordering:**
   - Drag-and-drop to reorder additional images
   - Add `order` field to `StorageMedia` model

4. **Image Gallery:**
   - Display additional images in product detail page
   - Image carousel/lightbox functionality

5. **Extend to Other Entities:**
   - Add similar functionality for News
   - Support for video uploads

## Technical Notes

- All images are converted to WebP format for optimal file size
- Images are stored in `public/images/products/` directory
- Filename format: `product_{timestamp}_{random}.webp`
- Database uses indexes on `parentId` and `parentType` for efficient queries
- The system supports tracking images even for new products (productId = 0) by updating after save

## Migration

Database schema was updated using:
```bash
npx prisma db push
npx prisma generate
```

No data migration needed as this is a new feature.
