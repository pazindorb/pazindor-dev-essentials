import { registerHandlebarsHelpers } from "./configs/handlebars.mjs";
import { InputDialog } from "./dialog/input-dialog.mjs";
import { TextEditor } from "./dialog/text-editor.mjs";
import { TokenSelector } from "./dialog/token-selector.mjs";
import * as utils from "./utils.mjs"

Hooks.on("init", () => {
  registerHandlebarsHelpers();

  window.PDE = {
    InputDialog,
    TokenSelector,
    TextEditor,
    utils: {...utils}
  }
})