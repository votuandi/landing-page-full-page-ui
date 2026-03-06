# Products Management Feature Implementation

## Overview

Successfully implemented a comprehensive Products Management system with two tabs:
1. **Danh mục sản phẩm** (Product Categories) - CRUD operations with pagination
2. **Sản phẩm** (Products) - CRUD operations with pagination and image upload

## Features Implemented

### ✅ Product Categories Tab
- Create, Read, Update, Delete product categories
- Pagination support (10 items per page)
- Category name, description, and image fields
- Image upload with automatic WebP conversion
- Image preview in both edit and view modes
- Product count display for each category
- Validation: Cannot delete categories with existing products
- Unique name constraint

### ✅ Products Tab
- Create, Read, Update, Delete products
- Pagination support (10 items per page)
- Fields: Title, Description, Category, Price, Active status, Image, Display order
- Image upload with automatic WebP conversion
- Image preview before upload
- Category dropdown selection
- Active/Inactive toggle for visibility control

### ✅ Image Upload System
- Support for JPEG, PNG, WebP, and GIF formats
- Automatic conversion to WebP format
- File size validation (max 10MB)
- Image optimization with Sharp library
- Separate upload endpoints for categories and products
- Real-time preview before upload

### ✅ Pagination
- Server-side pagination for both categories and products
- Configurable items per page (default: 10)
- Page navigation with Previous/Next buttons
- Direct page number navigation
- Display of current range and total items
- Ellipsis for large page counts

## Files Created

### API Routes
```
src/app/api/
├── product-categories/
│   ├── route.ts                    # GET (paginated), POST
│   ├── [id]/
│   │   └── route.ts                # PUT, DELETE
│   └── upload/
│       └── route.ts                # POST - Image upload with WebP conversion
└── products/
    ├── route.ts                    # GET (paginated), POST
    ├── [id]/
    │   └── route.ts                # PUT, DELETE
    └── upload/
        └── route.ts                # POST - Image upload with WebP conversion
```

### Redux State Management
```
src/lib/features/
├── productCategories/
│   └── productCategoriesSlice.ts   # Redux slice for categories
└── products/
    └── productsSlice.ts            # Redux slice for products
```

### Admin Page
```
src/app/(admin)/admin/products/
└── page.tsx                        # Main products management page with tabs
```

### Store Configuration
```
src/lib/store.ts                    # Updated with new reducers
```

## Database Schema (Already Existed)

### ProductCategory Model
```prisma
model ProductCategory {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?
  imageUrl    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  products    Product[]
}
```

### Product Model
```prisma
model Product {
  id          Int             @id @default(autoincrement())
  title       String
  description String?
  categoryId  Int
  category    ProductCategory @relation(fields: [categoryId], references: [id])
  price       Float?
  isActive    Boolean         @default(true)
  imageUrl    String?
  order       Int             @default(0)
  createdAt   DateTime        @default(now())
  updatedAt   DateTime        @updatedAt
}
```

## API Endpoints

### Product Categories

#### GET `/api/product-categories`
Fetch all product categories with pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `orderBy` (string, default: 'createdAt') - Sort field
- `order` (string, default: 'desc') - Sort direction

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Category Name",
      "description": "Category description",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "_count": {
        "products": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

#### POST `/api/product-categories`
Create a new product category.

**Request Body:**
```json
{
  "name": "Category Name",
  "description": "Optional description",
  "imageUrl": "/images/categories/category_1234567890.webp"
}
```

#### PUT `/api/product-categories/[id]`
Update an existing product category.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "imageUrl": "/images/categories/category_1234567890.webp"
}
```

#### DELETE `/api/product-categories/[id]`
Delete a product category (only if it has no products).

#### POST `/api/product-categories/upload`
Upload and convert category image to WebP.

**Request:** FormData with 'image' field
**Response:**
```json
{
  "success": true,
  "imageUrl": "/images/categories/category_1234567890.webp",
  "filename": "category_1234567890.webp",
  "message": "Image uploaded and converted to WebP successfully"
}
```

### Products

#### GET `/api/products`
Fetch all products with pagination.

**Query Parameters:**
- `page` (number, default: 1) - Page number
- `limit` (number, default: 10) - Items per page
- `categoryId` (number, optional) - Filter by category
- `isActive` (boolean, optional) - Filter by active status
- `orderBy` (string, default: 'createdAt') - Sort field
- `order` (string, default: 'desc') - Sort direction

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Product Name",
      "description": "Product description",
      "categoryId": 1,
      "category": {
        "id": 1,
        "name": "Category Name"
      },
      "price": 1000000,
      "isActive": true,
      "imageUrl": "/images/products/product_1234567890.webp",
      "order": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

#### POST `/api/products`
Create a new product.

**Request Body:**
```json
{
  "title": "Product Name",
  "description": "Product description",
  "categoryId": 1,
  "price": 1000000,
  "isActive": true,
  "imageUrl": "/images/products/product_1234567890.webp",
  "order": 0
}
```

#### PUT `/api/products/[id]`
Update an existing product.

**Request Body:** Same as POST (all fields optional)

#### DELETE `/api/products/[id]`
Delete a product.

#### POST `/api/products/upload`
Upload and convert product image to WebP.

**Request:** FormData with 'image' field
**Response:**
```json
{
  "success": true,
  "imageUrl": "/images/products/product_1234567890.webp",
  "filename": "product_1234567890.webp",
  "message": "Image uploaded and converted to WebP successfully"
}
```

## Redux State Structure

### Product Categories State
```typescript
{
  categories: ProductCategory[],
  loading: boolean,
  error: string | null,
  editingCategoryId: number | null,
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  } | null
}
```

### Products State
```typescript
{
  products: Product[],
  loading: boolean,
  error: string | null,
  editingProductId: number | null,
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  } | null
}
```

## Redux Actions

### Product Categories
- `fetchProductCategories({ page, limit })` - Fetch paginated categories
- `createProductCategory({ name, description })` - Create new category
- `updateProductCategory({ id, category })` - Update category
- `deleteProductCategory(id)` - Delete category
- `setEditingCategory(id)` - Set category in edit mode
- `addNewCategory()` - Add temporary new category
- `updateLocalCategory(category)` - Update local state
- `removeNewCategory()` - Remove temporary category

### Products
- `fetchProducts({ page, limit, categoryId })` - Fetch paginated products
- `createProduct(product)` - Create new product
- `updateProduct({ id, product })` - Update product
- `deleteProduct(id)` - Delete product
- `setEditingProduct(id)` - Set product in edit mode
- `addNewProduct()` - Add temporary new product
- `updateLocalProduct(product)` - Update local state
- `removeNewProduct()` - Remove temporary product

## UI Components

### Page Structure
- Header with title and description
- Tab navigation (Categories / Products)
- Add button for each tab
- List/Grid view with inline editing
- Pagination controls at bottom

### Category Card (Edit Mode)
- Image preview section
- Name input (required)
- Description textarea
- Image upload with preview
- Save/Cancel buttons with upload progress

### Category Card (View Mode)
- Category image thumbnail
- Category name
- Description
- Product count
- Edit/Delete buttons

### Product Card (Edit Mode)
- Title input (required)
- Category dropdown (required)
- Description textarea
- Price input
- Display order input
- Image upload with preview
- Active/Inactive checkbox
- Save/Cancel buttons

### Product Card (View Mode)
- Product image thumbnail
- Title and category
- Description
- Price
- Active status badge
- Edit/Delete buttons

### Pagination Component
- Previous/Next buttons
- Page numbers with ellipsis
- Current page highlight
- Total items display
- Responsive design (mobile/desktop)

## Image Upload Flow

1. User selects image from device
2. Client-side validation (file type, size)
3. Preview generated using FileReader
4. On save, image uploaded to server
5. Server validates and converts to WebP using Sharp
6. Optimized image saved to `/public/images/[categories|products]/`
7. Image URL returned and saved to database

## Validation Rules

### Product Categories
- Name: Required, unique
- Description: Optional
- Cannot delete if has products

### Products
- Title: Required
- Category: Required (must exist)
- Description: Optional
- Price: Optional, numeric
- Image: Optional, max 10MB, valid image format
- Order: Optional, numeric (default: 0)
- Active: Boolean (default: true)

## Error Handling

- Database connection errors
- Validation errors with specific messages
- Duplicate name errors
- Category deletion with products
- Image upload errors
- File size/type validation errors
- Network errors with user-friendly messages

## Success Messages

- Category created/updated/deleted successfully
- Product created/updated/deleted successfully
- Image uploaded and converted successfully

## Navigation

The page is accessible via:
- URL: `/admin/products`
- Admin sidebar: "Sản phẩm" menu item
- Already configured in admin layout

## Dependencies Used

- **Next.js** - Framework
- **React** - UI library
- **Redux Toolkit** - State management
- **Prisma** - Database ORM
- **Sharp** - Image processing and WebP conversion
- **Heroicons** - UI icons
- **Tailwind CSS** - Styling

## Testing Recommendations

1. Test pagination with various page sizes
2. Test category deletion with and without products
3. Test image upload with different formats and sizes
4. Test form validation for required fields
5. Test duplicate category name handling
6. Test product filtering by category
7. Test active/inactive toggle
8. Test responsive design on mobile devices

## Future Enhancements (Optional)

- Bulk operations (delete multiple items)
- Search/filter functionality
- Drag-and-drop image upload
- Image gallery for products (multiple images)
- Product variants (size, color, etc.)
- Stock management
- Export to CSV/Excel
- Import from CSV/Excel
- Product tags/labels
- SEO fields (meta title, description)
- Rich text editor for descriptions

## Conclusion

The Products Management feature is fully implemented with:
- ✅ Complete CRUD operations for categories and products
- ✅ Pagination support for both tabs
- ✅ Image upload with automatic WebP conversion
- ✅ Responsive UI with inline editing
- ✅ Comprehensive validation and error handling
- ✅ Redux state management
- ✅ RESTful API endpoints
- ✅ No linter errors

The feature is ready for use and can be accessed at `/admin/products`.
