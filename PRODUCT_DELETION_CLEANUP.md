# Product Deletion with Complete Cleanup

## Overview
When a product is deleted, the system now automatically cleans up all associated files and database records to prevent orphaned data and disk space waste.

## What Gets Deleted

### 1. Product Record
- Main product entry from `Product` table

### 2. Storage Media Records
All records from `StorageMedia` table where:
- `parentId` = product ID
- `parentType` = `"product"` OR `"product-text-editor"`

### 3. Files from Filesystem
All physical files including:
- **Main product image:** From `Product.imageUrl`
- **Additional images:** From `StorageMedia` with `parentType="product"`
- **Text editor images/videos:** From `StorageMedia` with `parentType="product-text-editor"`

## Parent Types Explained

### `"product"`
Additional images uploaded via the "Ảnh bổ sung" field:
- Uploaded through `/api/products/upload-additional`
- Stored in `public/images/products/`
- Multiple images per product

### `"product-text-editor"`
Media (images/videos) uploaded via rich text editor:
- Uploaded through `/api/upload`
- Images: `public/images/products/`
- Videos: `public/videos/products/`
- Embedded in Description, Specifications, or Warranty fields

## Implementation Details

### API Endpoint: DELETE `/api/products/[id]`

**File:** `src/app/api/products/[id]/route.ts`

#### Process Flow

```
1. Validate product ID
2. Fetch product with related storage media
3. Collect all file paths to delete:
   - Main product image (imageUrl)
   - Storage media files (storageMedias)
4. Delete files from filesystem
5. Delete storage media records from database
6. Delete product record from database
7. Return deletion results
```

#### Code Implementation

```typescript
// Fetch product with related storage media
const existingProduct = await prisma.product.findUnique({
  where: { id },
  include: {
    storageMedias: {
      where: {
        OR: [
          { parentType: 'product' },
          { parentType: 'product-text-editor' }
        ]
      }
    }
  }
})

// Collect file paths
const filesToDelete: string[] = []

// Main product image
if (existingProduct.imageUrl) {
  const imagePath = path.join(process.cwd(), 'public', existingProduct.imageUrl)
  filesToDelete.push(imagePath)
}

// Storage media files
existingProduct.storageMedias.forEach(media => {
  const mediaPath = path.join(process.cwd(), media.path)
  filesToDelete.push(mediaPath)
})

// Delete files
for (const filepath of filesToDelete) {
  if (existsSync(filepath)) {
    await unlink(filepath)
  }
}

// Delete database records
await prisma.storageMedia.deleteMany({
  where: {
    parentId: id,
    OR: [
      { parentType: 'product' },
      { parentType: 'product-text-editor' }
    ]
  }
})

await prisma.product.delete({ where: { id } })
```

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "Product deleted successfully",
  "filesDeleted": 5,
  "filesNotFound": 1,
  "deletionResults": [
    {
      "path": "D:\\...\\public\\images\\products\\product_123.webp",
      "deleted": true
    },
    {
      "path": "D:\\...\\public\\images\\products\\product_456.webp",
      "deleted": true
    },
    {
      "path": "D:\\...\\public\\videos\\products\\product_789.mp4",
      "deleted": true
    },
    {
      "path": "D:\\...\\public\\images\\products\\product_999.webp",
      "deleted": false,
      "reason": "File not found"
    }
  ]
}
```

### Error Response

```json
{
  "error": "Failed to delete product"
}
```

## Database Operations

### Query Storage Media

```typescript
const storageMedias = await prisma.storageMedia.findMany({
  where: {
    parentId: productId,
    OR: [
      { parentType: 'product' },
      { parentType: 'product-text-editor' }
    ]
  }
})
```

### Delete Storage Media Records

```typescript
await prisma.storageMedia.deleteMany({
  where: {
    parentId: productId,
    OR: [
      { parentType: 'product' },
      { parentType: 'product-text-editor' }
    ]
  }
})
```

### Delete Product

```typescript
await prisma.product.delete({
  where: { id: productId }
})
```

## File Deletion

### Path Resolution

**Main Product Image:**
```typescript
// Product.imageUrl = "/images/products/product_123.webp"
const imagePath = path.join(process.cwd(), 'public', existingProduct.imageUrl)
// Result: "D:\...\public\images\products\product_123.webp"
```

**Storage Media:**
```typescript
// StorageMedia.path = "public/images/products/product_456.webp"
const mediaPath = path.join(process.cwd(), media.path)
// Result: "D:\...\public\images\products\product_456.webp"
```

### Safe Deletion

```typescript
try {
  if (existsSync(filepath)) {
    await unlink(filepath)
    // Success
  } else {
    // File not found (already deleted or never existed)
  }
} catch (error) {
  // Handle permission errors, disk errors, etc.
  console.error('Error deleting file:', error)
}
```

## Example Scenarios

### Scenario 1: Product with All Media Types

**Product Data:**
- ID: 23
- Main image: `/images/products/product_main_123.webp`
- Additional images: 3 images
- Text editor content: 2 images, 1 video

**Deletion Process:**
1. Fetch product with 6 storage media records
2. Collect 7 file paths (1 main + 6 storage media)
3. Delete 7 files from filesystem
4. Delete 6 storage media records
5. Delete product record

**Result:**
```json
{
  "success": true,
  "filesDeleted": 7,
  "filesNotFound": 0
}
```

### Scenario 2: Product with Missing Files

**Product Data:**
- ID: 24
- Main image: `/images/products/product_main_124.webp` (file missing)
- Additional images: 2 images (1 missing)
- Text editor content: 1 image

**Deletion Process:**
1. Fetch product with 3 storage media records
2. Collect 4 file paths
3. Delete 2 files (2 not found)
4. Delete 3 storage media records
5. Delete product record

**Result:**
```json
{
  "success": true,
  "filesDeleted": 2,
  "filesNotFound": 2,
  "deletionResults": [
    { "path": "...", "deleted": false, "reason": "File not found" },
    { "path": "...", "deleted": true },
    { "path": "...", "deleted": true },
    { "path": "...", "deleted": false, "reason": "File not found" }
  ]
}
```

## Error Handling

### File System Errors

**Permission Denied:**
```javascript
{
  "path": "...",
  "deleted": false,
  "reason": "EACCES: permission denied"
}
```

**Disk Full:**
```javascript
{
  "path": "...",
  "deleted": false,
  "reason": "ENOSPC: no space left on device"
}
```

### Database Errors

If database deletion fails, the transaction is rolled back:
- Files remain deleted
- Database records remain
- Error response returned

**Note:** Consider using database transactions for atomic operations.

## Testing

### Test Case 1: Complete Deletion

1. Create product with:
   - Main image
   - 2 additional images
   - Description with 1 image and 1 video
2. Delete product
3. Verify:
   - ✅ Product record deleted
   - ✅ 4 storage media records deleted
   - ✅ 5 files deleted from filesystem
   - ✅ Success response returned

### Test Case 2: Missing Files

1. Create product with media
2. Manually delete some files from filesystem
3. Delete product
4. Verify:
   - ✅ Product record deleted
   - ✅ Storage media records deleted
   - ✅ Existing files deleted
   - ✅ Missing files reported in response

### Test Case 3: Product Without Media

1. Create product without any images
2. Delete product
3. Verify:
   - ✅ Product record deleted
   - ✅ No file deletion attempts
   - ✅ Success response returned

## Frontend Integration

### Delete Confirmation

```typescript
const handleDeleteProduct = async (id: number) => {
  if (!confirm("Bạn có chắc chắn muốn xóa sản phẩm này? Tất cả ảnh và video liên quan sẽ bị xóa.")) {
    return;
  }

  try {
    await dispatch(deleteProduct(id)).unwrap();
    alert('Đã xóa sản phẩm và tất cả file liên quan!');
  } catch (err) {
    alert("Không thể xóa sản phẩm. Vui lòng thử lại.");
  }
};
```

### Display Deletion Results

```typescript
const response = await fetch(`/api/products/${id}`, { method: 'DELETE' });
const result = await response.json();

console.log(`Files deleted: ${result.filesDeleted}`);
console.log(`Files not found: ${result.filesNotFound}`);
```

## Performance Considerations

### Large Products

For products with many media files:
- Deletion may take several seconds
- Consider showing loading indicator
- Consider background job for large deletions

### Optimization

```typescript
// Delete files in parallel
await Promise.all(
  filesToDelete.map(filepath => 
    unlink(filepath).catch(err => console.error(err))
  )
)
```

## Security Considerations

### Path Traversal Prevention

```typescript
// Validate paths are within public directory
const publicDir = path.join(process.cwd(), 'public')
const resolvedPath = path.resolve(filepath)

if (!resolvedPath.startsWith(publicDir)) {
  throw new Error('Invalid file path')
}
```

### Authorization

Ensure user has permission to delete product:
```typescript
// Add authentication/authorization check
const user = await getUser(request)
if (!user.canDeleteProducts) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
}
```

## Monitoring

### Log Deletions

```typescript
console.log(`Product ${id} deleted by user ${userId}`)
console.log(`Files deleted: ${filesDeleted}`)
console.log(`Storage media records deleted: ${mediaCount}`)
```

### Track Disk Space

```typescript
// Before deletion
const sizeBefore = await getDiskUsage()

// After deletion
const sizeAfter = await getDiskUsage()
const spaceFreed = sizeBefore - sizeAfter

console.log(`Freed ${spaceFreed} bytes`)
```

## Troubleshooting

### Files Not Deleted

**Check:**
1. File permissions
2. File locks (file in use)
3. Path correctness
4. Disk errors

**Solution:**
```bash
# Check file permissions
ls -la public/images/products/

# Check disk space
df -h

# Check file locks (Windows)
handle.exe product_123.webp
```

### Database Records Not Deleted

**Check:**
1. Foreign key constraints
2. Database connection
3. Transaction errors

**Solution:**
```sql
-- Check foreign key constraints
SELECT * FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY';

-- Manually delete if needed
DELETE FROM "StorageMedia" WHERE "parentId" = 23;
DELETE FROM "Product" WHERE id = 23;
```

## Future Enhancements

1. **Soft Delete:**
   - Mark as deleted instead of removing
   - Keep files for recovery period
   - Permanent deletion after 30 days

2. **Batch Deletion:**
   - Delete multiple products at once
   - Optimize file operations
   - Progress tracking

3. **Audit Trail:**
   - Log who deleted what and when
   - Store deletion metadata
   - Enable recovery

4. **Background Jobs:**
   - Queue deletion for large products
   - Process asynchronously
   - Email notification on completion

## Related Files

- `src/app/api/products/[id]/route.ts` - Product deletion endpoint
- `src/app/api/upload/route.ts` - Upload endpoint (sets parentType)
- `src/app/api/products/upload-additional/route.ts` - Additional images upload
- `src/app/api/storage-medias/delete/route.ts` - Storage media deletion
- `prisma/schema.prisma` - Database schema

## Summary

Product deletion now includes:
- ✅ Delete product record from database
- ✅ Delete storage media records (product + product-text-editor)
- ✅ Delete main product image file
- ✅ Delete additional images files
- ✅ Delete text editor media files (images + videos)
- ✅ Detailed deletion results
- ✅ Graceful handling of missing files
- ✅ Error logging and reporting

Complete cleanup ensures no orphaned files or database records!
