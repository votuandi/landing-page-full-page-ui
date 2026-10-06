import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_QTY, addItem, clearCart, countItems, removeItem, sanitizeCart, setQty, type CartLine } from "../quoteCart";

test("giỏ: thêm sản phẩm mới", () => {
  const cart = addItem([], "den-pha-100");
  assert.deepEqual(cart, [{ sku: "den-pha-100", qty: 1 }]);
  assert.equal(countItems(cart), 1);
});

test("giỏ: thêm lại cùng sản phẩm thì tăng số lượng, không tạo dòng mới", () => {
  let cart: CartLine[] = addItem([], "den-pha-100");
  cart = addItem(cart, "den-pha-100");
  cart = addItem(cart, "den-pha-100", 3);
  cart = addItem(cart, "pin-jinko-580", 10);
  assert.deepEqual(cart, [{ sku: "den-pha-100", qty: 5 }, { sku: "pin-jinko-580", qty: 10 }]);
  assert.equal(countItems(cart), 15);
});

test("giỏ: chỉnh số lượng, về 0 thì xóa dòng, giới hạn tối đa", () => {
  let cart = addItem(addItem([], "a"), "b");
  cart = setQty(cart, "a", 7);
  assert.equal(cart.find((l) => l.sku === "a")?.qty, 7);
  cart = setQty(cart, "a", 0);
  assert.deepEqual(cart, [{ sku: "b", qty: 1 }]);
  cart = setQty(cart, "b", 5000);
  assert.equal(cart[0].qty, MAX_QTY);
});

test("giỏ: xóa một sản phẩm và làm rỗng giỏ", () => {
  const cart = addItem(addItem([], "a", 2), "b", 3);
  const after = removeItem(cart, "a");
  assert.deepEqual(after, [{ sku: "b", qty: 3 }]);
  assert.deepEqual(cart.length, 2, "không sửa mảng cũ");
  assert.deepEqual(clearCart(), []);
  assert.equal(countItems(clearCart()), 0);
});

test("giỏ: dữ liệu localStorage hỏng / sku không còn bán được loại bỏ", () => {
  assert.deepEqual(sanitizeCart("rác"), []);
  const raw = [{ sku: "a", qty: 2 }, { sku: "a", qty: "3" }, { sku: "x", qty: 1 }, null, { qty: 4 }, { sku: "b", qty: -1 }];
  assert.deepEqual(sanitizeCart(raw, (s) => s !== "x"), [{ sku: "a", qty: 5 }]);
});
