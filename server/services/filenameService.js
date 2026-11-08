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
export function safeFilename(text, extension = "jpg", fallback = "product") {
  // The extension is chosen by the app, never by the text
  const ext = /^[a-z0-9]{2,5}$/.test(extension) ? extension : "jpg";

  let name = slugify(text);
  if (!name) name = fallback;
  if (RESERVED.has(name)) name = `${name}-image`;

  return `${name}.${ext}`;
}