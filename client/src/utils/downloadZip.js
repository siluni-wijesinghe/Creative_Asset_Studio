import JSZip from "jszip";

// Takes the list of generated assets, puts them all in one ZIP,
// and makes the browser download it.
//   extraFiles = [{ name, content }] adds text files to the ZIP (optional)
export async function downloadAllAsZip(assets, zipName, extraFiles = []) {
  const zip = new JSZip();

  // Fetch each image and add it to the ZIP under its own file name
  for (const asset of assets) {
    const response = await fetch(asset.url);
    const imageBlob = await response.blob(); // a "blob" is raw file data
    zip.file(asset.fileName, imageBlob);
  }

  // Add the extra text files, such as the approved content
  for (const extra of extraFiles) {
    zip.file(extra.name, extra.content);
  }

  // Build the ZIP file in memory
  const zipBlob = await zip.generateAsync({ type: "blob" });

  // Make a temporary address for it, then "click" a hidden link to save it
  const link = document.createElement("a");
  link.href = URL.createObjectURL(zipBlob);
  link.download = zipName;
  link.click();

  // Clean up the temporary address a moment later
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}