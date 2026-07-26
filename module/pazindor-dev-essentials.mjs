import { announceAll, Announcement } from "./announcement/announcement.mjs";
import { AnnouncementStyles } from "./announcement/announcement_styles.mjs";
import { prepareConstants } from "./configs/constant.mjs";
import { gmCreate, gmDelete, gmUpdate } from "./configs/gm-methods.mjs";
import { registerHandlebarsHelpers } from "./configs/handlebars.mjs";
import { registerModuleSocket } from "./configs/socket.mjs";
import { InputDialog } from "./dialog/input-dialog.mjs";
import { TextEditor } from "./dialog/text-editor.mjs";
import { TokenSelector } from "./dialog/token-selector.mjs";
import { dc20Config } from "./systems/dc20rpg.mjs";
import { dnd5eConfig } from "./systems/dnd5e.mjs";
import { pf1Config } from "./systems/pf1.mjs";
import { pf2eConfig } from "./systems/pf2e.mjs";
import { TooltipCreator } from "./tooltip.mjs";
import * as utils from "./utils.mjs"

export { BaseDialog } from "./dialog/base-dialog.mjs";

Hooks.on("init", () => {
  registerModuleSocket();
  registerHandlebarsHelpers();

  window.PDE = {
    InputDialog,
    TokenSelector,
    TextEditor,
    TooltipCreator,
    utils: {...utils},
    crud: {
      gmCreate: gmCreate,
      gmUpdate: gmUpdate,
      gmDelete: gmDelete
    },
    announce: announceAll,
    announcementStyles: AnnouncementStyles.selectFormat()
  }

  // Default system agnostic config
  PDE.system = {
    itemDescriptionPath: "system.description",
    enhanceTooltipDescription: (description, options={}) => description,
    itemDetails: (item) => ""
  }

  switch (game.system.id) {
    case "dnd5e": dnd5eConfig(); break;
    case "pf2e": pf2eConfig(); break;
    case "pf1": pf1Config(); break;
    case "dc20rpg": dc20Config(); break;
  }

  prepareConstants();
})

Hooks.once("ready", async function() {});