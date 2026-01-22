import { registerHandlebarsHelpers } from "./configs/handlebars.mjs";
import { InputDialog } from "./dialog/input-dialog.mjs";
import { TextEditor } from "./dialog/text-editor.mjs";
import { TokenSelector } from "./dialog/token-selector.mjs";

Hooks.on("ready", () => {
  registerHandlebarsHelpers();

  window.PDE = {
    InputDialog,
    TokenSelector,
    TextEditor
  }
});
