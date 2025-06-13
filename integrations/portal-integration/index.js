// integrations/portals.ts
import * as fs from "fs/promises";
import * as path from "path";

export default function portals() {
  // Regex to find portal content.
  // The 's' flag allows '.' to match newlines, capturing multi-line content.
  const portalRegex =
    /<!--__ASTRO_PORTAL__START__-->(.*?)<!--__ASTRO_PORTAL__END__-->/gs;
  const outletMarker = "<!--__ASTRO_PORTAL_OUTLET__-->";

  return {
    name: "astro-portals",
    hooks: {
      "astro:build:done": async ({ dir }) => {
        console.log("Portal integration: Processing built files...");

        const directory = dir.pathname;
        const htmlFiles = await findHtmlFiles(directory);

        for (const filePath of htmlFiles) {
          try {
            let htmlContent = await fs.readFile(filePath, "utf-8");

            // Find all portal content blocks in the HTML
            const portalMatches = [...htmlContent.matchAll(portalRegex)];
            const portalContents = portalMatches.map((match) => match[1]);

            // If there are no portals or no outlet in this file, skip it.
            if (
              portalContents.length === 0 ||
              !htmlContent.includes(outletMarker)
            ) {
              continue;
            }

            console.log(
              `Found ${portalContents.length} portal(s) in ${path.basename(
                filePath
              )}`
            );

            // Remove the original portal blocks from the HTML
            htmlContent = htmlContent.replace(portalRegex, "");

            // Combine all found portal contents
            const combinedPortals = portalContents.join("\n");

            // Replace the outlet marker with the combined portal content
            htmlContent = htmlContent.replace(outletMarker, combinedPortals);

            // Write the modified HTML back to the file
            await fs.writeFile(filePath, htmlContent, "utf-8");
            console.log(
              `Successfully processed portals for ${path.basename(filePath)}`
            );
          } catch (error) {
            console.error(`Error processing file ${filePath}:`, error);
          }
        }
        console.log("Portal integration: Processing complete.");
      },
    },
  };
}

/**
 * Recursively finds all HTML files in a given directory.
 * @param {string} dir  The directory to search in.
 * @returns A promise that resolves to an array of file paths.
 */
async function findHtmlFiles(dir) {
  /** @type {string[]} */
  let files = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await findHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      files.push(fullPath);
    }
  }
  return files;
}
