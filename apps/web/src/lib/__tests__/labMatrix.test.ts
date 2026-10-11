import assert from "node:assert/strict";
import { test } from "node:test";
import { selectLabIds, labPalette } from "../../app/lab/sections/matrix-data";

test("query lọc, bỏ trùng và dùng mọi id khi không có lựa chọn hợp lệ", () => {
  assert.deepEqual(selectLabIds("t15,unknown,t15,t08", ["t08", "t15"]), ["t15", "t08"]);
  for (const query of [undefined, "", "unknown", "constructor"]) {
    assert.deepEqual(selectLabIds(query, ["t15"]), ["t15"]);
  }
});

test("palette giữ cả glass và dark partial kế thừa light", () => {
  const theme = { meta: { id: "sample", supportsDark: true }, colors: {
    light: { primary: "1 2 3", glass: "4 5 6" }, dark: { primary: "7 8 9" },
  } };
  assert.deepEqual(labPalette([theme]), { sample: { supportsDark: true,
    light: theme.colors.light, dark: { ...theme.colors.light, ...theme.colors.dark },
  } });
  assert.deepEqual(theme.colors.dark, { primary: "7 8 9" });
});
