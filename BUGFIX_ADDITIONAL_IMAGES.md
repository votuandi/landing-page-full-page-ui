# Bug Fix: Additional Images Upload Error

## Issue
When editing a product and uploading additional images, the following error occurred:
```
Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

## Root Causes

### 1. Multiple PrismaClient Instances
**Problem:** The upload endpoints were creating new `PrismaClient` instances directly:
```typescript
const prisma = new PrismaClient();
```

This caused issues in Next.js development mode where hot reloading creates multiple instances, leading to connection pool exhaustion and 500 errors.

**Solution:** Use the singleton prisma instance from `@/lib/prisma`:
```typescript
import { prisma } from '@/lib/prisma';
```

### 2. Poor Error Handling
**Problem:** When the API returned an HTML error page (500 error), the code tried to parse it as JSON:
```typescript
if (!response.ok) {
  const errorData = await response.json(); // This fails if response is HTML
  throw new Error(errorData.error || 'Failed to upload additional images');
}
```

**Solution:** Check content-type before parsing:
```typescript
if (!response.ok) {
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload additional images');
  } else {
    const text = await response.text();
    console.error('Server error response:', text);
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }
}
```

### 3. Product ID Mapping Issue
**Problem:** When creating a new product (id=0), after saving the product gets a real ID, but the selected images are still mapped to id=0.

**Solution:** Update the mapping when transitioning from new product to saved product:
```typescript
if (isNewProduct && savedProductId !== id) {
  setSelectedAdditionalImages(prev => {
    const updated = { ...prev };
    updated[savedProductId] = updated[id];
    delete updated[id];
    return updated;
  });
}
```

## Files Modified

### 1. `src/app/api/products/upload-additional/route.ts`
- Changed from `new PrismaClient()` to `import { prisma } from '@/lib/prisma'`

### 2. `src/app/api/upload/route.ts`
- Changed from `new PrismaClient()` to `import { prisma } from '@/lib/prisma'`

### 3. `src/app/(admin)/admin/products/page.tsx`
- Improved error handling in `handleUploadAdditionalImages()`
- Added content-type check before parsing JSON
- Added product ID mapping for new products

## Testing

To verify the fix:

1. **Edit Existing Product:**
   - Go to `/admin/products`
   - Click edit on an existing product
   - Select multiple additional images
   - Click "Lưu"
   - Should save successfully without JSON parse errors

2. **Create New Product:**
   - Go to `/admin/products`
   - Click "Thêm Sản phẩm"
   - Fill in required fields
   - Select multiple additional images
   - Click "Lưu"
   - Should create product and upload images successfully

3. **Check Server Logs:**
   - No more PrismaClient instantiation warnings
   - No 500 errors on `/api/products/upload-additional`

## Prevention

To prevent similar issues in the future:

1. **Always use the singleton prisma instance:**
   ```typescript
   import { prisma } from '@/lib/prisma';
   ```
   Never create new instances with `new PrismaClient()`

2. **Always check content-type before parsing:**
   ```typescript
   const contentType = response.headers.get('content-type');
   if (contentType && contentType.includes('application/json')) {
     const data = await response.json();
   }
   ```

3. **Handle ID transitions for new entities:**
   When an entity transitions from temporary ID (0) to real ID, update all related state mappings.

## Related Files
- `src/lib/prisma.ts` - Prisma singleton configuration
- `src/app/api/products/upload-additional/route.ts` - Additional images upload endpoint
- `src/app/api/upload/route.ts` - Text editor images upload endpoint
- `src/app/(admin)/admin/products/page.tsx` - Product form and upload handlers
