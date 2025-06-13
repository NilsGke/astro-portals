export function virtualPortalTransformer() {
  // A Map from page id to array of portal contents
  const portalContentsMap = new Map();

  return {
    name: "vite-plugin-astro-portals",
    enforce: "pre",

    transform(code, id) {
      if (!id.endsWith(".astro")) return;

      console.log(`\n----------- Transforming: ${id}`);

      // Detect portal content wrapped with markers
      const portalMatches = [
        ...code.matchAll(
          /<!--__ASTRO_PORTAL__START__-->([\s\S]*?)<!--__ASTRO_PORTAL__END__-->/g
        ),
      ];
      console.log(`portalMatches found: ${portalMatches.length}`);

      // Check if this file is a Portal or Outlet or neither by simple heuristic:
      // Portal files include portal markers
      const isPortal = portalMatches.length > 0;
      // Outlet files include outlet marker
      const isOutlet = code.includes("<!--__ASTRO_PORTAL_OUTLET__-->");

      // Initialize portal contents array for this file if missing
      if (!portalContentsMap.has(id)) {
        portalContentsMap.set(id, []);
      }

      if (isPortal) {
        // Collect all portal contents for this page
        const portalContents = portalMatches.map((m) => m[1].trim());
        console.log(`Collected portal contents:`, portalContents);

        // Append to existing contents for this id
        portalContentsMap.get(id).push(...portalContents);

        // Remove portal content from code (portals do not render themselves)
        const codeWithoutPortals = code.replace(
          /<!--__ASTRO_PORTAL__START__-->([\s\S]*?)<!--__ASTRO_PORTAL__END__-->/g,
          ""
        );

        console.log("Returning code without portal content.");
        return {
          code: codeWithoutPortals,
          map: null,
        };
      } else if (isOutlet) {
        // Insert all collected portal content into the outlet
        const portalsForPage = portalContentsMap.get(id) || [];
        const combinedContent = portalsForPage.join("\n");
        console.log(
          `Injecting combined portal content into outlet:`,
          combinedContent
        );

        const transformedCode = code.replace(
          "<!--__ASTRO_PORTAL_OUTLET__-->",
          combinedContent
        );

        console.log("Returning code with portal content injected into outlet.");
        return {
          code: transformedCode,
          map: null,
        };
      }

      // For files with neither portal nor outlet markers, do nothing
      console.log("No portal or outlet markers found, no changes made.");
      return null;
    },
  };
}
