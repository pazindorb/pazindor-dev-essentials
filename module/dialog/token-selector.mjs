import { BaseDialog } from "./base-dialog.mjs";

export class TokenSelector extends BaseDialog {
  
  static async open(tokens=[], options={}) {
    const prompt = new TokenSelector(tokens, options);
    return new Promise((resolve) => {
      prompt.promiseResolve = resolve;
      prompt.render(true);
    });
  }

  static PARTS = {
    root: {
      template: "modules/pazindor-dev-essentials/templates/token-selector.hbs",
      scrollable: [".scrollable"]
    }
  };

  constructor(tokens=[], options = {}) {
    super(options);
    this._prepareTokens(tokens); 
    this.customMessage = options.customMessage;
  }

  _prepareTokens(tokens) {
    const selectable = {};
    const tokenArray = tokens.length > 0 ? tokens : (canvas.tokens?.placeables || []);
    tokenArray.forEach(token => selectable[token.id] = {selected: false, token: token});
    this.tokens = selectable;
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.window.title = "PDE.TOKEN_SELECTOR.TITLE";
    initialized.window.icon = "fa-solid fa-users-viewfinder";
    initialized.position.width = 500;

    initialized.actions.confirm = this._onConfirm;
    initialized.actions.ping = this._onPingToken;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.tokens = this.tokens;
    context.message = this.customMessage;
    return context;
  }

  _onPingToken(event, target) {
    const wrapper = this.tokens[target.dataset.id];
    if (wrapper) canvas.ping({x: wrapper.token.center.x, y: wrapper.token.center.y});
  }

  _onConfirm(event) {
    event.preventDefault();
    const selected = Object.values(this.tokens).filter(wrapper => wrapper.selected).map(wrapper => wrapper.token);
    this.promiseResolve(selected);
    this.close();
  }

  close(options) {
    if (this.promiseResolve) this.promiseResolve([]);
    super.close(options);
  }
}