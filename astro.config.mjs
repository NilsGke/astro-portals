import { defineConfig } from "astro/config";
import portalIntegration from "./integrations/portal-integration/index.js";

export default defineConfig({
  integrations: [portalIntegration()],
});
