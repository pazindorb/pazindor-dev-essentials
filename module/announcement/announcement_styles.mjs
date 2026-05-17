export class AnnouncementStyles {

  static styles = [
    "banner",
    "banner_dark",
    "banner_gold",
    "banner_blood",
    "banner_arcane",

    "top_ribbon",
    "top_ribbon_dark",
    "top_ribbon_gold",
    "top_ribbon_blood",
    "top_ribbon_arcane",

    "bottom_plaque",
    "bottom_plaque_dark",
    "bottom_plaque_gold",
    "bottom_plaque_blood",
    "bottom_plaque_arcane",

    "side_panel",
    "side_panel_dark",
    "side_panel_gold",
    "side_panel_blood",
    "side_panel_arcane",

    "corner_blade",
    "corner_blade_dark",
    "corner_blade_gold",
    "corner_blade_blood",
    "corner_blade_arcane",

    "center-sigil",
    "center-sigil_dark",
    "center-sigil_gold",
    "center-sigil_blood",
    "center-sigil_arcane",
    
    "hex-seal",
    "hex-seal_dark",
    "hex-seal_gold",
    "hex-seal_blood",
    "hex-seal_arcane",

    "parchment_scroll",
    "stained_glass",
    "smoke_veil",
    "stone_tablet",
    "ember_forge",

    "starry_night",
    "aurora_curtain",
    "deep_ocean",
    "forest_canopy",
    "holy_radiance",
    "void_rift",
    "ink_bloom",
    "sandstorm",
  ]

  static setFormat() {
    return new Set(this.styles);
  }

  static selectFormat() {
    const options = {};
    for (let i = 0; i < this.styles.length; i++) {
      const style = this.styles[i];
      options[style] = game.i18n.localize(`PDE.ANNOUNCEMENT_STYLE.${style.toUpperCase()}`);
    }
    return options;
  }
}
