import { expect, test } from "@playwright/test";

for (const route of ["/lab", "/lab/ui", "/lab/themes", "/lab/themes/t15"]) {
  test(`production chặn ${route} khi không bật lab`, async ({ request }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(404);
  });
}
