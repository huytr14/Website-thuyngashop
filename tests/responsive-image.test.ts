import assert from "node:assert/strict";
import test from "node:test";
import { responsiveImage } from "../lib/responsive-image.ts";

test("srcset dùng WebP đúng cỡ cho ảnh local và Unsplash", () => {
  const local = responsiveImage("/media-file/123.webp", "50vw");
  assert.match(local.srcSet!, /\?w=480 480w/);
  assert.equal(local.sizes, "50vw");
  const remote = responsiveImage("https://images.unsplash.com/photo-example?w=900&q=85", "100vw");
  assert.match(remote.srcSet!, /w=800.*fm=webp 800w/);
  assert.deepEqual(responsiveImage("https://other.example/image.jpg", "100vw"), {});
});
