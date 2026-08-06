export function dc20Config() {
  PDE.system.itemDescriptionPath = "system.description";
  PDE.system.itemDetails = itemDetails;
}

function itemDetails(item) {
  return DC20.tooltip.itemDetailsToHtml(item)
}