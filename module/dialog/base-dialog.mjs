import { TooltipCreator } from "../tooltip.mjs";
import { getValueFromPath, setValueForPath } from "../utils.mjs";

export class BaseDialog extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.api.ApplicationV2) {

  /** @override */
  static DEFAULT_OPTIONS = {
    id: "dialog-{id}",
    classes: ["pde themed"],
    position: {width: 350},
    window: {
      title: "PDE.DIALOG.TITLE",
      icon: "fa-solid fa-window",
    },
  }

  constructor(options = {}) {
    super(options);
    if (options.dbObject) this.dbObject = options.dbObject;
  }

  _initializeApplicationOptions(options) {
    const initialized = super._initializeApplicationOptions(options);
    return initialized;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const colorTheme = game.settings.get("core", "uiConfig").colorScheme.applications;
    context.cssClass = `theme-${colorTheme} pde`;
    
    // Get active tab
    if (context.tabs) {
      const active = Object.values(context.tabs).find(tab => tab.active);
      if (active) context.activeTab = active.id;
    }
    return context;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    this.element.appendChild(TooltipCreator.getTooltipHtml());
  }

  _attachFrameListeners() {
    super._attachFrameListeners();
    this.window.content.addEventListener("change", this._onChange.bind(this));
    this.window.content.addEventListener("mousedown", this._onMouseDown.bind(this));
    this.window.content.addEventListener("drop", this._onDrop.bind(this));
    this.window.content.addEventListener("mouseover", this._onHover.bind(this));
    this.window.content.addEventListener("mouseout", this._onHover.bind(this));
  }

  _getCtypeTarget(element) {
    if (element.className === "window-content" || !element.parentElement) return element;
    if (element.dataset.ctype) return element;
    return this._getCtypeTarget(element.parentElement);
  }

  _onChange(event) {
    const target = this._getCtypeTarget(event.target);
    const dataset = target.dataset;
    const cType = dataset.ctype;
    const path = dataset.path;
    const value = target.value;

    switch (cType) {
      case "string": this._onChangeString(path, value, dataset); break;
      case "numeric": this._onChangeNumeric(path, value, false, dataset); break;
      case "numeric-nullable": this._onChangeNumeric(path, value, true, dataset); break;
    }
  }

  _onMouseDown(event) {
    const target = this._getCtypeTarget(event.target);
    const dataset = target.dataset;
    const cType = dataset.ctype;
    const path = dataset.path;
    const max = dataset.max ? parseInt(dataset.max) : 0;
    const min = dataset.min ? parseInt(dataset.min) : 0;

    switch (cType) {
      case "toggle": this._onToggle(path, event.which, max, min, dataset); break;
      case "activable": this._onActivable(path, event.which, dataset); break;
    }
  }

  async _onHover(event) {
    const target = this._getHoverTarget(event.target);
    const dataset = target.dataset;
    const hover = dataset.hover;

    switch (hover) {
      case "tooltip": this._onTooltip(event, target, dataset); break;
    }
  }

  // ================== CHANGES ===================
  _onActivable(path, which, dataset) {
    const value = getValueFromPath(this, path);
    this.updateAndRender(path, !value, !!dataset.nonDb);
  }

  _onToggle(path, which, max, min, dataset) {
    const value = getValueFromPath(this, path);
    let newValue = value;
    if (which === 0) newValue = Math.min(value + 1, max);
    if (which === 2) newValue = Math.max(value + -1, min);
    this.updateAndRender(path, newValue, !!dataset.nonDb);
  }

  _onChangeString(path, value, dataset) {
    this.updateAndRender(path, value, !!dataset.nonDb);
  }

  _onChangeNumeric(path, value, nullable, dataset) {
    let numericValue = parseInt(value);
    if (nullable && isNaN(numericValue)) numericValue = null;
    this.updateAndRender(path, value, !!dataset.nonDb);
  }

  async _onDrop(event) {
    event.preventDefault();
    const droppedData  = event.dataTransfer.getData('text/plain');
    if (!droppedData) return;

    const droppedObject = JSON.parse(droppedData);
    return droppedObject;
  }

  async updateAndRender(path, value, notDbUpdate) {
    if (this.dbObject && !notDbUpdate) await setValueForPath(this.dbObject, path, value, true);
    else setValueForPath(this, path, value);
    this.render();
  }
  // ================== CHANGES ===================

  // ================== TOOLTIP ===================
  async _onTooltip(event, target, dataset) {
    const html = $(this.element);

    if (event.type !== "mouseover") {
      TooltipCreator.hideTooltip(event, html);
      return;
    }

    const object = await this._getTooltipObject(dataset, event);
    if (!object) return;

    const position = this._getTooltipPosition(event);
    const options = {position: position};

    if (dataset.header) options.header = dataset.header;
    if (dataset.img) options.img = dataset.img;
    TooltipCreator.showTooltipFor(object, event, html, options);
  }

  async _getTooltipObject(dataset, event) {
    return await fromUuid(dataset.uuid);
  }

  /** 
   * If not provided it will be calcuated automatically.
   */
  _getTooltipPosition(event) {
    return null;
  }

  _getHoverTarget(element) {
    if (element.id === this.element.id || !element.parentElement) return element;
    if (element.dataset.hover) return element;
    return this._getHoverTarget(element.parentElement);
  }
   // ================== TOOLTIP ===================
}