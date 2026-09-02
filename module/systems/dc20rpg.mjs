export function dc20Config() {
  PDE.system.itemDescriptionPath = "system.description";
  PDE.system.enhanceTooltipDescription = enhanceTooltipDescription,
  PDE.system.itemDetails = itemDetails;
}

async function enhanceTooltipDescription(description, options={}) {
  return DC20.tooltip.enhanceTooltipDescription(description, options.object);
}

function itemDetails(item) {
  return DC20.tooltip.itemDetailsToHtml(item)
}