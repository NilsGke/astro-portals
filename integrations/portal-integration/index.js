// integrations/portals.ts
import { readFileSync } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simplified regex patterns
const PORTAL_START = "<!--__ASTRO_PORTAL__START__-->";
const PORTAL_END = "<!--__ASTRO_PORTAL__END__-->";
const OUTLET_MARKER = "<!--__ASTRO_PORTAL_OUTLET__-->";

const getPortalRegex = () =>
  new RegExp(
    `${PORTAL_START}\\s*([\\s\\S]*?<div[^>]*data-portal=["'](.*?)["'][^>]*>[\\s\\S]*?<\\/div>[\\s\\S]*?)${PORTAL_END}`,
    "g"
  );

const getOutletRegex = () =>
  new RegExp(
    `${OUTLET_MARKER}\\s*<div[^>]*data-outlet=["'](.*?)["'][^>]*>[\\s\\S]*?<\\/div>`,
    "g"
  );

const processHtmlContent = (htmlContent) => {
  const portalRegex = getPortalRegex();
  const outletRegex = getOutletRegex();

  const portalMatches = [...htmlContent.matchAll(portalRegex)];
  const outletMatches = [...htmlContent.matchAll(outletRegex)];

  if (portalMatches.length === 0 || outletMatches.length === 0) {
    return htmlContent;
  }

  // Create portal map
  const portalMap = new Map(portalMatches.map((match) => [match[2], match[1]]));

  // Remove portal blocks
  let processedContent = htmlContent.replace(portalRegex, "");

  // Replace outlets with portal content
  processedContent = processedContent.replace(
    outletRegex,
    (_, id) => portalMap.get(id) || ""
  );

  return processedContent;
};

const findHtmlFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  return (
    await Promise.all(
      entries.map(async (entry) => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          return findHtmlFiles(fullPath);
        }
        return entry.isFile() && entry.name.endsWith(".html") ? [fullPath] : [];
      })
    )
  ).flat();
};

export default function portals() {
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

        const htmlFiles = await findHtmlFiles(dir.pathname);

        await Promise.all(
          htmlFiles.map(async (filePath) => {
            try {
              const htmlContent = await fs.readFile(filePath, "utf-8");
              const processedContent = processHtmlContent(htmlContent);

              if (processedContent !== htmlContent) {
                await fs.writeFile(filePath, processedContent, "utf-8");
                console.log(
                  `Successfully processed portals for ${path.basename(
                    filePath
                  )}`
                );
              }
            } catch (error) {
              console.error(`Error processing file ${filePath}:`, error);
            }
          })
        );

        console.log("Portal integration: Processing complete.");
      },
    },
  };
}
