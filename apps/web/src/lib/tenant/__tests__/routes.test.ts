import assert from "node:assert/strict";
import test from "node:test";
import { resolveRoute, routeEnabled } from "../routes";

test("public route matrix preserves Vietnamese slugs and reserves system routes", () => {
  assert.deepEqual(resolveRoute([]), { kind: "page", slug: "" });
  for (const [prefix, collection] of [["san-pham", "product"], ["cong-trinh", "project"], ["giai-phap", "service"], ["tin-tuc", "post"]]) {
    assert.deepEqual(resolveRoute([prefix, "slug"]), { kind: "detail", collection, slug: "slug" });
    assert.equal(resolveRoute([prefix, "slug", "extra"]), null);
  }
  assert.equal(resolveRoute(["cong-trinh"]), null);
  assert.equal(resolveRoute(["robots.txt"]), null);
  assert.equal(resolveRoute([".."]), null);
  assert.deepEqual(resolveRoute(["uu-dai", "nang-luong"]), { kind: "page", slug: "uu-dai/nang-luong" });
});

test("routes open only for page types in the site structure and plan (D21, E5-S11)", () => {
  const route = (path: string) => resolveRoute(path ? path.split("/") : [])!;
  const premium = () => true, basic = (feature: string) => feature === "blog";
  const all = ["home", "about", "services", "projects", "products", "news", "guides", "contact", "policy"];
  for (const path of ["san-pham", "san-pham/x", "ve-chung-toi", "cong-trinh/x", "tin-tuc", "cam-nang", "chinh-sach/bao-hanh", "uu-dai/nang-luong"]) {
    assert.equal(routeEnabled(route(path), all, premium), true, path);
  }
  for (const path of ["san-pham", "san-pham/x"]) assert.equal(routeEnabled(route(path), all, basic), false, `${path} needs catalog`);
  const minimal = ["home", "contact", "policy"];
  for (const path of ["ve-chung-toi", "giai-phap", "cong-trinh/x", "tin-tuc/x", "cam-nang"]) assert.equal(routeEnabled(route(path), minimal, premium), false, path);
  for (const path of ["", "lien-he", "chinh-sach/x", "uu-dai/nang-luong"]) assert.equal(routeEnabled(route(path), minimal, premium), true, path);
});
