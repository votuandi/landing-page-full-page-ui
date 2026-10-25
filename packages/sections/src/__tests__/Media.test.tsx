import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { MediaImage, Wordmark } from "@solar/ui";

const src = "https://cdn.example/tenants/a/image-w1920.webp#m=640,1280,1920&f=0.2,0.8";
test("picture AVIF + WebP without Next image optimizer", () => {
  for (const image of [<MediaImage key="media" src={src} alt="Upload" sizes="100vw" priority className="custom" />, <Wordmark key="logo" src={src} name="Upload" />]) {
    const html = renderToStaticMarkup(image);
    assert.match(html, /<picture>/);
    assert.match(html, /<source[^>]+type="image\/avif"[^>]+srcSet="[^"]+-w640.avif/);
    assert.match(html, /<img[^>]+srcSet="[^"]+-w640.webp/);
    assert.doesNotMatch(html, /\/_next\/image|#m=/);
    assert.match(html, /alt="Upload"/);
    assert.match(html, /sizes=/);
  }
});
test("focal object-position and prop fallback", () => {
  for (const [url, expected] of [[src, "20% 80%"], [src.split("&f=")[0], "30% 70%"], ["/images/static.jpg", "30% 70%"]]) {
    const html = renderToStaticMarkup(<MediaImage src={url} alt="Focal" sizes="100vw" focal={{ x: 0.3, y: 0.7 }} />);
    assert.ok(html.includes(`object-position:${expected}`), html);
  }
});
test("static images retain optimizer; external originals and placeholders retain fallback", () => {
  const html = renderToStaticMarkup(<MediaImage src="/images/static.jpg" alt="Static" sizes="50vw" />);
  assert.match(html, /\/_next\/image/); assert.doesNotMatch(html, /<picture>/);
  const external = renderToStaticMarkup(<MediaImage src="https://cdn.example/original.jpg" alt="Original" sizes="50vw" />);
  assert.doesNotMatch(external, /\/_next\/image|<picture>/); assert.match(external, /loading="lazy"/);
  assert.doesNotMatch(renderToStaticMarkup(<Wordmark src="https://cdn.example/original.jpg" name="Original logo" />), /\/_next\/image/);
  assert.match(renderToStaticMarkup(<MediaImage alt="Missing" sizes="50vw" />), /role="img" aria-label="Missing"/);
});
test("actual width descriptors deduplicate small variants and priority stays eager", () => {
  const small = src.replace("640,1280,1920", "500,500,500");
  const html = renderToStaticMarkup(<MediaImage src={small} alt="Small" sizes="100vw" priority />);
  assert.match(html, /srcSet="https:\/\/cdn.example\/tenants\/a\/image-w640.avif 500w"/);
  assert.match(html, /fetchPriority="high"/);
  assert.doesNotMatch(html, /loading="lazy"/);
});
