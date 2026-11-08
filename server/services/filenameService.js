import { MAX_VERSION } from "../config/naming.js";

// Windows can't use these names for files, even with an extension (CON.jpg)
const RESERVED = new Set([
  "con",
  "prn",
  "aux",
  "nul",
  ...Array.from({ length: 9 }, (_, i) => `com${i + 1}`),
  ...Array.from({ length: 9 }, (_, i) => `lpt${i + 1}`),
]);

// Turns any text into a safe name part: lowercase letters, numbers and hyphens only
export function slugify(text, maxLength = 60) {
  let slug = String(text ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // removes accents: "café" becomes "cafe"
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")     // everything else becomes a hyphen
    .replace(/^-+|-+$/g, "");        // no hyphens at the ends

  // Too long? Cut at a hyphen so we don't leave half a word
  if (slug.length > maxLength) {
    slug = slug.slice(0, maxLength);
    const lastDash = slug.lastIndexOf("-");
    if (lastDash > maxLength * 0.5) slug = slug.slice(0, lastDash);
    slug = slug.replace(/-+$/g, "");
  }
  return slug;
}

// The final, safe file name, built by our code. Whatever the text came from
// (a person or the AI), nothing but letters, numbers and hyphens gets through.
export function safeFilename(text, extension = "jpg", fallback = "product", maxLength = 60) {
  // The extension is chosen by the app, never by the text
  const ext = /^[a-z0-9]{2,5}$/.test(extension) ? extension : "jpg";

  let name = slugify(text, maxLength);
  if (!name) name = fallback;
  if (RESERVED.has(name)) name = `${name}-image`;

  return `${name}.${ext}`;
}

// ---------------------------------------------------------------
// Phase 5: the naming convention
//   [brand]-[product]-[platform]-[asset-type]-[version].extension
// ---------------------------------------------------------------

const MAX_NAME_LENGTH = 100; // without the extension

// Builds the final file name from separate parts. Every part is cleaned on
// its own, so no part (typed by a person or suggested by the AI) can add
// slashes, dots or odd symbols.
export function buildAssetFilename({
  brand,
  product,
  platform,
  assetType = "product",
  version = 1,
  extension = "jpg",
}) {
  const parts = {
    brand: slugify(brand, 24), // may be empty: then it is left out
    product: slugify(product, 40) || "product",
    platform: slugify(platform, 20),
    assetType: slugify(assetType, 20) || "product",
    // Whatever arrives, the version ends up as a whole number from 1 to 99
    version: `v${Math.min(Math.max(Number.parseInt(version, 10) || 1, 1), MAX_VERSION)}`,
  };

  // Put the parts in order, skipping any that are empty
  const join = () =>
    [parts.brand, parts.product, parts.platform, parts.assetType, parts.version]
      .filter(Boolean)
      .join("-");

  let name = join();

  // Too long? Shorten the product part first
  if (name.length > MAX_NAME_LENGTH) {
    const overflow = name.length - MAX_NAME_LENGTH;
    parts.product = slugify(parts.product, Math.max(parts.product.length - overflow, 3)) || "product";
    name = join();
  }

  // One last pass through the safety function, which also adds the extension.
  // It gets our 100-character limit, so the end of the name (platform, asset
  // type and version) is never cut off.
  return safeFilename(name, extension, "product", MAX_NAME_LENGTH);
}