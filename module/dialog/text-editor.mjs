import { PdeBaseDialog } from "./base-dialog.mjs";

export class TextEditor extends PdeBaseDialog {

  static async create(text, options={}) {
    const prompt = new TextEditor(text, options);
    return new Promise((resolve) => {
      prompt.promiseResolve = resolve;
      prompt.render(true);
    });
  }

  static PARTS = {
    root: {
      template: "modules/pazindor-dev-essentials/templates/text-editor.hbs"
    }
  };

  constructor(text, options={}) {
    super(options);
    this.text = text;
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.window.resizable = true;
    initialized.window.title = "PDE.TEXT_EDITOR.TITLE";
    initialized.window.icon = "fa-solid fa-pen-to-square";
    initialized.position.width = 560;
    initialized.position.height = 450;
    initialized.actions.save = this._onSave;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.text = this.text;
    return context;
  }

  close(options) {
    this.promiseResolve(this.text);
    super.close(options);
  }

  _onSave(event) {
    const newValue = this.element.querySelector("prose-mirror")._value;
    this.promiseResolve(newValue);
    this.close();
  }
}