import { defineConfig } from "astro/config";
import portals from "./integrations/portal-integration";

export default defineConfig({
  integrations: [portals()],
});
