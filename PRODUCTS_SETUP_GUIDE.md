# Products Management - Quick Setup Guide

## ✅ Implementation Complete

The Products Management feature has been fully implemented and is ready to use!

## What Was Created

### 1. API Routes ✓
- `/api/product-categories` - CRUD operations for categories
- `/api/product-categories/upload` - Image upload with WebP conversion
- `/api/products` - CRUD operations for products
- `/api/products/upload` - Image upload with WebP conversion

### 2. Redux State Management ✓
- `productCategoriesSlice.ts` - State management for categories
- `productsSlice.ts` - State management for products
- Both slices integrated into main Redux store

### 3. Admin Page ✓
- `/admin/products` - Main products management page
- Two tabs: "Danh mục sản phẩm" and "Sản phẩm"
- Full CRUD operations with pagination
- Image upload with preview and WebP conversion

### 4. Image Upload Directories ✓
- `public/images/categories/` - Created for category images
- `public/images/products/` - Created for product images

## How to Use

### Access the Page
1. Navigate to `/admin/products` in your browser
2. Or click "Sản phẩm" in the admin sidebar

### Managing Product Categories

#### Create a Category
1. Click "Thêm Danh mục" button
2. Enter category name (required)
3. Enter description (optional)
4. Upload category image (optional)
   - Click "Choose File" to select an image
   - Preview will show immediately
   - Image will be converted to WebP on save
5. Click "Lưu" to save

#### Edit a Category
1. Click the edit icon (pencil) on any category
2. Modify the fields (name, description)
3. Upload new image if needed
4. Click "Lưu" to save changes

#### Delete a Category
1. Click the delete icon (trash) on any category
2. Confirm deletion
3. Note: Cannot delete categories that have products

### Managing Products

#### Create a Product
1. Switch to "Sản phẩm" tab
2. Click "Thêm Sản phẩm" button
3. Fill in the required fields:
   - Tên sản phẩm (Product name) - Required
   - Danh mục (Category) - Required
   - Mô tả (Description) - Optional
   - Giá (Price) - Optional
   - Thứ tự hiển thị (Display order) - Optional
   - Hình ảnh (Image) - Optional
   - Hiển thị sản phẩm (Active status) - Checkbox
4. Click "Lưu" to save

#### Upload Product Image
1. While editing a product, click "Choose File"
2. Select an image (JPEG, PNG, WebP, or GIF)
3. Preview will show immediately
4. Click "Lưu" to upload and save
5. Image will be automatically converted to WebP format

#### Edit a Product
1. Click the edit icon (pencil) on any product
2. Modify the fields
3. Upload new image if needed
4. Click "Lưu" to save changes

#### Delete a Product
1. Click the delete icon (trash) on any product
2. Confirm deletion

### Pagination
- Use the pagination controls at the bottom of each list
- Click page numbers to navigate
- Use Previous/Next buttons
- Shows 10 items per page by default

## Database Schema

The database models already exist in your Prisma schema:

### ProductCategory
- `id` - Auto-increment primary key
- `name` - Unique category name
- `description` - Optional description
- `imageUrl` - Optional category image path
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp
- `products` - Relation to products

### Product
- `id` - Auto-increment primary key
- `title` - Product name
- `description` - Optional description
- `categoryId` - Foreign key to category
- `price` - Optional price
- `isActive` - Visibility status
- `imageUrl` - Image path
- `order` - Display order
- `createdAt` - Creation timestamp
- `updatedAt` - Update timestamp

## Image Upload Specifications

### Supported Formats
- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)

### File Size Limit
- Maximum: 10MB per image

### Automatic Processing
- Images are automatically converted to WebP format
- Categories: Resized to max 800px width
- Products: Resized to max 1200px width
- Quality: 85% (optimized for web)
- Aspect ratio maintained

### Storage Location
- Category images: `/public/images/categories/`
- Product images: `/public/images/products/`

## Validation Rules

### Product Categories
- ✓ Name is required
- ✓ Name must be unique
- ✓ Cannot delete category with existing products

### Products
- ✓ Title is required
- ✓ Category must be selected
- ✓ Category must exist in database
- ✓ Price must be a valid number (if provided)
- ✓ Image must be valid format and size

## Error Messages

The system provides clear error messages for:
- Missing required fields
- Duplicate category names
- Attempting to delete category with products
- Invalid image format or size
- Database connection errors
- Network errors

## Features

### ✅ Product Categories Tab
- Create, read, update, delete categories
- Pagination (10 items per page)
- Image upload with preview and WebP conversion
- Product count display
- Inline editing
- Validation and error handling

### ✅ Products Tab
- Create, read, update, delete products
- Pagination (10 items per page)
- Image upload with preview
- Automatic WebP conversion
- Category dropdown
- Price formatting
- Active/Inactive toggle
- Display order control
- Inline editing

### ✅ Image Management
- Drag-and-drop or click to upload
- Real-time preview
- Automatic WebP conversion
- Size optimization
- Format validation
- Size validation (max 10MB)

### ✅ Pagination
- Server-side pagination
- Page navigation
- Previous/Next buttons
- Current page indicator
- Total items display
- Responsive design

## Technical Details

### State Management
- Redux Toolkit for global state
- Async thunks for API calls
- Optimistic updates for better UX
- Error handling with user feedback

### API Design
- RESTful endpoints
- Pagination support
- Filtering options
- Sorting capabilities
- Comprehensive error responses

### Image Processing
- Sharp library for optimization
- WebP conversion for smaller file sizes
- Automatic resizing
- Quality optimization
- Aspect ratio preservation

## Next Steps (Optional)

If you want to extend the feature, consider:
1. Adding search functionality
2. Implementing bulk operations
3. Adding product variants
4. Creating a public product catalog page
5. Adding SEO fields
6. Implementing product reviews

## Troubleshooting

### Images not uploading?
- Check file size (max 10MB)
- Verify file format (JPEG, PNG, WebP, GIF)
- Ensure directories exist: `public/images/categories/` and `public/images/products/`

### Cannot delete category?
- Check if category has products
- Delete or reassign products first

### Pagination not working?
- Check database connection
- Verify API endpoints are accessible
- Check browser console for errors

## Support

For issues or questions:
1. Check the implementation documentation: `PRODUCTS_FEATURE_IMPLEMENTATION.md`
2. Review the API endpoints and responses
3. Check browser console for errors
4. Verify database connection

## Summary

✅ All features implemented and working
✅ No linter errors
✅ Image directories created
✅ Redux state management configured
✅ API routes fully functional
✅ Pagination working on both tabs
✅ Image upload with WebP conversion
✅ Comprehensive validation and error handling

**The feature is ready to use at `/admin/products`!**
