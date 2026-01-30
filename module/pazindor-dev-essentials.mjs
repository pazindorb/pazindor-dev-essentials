import { prepareConstants } from "./configs/constant.mjs";
import { registerHandlebarsHelpers } from "./configs/handlebars.mjs";
import { registerPdeSettings } from "./configs/settings.mjs";
import { registerModuleSocket } from "./configs/socket.mjs";
import { InputDialog } from "./dialog/input-dialog.mjs";
import { TextEditor } from "./dialog/text-editor.mjs";
import { TokenSelector } from "./dialog/token-selector.mjs";
import { dnd5eConfig } from "./systems/dnd5e.mjs";
import { pf2eConfig } from "./systems/pf2e.mjs";
import { TooltipCreator } from "./tooltip.mjs";
import * as utils from "./utils.mjs"

export { BaseDialog } from "./dialog/base-dialog.mjs";

Hooks.on("init", () => {
  registerModuleSocket();
  registerHandlebarsHelpers();
  registerPdeSettings();

  window.PDE = {
    InputDialog,
    TokenSelector,
    TextEditor,
    TooltipCreator,
    utils: {...utils}
  }

  prepareConstants();
})

Hooks.once("ready", async function() {
  switch (game.system.id) {
    case "dnd5e": dnd5eConfig(); break;
    case "pf2e": pf2eConfig(); break;
  }
});