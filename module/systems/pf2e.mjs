export function pf2eConfig() {
  PDE.system = {
    itemDescriptionPath: "system.description.value",
    enhanceTooltipDescription: enhanceTooltipDescription
  }
}

async function enhanceTooltipDescription(description) {
  description = description.replaceAll("&amp;", "&");

  for (const enricher of CONFIG.TextEditor.enrichers) {
    const matches = [...description.matchAll(enricher.pattern)];
    for (const match of matches) {
      const enriched = await enricher.enricher(match);

      let uuidElement;
      if (enriched.hasAttribute(["data-uuid"])) uuidElement = enriched;
      if (enriched.querySelector("[data-uuid]")) uuidElement = enriched.querySelector("[data-uuid]");
      
      let uuid;
      if (uuidElement) {
        uuid = uuidElement.getAttribute("data-uuid");
      }

      if (uuid) {
        const uuidLink = `@UUID[${uuid}]{${match[2]}}`;
        description = description.replace(match[0], uuidLink); // tooltip will handle that format
      }
    }
  }
  return description;
}