document.querySelectorAll("[data-portal]").forEach((portal) => {
  const portalName = portal.dataset.portal;
  const outlet = document.querySelector(`[data-outlet="${portalName}"]`);

  if (!outlet)
    return console.error(`No outlet found for portal: ${portalName}`);

  [...portal.children].forEach((child) => outlet.appendChild(child));
});
