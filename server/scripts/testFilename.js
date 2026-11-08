import { safeFilename } from "../services/filenameService.js";

const inputs = [
  "Blue Ceramic Coffee Mug",
  "../../etc/passwd",
  "Café Mug!!! *** ??",
  "CON",
  "   ",
  "a".repeat(200),
  "<script>alert(1)</script>",
  "mug\\..\\windows\\system32",
  "Ceramic   Mug   \n  Blue",
];

for (const input of inputs) {
  console.log(JSON.stringify(input.slice(0, 40)), "->", safeFilename(input));
}