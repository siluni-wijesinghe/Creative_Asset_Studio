import path from "path";
import { fileURLToPath } from "url";

// Work out where the server folder is, no matter where you start Node from
const configDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.join(configDir, "..");

export const uploadsDir = path.join(serverRoot, "uploads");     // temporary originals
export const generatedDir = path.join(serverRoot, "generated"); // finished assets