# Product Price Fields Update

## Summary
Updated the Product model to support two price fields as strings:
- `price` (Giá sau khuyến mãi) - Promotional/Sale price
- `original_price` (Giá gốc) - Original price

Both fields are now stored as strings to allow flexible formatting (e.g., "10,000,000" or "10.5 triệu").

## Changes Made

### 1. Database Schema (prisma/schema.prisma)
- Changed `price` from `Float?` to `String?`
- Added new field `original_price` as `String?`
- Updated with comments for clarity

### 2. TypeScript Interfaces

#### src/lib/features/products/productsSlice.ts
- Updated `Product` interface to use `price: string | null` and `original_price: string | null`
- Updated `createProduct` async thunk to accept string prices
- Updated `addNewProduct` reducer to initialize both price fields

#### src/types/index.ts
- Added `original_price?: string` to the global Product interface

### 3. API Routes

#### src/app/api/products/route.ts (POST)
- Updated to accept `price` and `original_price` as strings
- Removed number parsing logic

#### src/app/api/products/[id]/route.ts (PUT)
- Updated to accept `original_price` field
- Added support for updating both price fields

### 4. Admin Interface (src/app/(admin)/admin/products/page.tsx)
- Updated form to show two separate price input fields:
  - "Giá gốc (VNĐ)" - Original price
  - "Giá sau khuyến mãi (VNĐ)" - Sale price
- Changed input type from `number` to `text` for flexible formatting
- Updated display section to show both prices (original price with strikethrough)
- Updated `handleSaveProduct` to include `original_price` in create/update operations

### 5. Database Migration
- Ran `npx prisma db push` to sync schema changes
- Ran `npx prisma generate` to update Prisma client types

## Usage Example

When creating or updating a product in the admin panel:

```typescript
{
  title: "Tấm pin năng lượng mặt trời 550W",
  price: "8,500,000",           // Giá sau khuyến mãi
  original_price: "10,000,000", // Giá gốc
  categoryId: 1,
  // ... other fields
}
```

## Display Format

In the admin panel, products will now show:
- Original price with strikethrough (if available): ~~10,000,000 VNĐ~~
- Sale price in bold: **8,500,000 VNĐ**

## Migration Notes

⚠️ **Important**: If you have existing products with numeric prices in the database, you may need to run a data migration script to convert them to string format. The database schema change from `Float` to `String` should handle this automatically, but verify your data after deployment.

## Testing Checklist

- [ ] Create a new product with both price fields
- [ ] Update an existing product's prices
- [ ] Display product with original_price (should show strikethrough)
- [ ] Display product without original_price (should only show sale price)
- [ ] Verify API responses include both price fields
- [ ] Test price formatting with commas and special characters
