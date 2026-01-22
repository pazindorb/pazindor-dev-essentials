import { emitEvent, responseListener } from "../configs/socket.mjs";
import { getPlayersForActor } from "../utils.mjs";
import { PdeBaseDialog } from "./base-dialog.mjs";

/**
 * Possible input type examples type examples:
 * 
 * "inputType": "info"
 * "data": {
 *  "header": String,
 *  "message": String,
 *  "information": Array[String],
 *  "hideButtons": Boolean
 * }
 * @return null
 * 
 * "inputType": "confirm"
 * "data": {
 *  "header": String,
 *  "message": String,
 *  "information": Array[String],
 *  "confirmLabel": String,
 *  "denyLabel": String
 * }
 * @return Boolean
 * 
 * "inputType": "input"
 * "data": {
 *  "header": String,
 *  "message": String,
 *  "information": Array[String],
 *  "inputs": [
 *    {
 *      "type": select/input/checkbox,
 *      "label": String,
 *      "hint": String,
 *      "options": Object[only for select type],
 *      "preselected": String/Boolean/Number
 *    }
 *  ]
 * }
 * @return Array[of output Strings]
 * 
 * "inputType": "drop"
 * "data": {
 *  "header": String,
 *  "message": String,
 *  "information": Array[String],
 * }
 * @return Array[dropped]
 */
export class InputDialog extends PdeBaseDialog {

  //===========================================
  //           PRECONFIGURED DIALOG           =
  //===========================================
  static async input(message, options) {
    const data = { message: message, inputs: [{type: "input"}]};
    const result = await InputDialog.open("input", data, options);
    return result ? result[0] : null;
  }

  static async select(message, selectOptions, options) {
    const data = {message: message, inputs: [{type: "select", options: selectOptions}]}
    const result = await InputDialog.open("input", data, options);
    return result ? result[0] : null;
  }

  static async confirm(message, options) {
    return await InputDialog.open("confirm", {message: message}, options);
  }

  static async info(header, information, options={}) {
    return await InputDialog.open("info", {header: header, information: information}, options);
  }

  //===========================================
  //               CREATE DIALOG              =
  //===========================================
  static async open(inputType, data, options={}) {
    // Send to actor owners
    if (options.sendToActorOwner && !options.users) {
      const owners = getPlayersForActor(options.sendToActorOwner, options.allowGM);
      const ownerIds = owners.map(owner => owner._id);
      if (ownerIds.length > 0) options.toUsers = ownerIds;
    }

    if (options.toUsers) {
      const signature = foundry.utils.randomID();
      const payload = {
        inputType: inputType,
        data: data,
        options: options,
        userIds: options.toUsers,
        signature: signature
      }
      const validationData = {emmiterId: game.user.id, signature: signature}
      const result = responseListener(PDE.SOCKET.RESPONSE.INPUT_DIALOG, validationData);
      emitEvent(PDE.SOCKET.EMIT.INPUT_DIALOG, payload);
      const response = await result;
      return response;
    }
    else {
      return await InputDialog.create(inputType, data, options);
    }
  }

  static async create(inputType, data={}, options={}) {
    const prompt = new InputDialog(inputType, data, options);
    return new Promise((resolve) => {
      prompt.promiseResolve = resolve;
      prompt.render(true);
    });
  }

  static PARTS = {
    root: {
      template: "modules/pazindor-dev-essentials/templates/input-dialog.hbs",
    }
  };

  constructor(inputType, data, options = {}) {
    super(options);
    this.inputType = inputType;
    this.data = data;
    if (inputType === "drop") {
      this.data.dropData = [];
    }
    this._prepareInputs();
    this._prepareButtonLabels();
  }

  _prepareInputs() {
    if (this.inputType !== "input") return;
    for (const input of this.data.inputs) {
      if (input.preselected) input.value = input.preselected;
      else if (input.type === "checkbox") input.value = false;
      else input.value = "";
    }
  }

  _prepareButtonLabels() {
    if (this.inputType === "confirm") {
      this.data.confirmLabel = this.data.confirmLabel || game.i18n.localize("PDE.YES");
      this.data.denyLabel = this.data.denyLabel || game.i18n.localize("PDE.NO");
    }
    else {
      this.data.confirmLabel = this.data.confirmLabel || game.i18n.localize("PDE.CONFIRM");
    }
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    initialized.window.title = "Dialog";
    initialized.window.icon = "fa-solid fa-comment-dots";
    initialized.position.width = 500;
    initialized.classes.push("force-top");

    initialized.actions.confirm = this._onConfirm;
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.inputType = this.inputType;
    return {
      ...context,
      ...this.data
    };
  }

  _onConfirm(event, target) {
    event.preventDefault();
    switch (this.inputType) {
      case "input": 
        const values = this.data.inputs.map(input => input.value);
        this.promiseResolve(values);
        break;

      case "confirm": 
        this.promiseResolve(target.dataset.option === "confirm"); 
        break;

      case "drop":
        this.promiseResolve(this.data.dropData); 
        break;
    }
    this.close();
  }

  /** @override */
  close(options) {
    if (this.promiseResolve) this.promiseResolve(null);
    super.close(options);
  }

  async _onDrop(event) {
    if (this.inputType !== "drop") return;

    const object = await super._onDrop(event);
    if (object?.uuid) {
      this.data.dropData.push(object?.uuid);
      this.render();
    }
  }
}