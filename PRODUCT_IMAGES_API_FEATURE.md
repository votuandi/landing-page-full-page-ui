# Product Images API Feature

## Overview

Created a new API endpoint to fetch all images associated with a product from the `StorageMedia` table, and integrated it with the `ProductDetailContent` component to display thumbnail images dynamically.

## Features Implemented

### 1. API Endpoint: GET `/api/products/[id]/images`

**Location:** `src/app/api/products/[id]/images/route.ts`

**Purpose:** Fetch all images from `StorageMedia` table for a specific product

**Query Parameters:** None (product ID is in the URL path)

**Filtering Criteria:**
- `parentId` = product ID
- `parentType` IN (`"product"`, `"product-text-editor"`)
- `type` = `"image"`

**Response Format:**

```json
{
  "success": true,
  "images": [
    {
      "id": 1,
      "url": "/images/products/product_1234567890.webp",
      "type": "product",
      "createdAt": "2026-03-08T10:30:00.000Z"
    },
    {
      "id": 2,
      "url": "/images/products/product_1234567891.webp",
      "type": "product-text-editor",
      "createdAt": "2026-03-08T10:31:00.000Z"
    }
  ],
  "count": 2
}
```

**Error Response:**

```json
{
  "error": "Failed to fetch product images",
  "message": "Detailed error message"
}
```

### 2. ProductDetailContent Component Updates

**Location:** `src/components/ProductDetailContent.tsx`

**New Features:**

#### A. State Management

Added new state variables:
```typescript
const [productImages, setProductImages] = useState<ProductImage[]>([]);
const [loadingImages, setLoadingImages] = useState(true);
const [selectedImage, setSelectedImage] = useState<string>(product.image);
```

#### B. Image Fetching

Added `useEffect` hook to fetch images from the API:
```typescript
useEffect(() => {
  const fetchProductImages = async () => {
    try {
      setLoadingImages(true);
      const response = await fetch(`/api/products/${product.id}/images`);
      
      if (response.ok) {
        const data = await response.json();
        setProductImages(data.images || []);
      }
    } catch (error) {
      console.error('Error fetching product images:', error);
      setProductImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  fetchProductImages();
}, [product.id]);
```

#### C. Dynamic Thumbnail Display

**Features:**
- Shows main product image as first thumbnail
- Shows up to 3 additional images from `StorageMedia`
- Displays loading skeleton while fetching
- Shows placeholder icons for empty slots
- Highlights selected image with blue border
- Click thumbnail to change main display image

**UI Layout:**
```
┌─────────────────────────────┐
│                             │
│   Main Display Image        │
│   (Selected Image)          │
│                             │
└─────────────────────────────┘

┌───────┬───────┬───────┬───────┐
│ Main  │ Add 1 │ Add 2 │ Add 3 │
│ Image │       │       │       │
└───────┴───────┴───────┴───────┘
   ↑ Thumbnails (4 slots)
```

**Loading State:**
- Shows 4 animated skeleton boxes while loading

**Interactive Features:**
- Click any thumbnail to display it in the main image area
- Selected thumbnail has blue border (`border-solar-blue`)
- Hover effect on non-selected thumbnails
- Automatic error handling for broken images

## Image Types Explained

### `parentType = "product"`
- **Source:** Additional images uploaded via "Ảnh bổ sung" field in admin
- **Upload Endpoint:** `/api/products/upload-additional`
- **Storage Location:** `public/images/products/`
- **Purpose:** Product gallery images, multiple angles, detail shots

### `parentType = "product-text-editor"`
- **Source:** Images uploaded via rich text editor (divt-text-editor)
- **Upload Endpoint:** `/api/upload?productId={id}`
- **Storage Location:** `public/images/products/`
- **Purpose:** Images embedded in Description, Specifications, or Warranty fields

## Usage Flow

### Admin Side (Upload Images)

1. **Navigate to Product Management:**
   - Go to `/admin/products`
   - Create new product or edit existing one

2. **Upload Main Image:**
   - Use "Hình ảnh sản phẩm" field
   - This becomes the default thumbnail

3. **Upload Additional Images:**
   - Use "Ảnh bổ sung (Additional Images)" field
   - Select multiple images (Ctrl/Cmd + Click)
   - These are saved with `parentType = "product"`

4. **Upload Images in Text Editor:**
   - Use image button in Description/Specifications/Warranty fields
   - These are saved with `parentType = "product-text-editor"`

5. **Save Product:**
   - All images are associated with the product
   - Records created in `StorageMedia` table

### Customer Side (View Images)

1. **Navigate to Product Detail Page:**
   - Go to `/product/[id]`
   - Example: `/product/23`

2. **View Images:**
   - Main image displays in large preview area
   - Thumbnails show below (main + up to 3 additional)
   - Loading skeleton appears while fetching

3. **Switch Images:**
   - Click any thumbnail to view in main area
   - Selected thumbnail highlighted with blue border
   - Smooth transition between images

## Technical Details

### API Implementation

**Route Structure:**
```
src/app/api/products/[id]/
├── route.ts              # Product CRUD operations
└── images/
    └── route.ts          # Image fetching endpoint (NEW)
```

**Database Query:**
```typescript
const images = await prisma.storageMedia.findMany({
  where: {
    parentId: productId,
    parentType: {
      in: ['product', 'product-text-editor']
    },
    type: 'image'
  },
  orderBy: {
    createdAt: 'asc'
  }
});
```

**Path Conversion:**
```typescript
// StorageMedia.path: "public/images/products/product_123.webp"
// Converted to URL: "/images/products/product_123.webp"
const url = image.path.replace('public', '');
```

### Component Implementation

**TypeScript Interface:**
```typescript
interface ProductImage {
  id: number;
  url: string;
  type: string;
  createdAt: string;
}
```

**Thumbnail Rendering Logic:**
1. Show loading skeleton if `loadingImages === true`
2. Show main product image as first thumbnail
3. Show up to 3 additional images from API
4. Fill remaining slots with placeholder icons
5. Total: Always 4 thumbnail slots

## Example Scenarios

### Scenario 1: Product with Multiple Images

**Product Data:**
- ID: 23
- Main Image: `/images/products/product_main_123.webp`
- Additional Images: 5 images in `StorageMedia`

**Display:**
- Main area: Shows main image initially
- Thumbnails: Main image + first 3 additional images
- User can click thumbnails to view different images
- Note: Only first 3 additional images shown (can be enhanced to show all)

### Scenario 2: Product with No Additional Images

**Product Data:**
- ID: 24
- Main Image: `/images/products/product_main_124.webp`
- Additional Images: 0 images in `StorageMedia`

**Display:**
- Main area: Shows main image
- Thumbnails: Main image + 3 placeholder icons
- Placeholders show camera icon (non-clickable)

### Scenario 3: Loading State

**Initial Load:**
- Main area: Shows main product image (from props)
- Thumbnails: 4 animated skeleton boxes
- After API response: Skeletons replaced with actual thumbnails

## Benefits

### For Customers
- ✅ View multiple product images
- ✅ Switch between images easily
- ✅ Better understanding of product
- ✅ Improved shopping experience

### For Admins
- ✅ Upload multiple product images
- ✅ Images automatically tracked in database
- ✅ Images displayed automatically on product page
- ✅ No manual configuration needed

### For Developers
- ✅ Clean API endpoint
- ✅ Reusable component logic
- ✅ Type-safe implementation
- ✅ Error handling built-in
- ✅ Loading states handled

## Error Handling

### API Errors
- Invalid product ID → 400 Bad Request
- Database error → 500 Internal Server Error
- Product not found → Returns empty array

### Component Errors
- API fetch fails → Shows only main image
- Image load fails → Shows placeholder icon
- Network error → Logs error, shows main image

## Performance Considerations

### API Optimization
- Single query to fetch all images
- Indexed database fields (`parentId`, `parentType`)
- Ordered by creation date (ascending)
- Returns only necessary fields

### Component Optimization
- Images loaded after component mount
- Loading state prevents layout shift
- Images cached by browser
- Efficient re-rendering with React hooks

## Future Enhancements

### 1. Image Carousel
- Show all images, not just first 3
- Left/right navigation arrows
- Swipe support on mobile
- Keyboard navigation (arrow keys)

### 2. Lightbox/Modal
- Click main image to open full-screen view
- Zoom functionality
- Download option
- Share functionality

### 3. Image Lazy Loading
- Load thumbnails only when visible
- Improve initial page load time
- Better performance on mobile

### 4. Image Optimization
- Generate multiple sizes (thumbnail, medium, large)
- Serve appropriate size based on viewport
- WebP with JPEG fallback

### 5. Pagination
- Show more than 3 additional images
- "View all images" button
- Grid view with all images

### 6. Video Support
- Include videos from `StorageMedia`
- Video thumbnails in gallery
- Video player in main area

## Testing

### Manual Testing Steps

1. **Test with Multiple Images:**
   - Create product with 5+ additional images
   - Visit product detail page
   - Verify thumbnails show correctly
   - Click each thumbnail
   - Verify main image changes

2. **Test with No Additional Images:**
   - Create product with only main image
   - Visit product detail page
   - Verify placeholders show correctly
   - Verify main image displays

3. **Test Loading State:**
   - Throttle network to "Slow 3G"
   - Visit product detail page
   - Verify skeleton loaders appear
   - Verify images load after delay

4. **Test Error Handling:**
   - Delete image file from filesystem
   - Keep database record
   - Visit product detail page
   - Verify broken image handled gracefully

### API Testing

**Test GET `/api/products/23/images`:**

```bash
# Using curl
curl http://localhost:3000/api/products/23/images

# Using browser
# Navigate to: http://localhost:3000/api/products/23/images
```

**Expected Response:**
```json
{
  "success": true,
  "images": [...],
  "count": 5
}
```

## Related Files

### New Files
- `src/app/api/products/[id]/images/route.ts` - API endpoint

### Modified Files
- `src/components/ProductDetailContent.tsx` - Component updates

### Related Files
- `src/app/api/products/upload-additional/route.ts` - Upload additional images
- `src/app/api/upload/route.ts` - Upload text editor images
- `src/app/product/[slug]/page.tsx` - Product detail page
- `prisma/schema.prisma` - Database schema

## Database Schema Reference

```prisma
model StorageMedia {
  id         Int      @id @default(autoincrement())
  parentId   Int?     // Product ID
  type       String   // "image" or "video"
  parentType String   // "product" or "product-text-editor"
  path       String   // "public/images/products/product_123.webp"
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([parentId, parentType])
  @@index([parentType])
}
```

## Summary

✅ **API Endpoint Created:** `/api/products/[id]/images`  
✅ **Component Updated:** `ProductDetailContent` with dynamic thumbnails  
✅ **Image Types Supported:** `product` and `product-text-editor`  
✅ **Loading States:** Skeleton loaders while fetching  
✅ **Error Handling:** Graceful fallbacks for missing images  
✅ **Interactive UI:** Click thumbnails to change main image  
✅ **Type Safe:** Full TypeScript implementation  
✅ **Responsive:** Works on all screen sizes  

The product detail page now dynamically loads and displays all associated images from the database, providing a better user experience for customers browsing products!
