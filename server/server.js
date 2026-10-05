import express from "express";
import cors from "cors";
import { platformPresets } from "./config/platformPresets.js";
import { generatedDir } from "./config/paths.js";
import assetRoutes from "./routes/assetRoutes.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Make finished images reachable in the browser at /generated/...
app.use("/generated", express.static(generatedDir));

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Creative Asset Studio server is running" });
});

app.get("/api/presets", (req, res) => {
  res.json(platformPresets);
});

app.use("/api/assets", assetRoutes);

// Error handler: any error passed with next(error) or thrown by Multer lands here
app.use((error, req, res, next) => {
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "That file is too large. The limit is 10 MB." });
  }
  if (error.message === "UNSUPPORTED_TYPE") {
    return res.status(400).json({ error: "Unsupported file. Please upload a JPG or PNG image." });
  }
  console.error(error);
  res.status(500).json({ error: "Something went wrong while generating your assets." });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});