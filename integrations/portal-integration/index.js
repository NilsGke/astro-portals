// integrations/portals.ts
import { readFileSync } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function portals() {
  // Match portal blocks with multiline content and capture portal ID
  const portalRegex =
    /<!--__ASTRO_PORTAL__START__-->\s*([\s\S]*?<div[^>]*data-portal=["'](.*?)["'][^>]*>[\s\S]*?<\/div>[\s\S]*?)<!--__ASTRO_PORTAL__END__-->/g;
  const outletRegex =
    /<!--__ASTRO_PORTAL_OUTLET__-->\s*<div[^>]*data-outlet=["'](.*?)["'][^>]*>[\s\S]*?<\/div>/g;

  return {
    name: "astro-portals",
    hooks: {
      "astro:config:setup"({ injectScript, command }) {
        if (command === "dev") {
          const scriptPath = path.join(__dirname, "client.js");
          const scriptContent = readFileSync(scriptPath, "utf-8");
          injectScript("page", scriptContent);
        }
      },

      "astro:build:done": async ({ dir }) => {
        console.log("Portal integration: Processing built files...");

        const directory = dir.pathname;
        const htmlFiles = await findHtmlFiles(directory);

        for (const filePath of htmlFiles) {
          try {
            let htmlContent = await fs.readFile(filePath, "utf-8");

            const portalMatches = [...htmlContent.matchAll(portalRegex)];
            const outletMatches = [...htmlContent.matchAll(outletRegex)];

            if (portalMatches.length === 0 || outletMatches.length === 0) {
              continue;
            }

            const portalMap = new Map();
            for (const match of portalMatches) {
              const fullBlock = match[0];
              const innerContent = match[1];
              const portalId = match[2];
              if (!portalMap.has(portalId)) portalMap.set(portalId, []);
              portalMap.get(portalId).push(innerContent);
            }

            htmlContent = htmlContent.replace(portalRegex, "");

            htmlContent = htmlContent.replace(outletRegex, (match, id) => {
              const portals = portalMap.get(id)?.join("\n") || "";
              return portals;
            });

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

async function findHtmlFiles(dir) {
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
