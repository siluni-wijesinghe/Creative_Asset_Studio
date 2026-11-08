import { buildAssetFilename } from "../services/filenameService.js";

const cases = [
  { brand: "Acme", product: "Blue Ceramic Coffee Mug", platform: "instagram", assetType: "product", version: 1 },
  { brand: "", product: "Blue Ceramic Coffee Mug", platform: "website", assetType: "lifestyle", version: 2 },
  { brand: "../../Acme Corp!!", product: "Mug <script>", platform: "marketplace", assetType: "product", version: 1 },
  { brand: "Café Noël", product: "", platform: "facebook", assetType: "detail", version: 3 },
  { brand: "A".repeat(100), product: "b".repeat(300), platform: "instagram", assetType: "product", version: 1 },
  { brand: "Acme", product: "mug", platform: "instagram", assetType: "product", version: "abc" },
  { brand: "Acme", product: "mug", platform: "instagram", assetType: "product", version: 5000 },
  { brand: "Acme", product: "mug", platform: "instagram", assetType: "product", version: -4 },
  { brand: "CON", product: "NUL", platform: "instagram", assetType: "../x", version: 1 },
  { brand: "Acme", product: "mug", platform: "instagram", assetType: "product", version: 1, extension: "../../exe" },
  { brand: "Acme Home Goods", product: "Blue Ceramic Coffee Mug With Geometric Pattern", platform: "marketplace", assetType: "lifestyle", version: 2 },
];

for (const testCase of cases) {
  console.log(buildAssetFilename(testCase));
}