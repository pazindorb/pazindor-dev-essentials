export function registerPdeSettings() {
  game.settings.register("pazindor-dev-essentials", "tooltipItemDescriptionPath", {
    scope: "world",
    config: true,
    default: "",
    name: "PDE.SETTINGS.TOOLTIP_ITEM_DESCRIPTION_PATH",
    type: String
  });
}