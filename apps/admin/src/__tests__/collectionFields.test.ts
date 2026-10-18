import { mount, byPath, type, click, submitButton } from "../../../../packages/cms-ui/src/__tests__/dom.ts";
import assert from "node:assert/strict";
import test from "node:test";
import { createElement, useState } from "react";
import * as React from "react";
import { SchemaForm } from "@solar/cms-ui";
import { collectionDefs, collectionFormSchema, type Collection } from "@solar/db/collections";
import { CollectionFieldOptions, collectionWidgets } from "../components/CollectionWidgets.tsx";

// tsx uses classic JSX for the admin's Next.js jsx:preserve configuration.
Object.assign(globalThis, { React });

const categoryId = "e7060000-0000-4000-8000-000000000003";
const brandId = "e7060000-0000-4000-8000-000000000004";

test("reference selects show titles and round-trip clearing to explicit null", async () => {
  for (const name of ["product", "productCategory"] as const) {
    const keys = name === "product" ? ["categoryId", "brandId"] : ["parentId"];
    const submitted: unknown[] = [];
    const initial = { ...structuredClone(collectionDefs[name].defaults), status: "draft", columns:
      name === "product" ? { categoryId, brandId, segments: ["home"] } : { parentId: categoryId } };
    function Controlled() {
      const [value, setValue] = useState<unknown>(initial);
      return createElement(CollectionFieldOptions, { value: { references: {
        categoryId: [{ value: categoryId, label: "Tấm pin" }], brandId: [{ value: brandId, label: "Thương hiệu A" }],
        parentId: [{ value: categoryId, label: "Danh mục cha" }],
      } } }, createElement(SchemaForm, { schema: collectionFormSchema(name), value: value as never,
        onChange: setValue, onSubmit: data => { submitted.push(JSON.parse(JSON.stringify(data))); }, widgets: collectionWidgets(name) }));
    }
    const view = await mount(createElement(Controlled));
    try {
      for (const key of keys) {
        const field = byPath<HTMLSelectElement>(view.container, `columns.${key}`);
        assert.equal(field.tagName, "SELECT");
        assert.equal(field.selectedOptions[0]?.textContent, key === "brandId" ? "Thương hiệu A" : key === "parentId" ? "Danh mục cha" : "Tấm pin");
        assert.equal(field.options[0]?.textContent, "Không chọn");
        assert.ok(view.container.querySelector(`label[for="${field.id}"]`));
        await type(field, "");
      }
      await click(submitButton(view.container));
      assert.equal(submitted.length, 1);
      for (const key of keys) assert.equal((submitted[0] as { columns: Record<string, unknown> }).columns[key], null);
      for (const key of keys) await type(byPath<HTMLSelectElement>(view.container, `columns.${key}`), key === "brandId" ? brandId : categoryId);
      await click(submitButton(view.container));
      for (const key of keys) assert.equal((submitted[1] as { columns: Record<string, unknown> }).columns[key], key === "brandId" ? brandId : categoryId);
    } finally { view.unmount(); }
  }
});

test("product exposes only the effective segments field and preserves legacy data", async () => {
  const submitted: unknown[] = [];
  function Controlled({ name }: { name: Collection }) {
    const [value, setValue] = useState<unknown>({ ...structuredClone(collectionDefs[name].defaults), status: "draft",
      ...(name === "product" ? { columns: { segments: ["home"] }, data: { ...collectionDefs.product.defaults.data as object, segment: ["business"] } } : {}) });
    return createElement(SchemaForm, { schema: collectionFormSchema(name), value: value as never, onChange: setValue,
      onSubmit: data => { submitted.push(data); }, widgets: collectionWidgets(name) });
  }
  const view = await mount(createElement(Controlled, { name: "product" }));
  try {
    assert.ok(byPath(view.container, "columns.segments.0"));
    assert.equal([...view.container.querySelectorAll("[id]")].some(el => el.id.endsWith("-data.segment.0")), false);
    await click(submitButton(view.container));
    assert.deepEqual((submitted[0] as { data: unknown }).data, { ...collectionDefs.product.defaults.data as object, segment: ["business"] });
  } finally { view.unmount(); }
  const service = await mount(createElement(Controlled, { name: "service" }));
  try { assert.ok(byPath(service.container, "data.segment")); } finally { service.unmount(); }
});

test("nullable price hint describes an unset value instead of an unlimited amount", async () => {
  const view = await mount(createElement(SchemaForm, { schema: collectionFormSchema("product"),
    value: { ...collectionDefs.product.defaults, status: "draft" } as never, onChange: () => {} }));
  try {
    for (const key of ["price", "salePrice"]) {
      const field = byPath(view.container, `columns.${key}`);
      const hint = view.container.querySelector(`[id="${field.getAttribute("aria-describedby")}"]`);
      assert.ok(hint?.textContent?.includes("Để trống = chưa có giá trị"));
    }
  } finally { view.unmount(); }
});
