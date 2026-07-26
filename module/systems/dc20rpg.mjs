export function dc20Config() {
  PDE.system = {
    itemDescriptionPath: "system.description",
    enhanceTooltipDescription: (description, options) => description,
    itemDetails: itemDetails
  }
}

function itemDetails(item) {
  return DC20.tooltip.itemDetailsToHtml(item)
}