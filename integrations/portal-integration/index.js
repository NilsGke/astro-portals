import { virtualPortalTransformer } from "./virtualPortalTransformer.js";

/**
 * @returns {import('astro').AstroIntegration}
 */
export default function portalIntegration() {
  return {
    name: "astro-portal-integration",
    hooks: {
      "astro:config:setup": ({ updateConfig, logger }) => {
        updateConfig({
          vite: {
            plugins: [virtualPortalTransformer()],
          },
        });
        logger.info(
          "[astro-portal-integration] Vite plugin injected (config:setup)"
        );
      },
    },
  };
}
