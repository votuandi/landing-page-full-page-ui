import assert from "node:assert/strict";
import test from "node:test";
import { parseCsv, toCsv } from "../csv.ts";

test("parses quoted fields and line endings", () => {
  assert.deepEqual(parseCsv('\uFEFFa,b\r\n"a,""b""","x\ny"\n1,2\r\n'), [["a", "b"], ['a,"b"', "x\ny"], ["1", "2"]]);
  const rows = [["Tiếng Việt", '"', "a,b", "a\r\nb", ""]];
  assert.deepEqual(parseCsv(toCsv(rows)), rows);
  for (const malformed of ['"open', 'x"y,z', '"a"x,b']) assert.throws(() => parseCsv(malformed), /CSV/);
  assert.deepEqual(parseCsv(""), []);
});
