# Astro Portals

This is a small heavily ai generated poc that implements Portals in Astro.

All the magic happens in [portal-integration/index.js](/integrations/portal-integration/index.js)

## Example

Here's a minimal example showing how to use Astro Portals:

```astro
---
import Portal from "../components/Portal.astro";
import Outlet from "../components/Outlet.astro";
---

<Portal id="test">
  <p>portal content</p>
</Portal>

<Outlet id="test" />
```

Checkout [index.astro](/src/pages/index.astro) to see it in action

## How It Works

- During development, the integration injects a small client-side script that handles the portal functionality with client js on page load.
- During build time, the integration processes all HTML files and moves the portal content to its designated outlet location.
- In production, no JavaScript is needed for the portal functionality to work.
