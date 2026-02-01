import { getValueFromPath } from "./utils.mjs";

export class TooltipCreator {
  static getTooltipHtml() {
    const colorTheme = game.settings.get("core", "uiConfig").colorScheme.applications;
    const tooltip = document.createElement("div");
    tooltip.id = "tooltip-container";
    tooltip.classList.add(`theme-${colorTheme}`);
    tooltip.classList.add("pde");
    tooltip.innerHTML = `
      <div class="tooltip-info">
        <div>${game.i18n.localize("PDE.TOOLTIP.HOLD_ALT")}</div>
        <div class="margin-top-1">${game.i18n.localize("PDE.TOOLTIP.GO_BACK")}</div>
      </div>
      <div id="info-underline" class="underline"></div>
      <div class="tooltip-header"></div>
      <div id="header-underline" class="underline"></div>

      <div class="tooltip-details"></div>
      <div id="details-underline" class="underline invisible"></div>

      <div class="tooltip-description"></div>
    `;
    return tooltip;
  }

  static showTooltipFor(object, event, html, options) {
    if (object instanceof Item)             _itemTooltip(object, event, html, options);
    if (object instanceof ActiveEffect)     _effectTooltip(object, event, html, options);
    if (object instanceof JournalEntryPage) _journalPageTooltip(object, event, html, options);
  }

  static hideTooltip(event, html) {
    event.preventDefault();
    if (event.altKey) return;

    const tooltip = html.find("#tooltip-container");
    tooltip[0].style.opacity = 0;
    tooltip[0].style.visibility = "hidden";
  }
}

async function _itemTooltip(item, event, html, options) {
  const header = _header(item.img, item.name);
  const descriptionPath = game.settings.get("pazindor-dev-essentials", "tooltipItemDescriptionPath") || "system.description";
  const description = await _description(getValueFromPath(item, descriptionPath));
  const details = PDE.system.itemDetails ? PDE.system.itemDetails(item) : null;
  _showTooltip(html, event, header, description, details, options);
}

async function _effectTooltip(effect, event, html, options) {
  const header = _header(effect.img, effect.name);
  const description = await _description(effect.description);
  const details = _effectDetails(effect);
  _showTooltip(html, event, header, description, details, options);
}

async function _journalPageTooltip(page, event, html, options) {
  const header = _header(options.img || "icons/svg/book.svg", options.header || page.name);
  const description = await _description(page.text.content);
  _showTooltip(html, event, header, description, null, options);
}

//================================//
//          HTML CREATOR          //
//================================//
function _header(img, name) {
  return `
    <img class="image" src="${img}"/>
    <input disabled value="${name}" data-tooltip="${name}"/>
  `
}

async function _description(description) {
  if (!description) return "<div class='description'></div>";
  description = foundry.utils.deepClone(description); // Dont work on the original

  const enhancedDescription = await _enhanceDescription(description);
  return `<div class='description'> ${enhancedDescription} </div>`;
}

async function _enhanceDescription(description) {
  description = await _injectEmbededLinks(description);
  // TODO Run system specific tooltip enrichments ex. &Reference for dnd5e
  if (PDE.system?.enhanceTooltipDescription) {
    description = await PDE.system.enhanceTooltipDescription(description);
  }
  description = _prepareUuidLinks(description);
  return _clearStyles(description);
}

async function _injectEmbededLinks(description) {
    const embedRegex = /@Embed\[(.*?)\]/g;
    const embeded = [...description.matchAll(embedRegex)];
    for (const match of embeded) {
      const full = match[0];
      if (!full) continue;

      let uuid = full.split(" ")[0];
      uuid = uuid.slice(7);
      const object = await fromUuid(uuid);
      const descriptionPath = game.settings.get("pazindor-dev-essentials", "tooltipItemDescriptionPath") || "system.description";

      let innerDescription;
      if (object instanceof Item)               innerDescription = getValueFromPath(object, descriptionPath);
      if (object instanceof ActiveEffect)       innerDescription = object.description;
      if (object instanceof JournalEntryPage)   innerDescription = object.text.content;
      if (innerDescription != null) description = description.replace(full, innerDescription);
    }
    return description;
}

function _prepareUuidLinks(description) {
  const uuidRegex = /@UUID\[[^\]]*]\{[^}]*}/g;
  const itemLinks = [...description.matchAll(uuidRegex)];
  itemLinks.forEach(link => {
    link = link[0];
    let [uuid, name] = link.split("]{");    
    // Remove "trash"
    uuid = uuid.slice(6);
    name = name.slice(0, name.length- 1);

    let tooltipLink = ""; 
    if (uuid.includes(".Item.")) tooltipLink = `<span class="item-tooltip hyperlink-style" data-uuid="${uuid}">${name}</span>`;
    else if (uuid.includes(".JournalEntryPage.")) tooltipLink = `<span class="journal-tooltip hyperlink-style" data-uuid="${uuid}">${name}</span>`;
    else tooltipLink = `<span><b>${name}</b></span>`;
    description = description.replace(link, tooltipLink);
  });
  return description;
}

function _clearStyles(text) {
  const regex = /style="[^"]*"/g;
  const clean = text.replace(regex, '');
  return clean;
}

function _effectDetails(effect) {
  let content = "";
  if (effect.disabled) content += `<div class="detail"><i class="fa-solid fa-hourglass" style="margin-right: 2px;"></i> ${game.i18n.localize("PDE.TOOLTIP.DISABLED")}</div>`;
  if (effect.isTemporary) content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.TEMPORARY")}</div>`;
  else content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.PASSIVE")}</div>`;
  if (content) return `<div class="box-wrapper">${content}</div>`;
}

//================================//
//          SHOW TOOLTIP          //
//================================//
function _showTooltip(html, event, header, description, details, options) {
  const tooltip = html.find("#tooltip-container");

  // If tooltip is already visible we dont want other tooltips to appear
  if(tooltip[0].style.visibility === "visible") return;

  _showHidePartial(header, tooltip.find(".tooltip-header"), tooltip.find("#header-underline"));
  _showHidePartial(description, tooltip.find(".tooltip-description"));
  _showHidePartial(details, tooltip.find(".tooltip-details"), tooltip.find("#details-underline"));
  _setPosition(event, tooltip, options);
  _addEventListener(tooltip);

  tooltip.contextmenu(() => {
    if (tooltip.oldContent && tooltip.oldContent.length > 0) {
      const oldContent = tooltip.oldContent.pop();
      _swapTooltipContent(tooltip, oldContent.header, oldContent.description, oldContent.details);
    }
  })

  // Visibility
  tooltip[0].style.opacity = 1;
  tooltip[0].style.visibility = "visible";
}

function _addEventListener(tooltip) {
  // Repleace Content
  tooltip.find('.journal-tooltip').click(async ev => {
    const data = ev.currentTarget.dataset;
    if (tooltip.oldContent === undefined) tooltip.oldContent = [];

    const page = await fromUuid(data.uuid);
    if (!page) return;

    // We need to store old tooltips so we could go back
    tooltip.oldContent.push({
      header: tooltip.find(".tooltip-header").html(),
      description: tooltip.find(".tooltip-description").html(),
    });

    const header = _header(data.img || "icons/svg/book.svg", data.header || page.name);
    const description = await _description(page.text.content);
    _swapTooltipContent(tooltip, header, description);
  });

  tooltip.find('.item-tooltip').click(async ev => {
    const data = ev.currentTarget.dataset;
    if (tooltip.oldContent === undefined) tooltip.oldContent = [];

    const item = await fromUuid(data.uuid);
    if (!item) return;

    // We need to store old tooltips so we could go back
    tooltip.oldContent.push({
      header: tooltip.find(".tooltip-header").html(),
      description: tooltip.find(".tooltip-description").html(),
    });

    const header = _header(item.img, item.name);
    const descriptionPath = game.settings.get("pazindor-dev-essentials", "tooltipItemDescriptionPath") || "system.description";
    const description = await _description(getValueFromPath(item, descriptionPath));
    const details = null; // GET ITEM DETAILS
    _swapTooltipContent(tooltip, header, description, details);
  });
}

function _swapTooltipContent(tooltip, header, description, details) {
  _showHidePartial(header, tooltip.find(".tooltip-header"), tooltip.find("#header-underline"));
  _showHidePartial(description, tooltip.find(".tooltip-description"));
  _showHidePartial(details, tooltip.find(".tooltip-details"), tooltip.find("#details-underline"));
  _addEventListener(tooltip);
}

function _showHidePartial(value, partial, underline) {
  if (value) {
    partial.html(value);
    partial.removeClass("invisible");
    if (underline) underline.removeClass("invisible");
  }
  else {
    partial.html(null);
    partial.addClass("invisible");
    if (underline) underline.addClass("invisible");
  }
}

function _setPosition(event, tooltip, options) {
    // Force height and width if provided
    if (options.position) {
      const pos = options.position; 

      if (pos.height) tooltip.height(pos.height);
      if (pos.width) tooltip.width(pos.width);

      if (pos.left) tooltip[0].style.left = pos.left;
      if (pos.top) tooltip[0].style.top = pos.top;
      if (pos.bottom) tooltip[0].style.bottom = pos.bottom;

      if (pos.maxHeight) tooltip[0].style.maxHeight = "500px";
      if (pos.minWidth) tooltip[0].style.minWidth = "300px";
    }
    else {
      tooltip[0].style.maxHeight = "500px";
      tooltip[0].style.minWidth = "300px";

      // Horizontal position
      const height = tooltip[0].getBoundingClientRect().height;
      tooltip[0].style.top = (event.pageY - (height/2)) + "px";
      const bottom = tooltip[0].getBoundingClientRect().bottom;
      const top = tooltip[0].getBoundingClientRect().top;
      const viewportHeight = window.innerHeight;
      
      // We dont want our tooltip to exit top nor bottom borders
      if (bottom > viewportHeight) {
        tooltip[0].style.top = (viewportHeight - height) + "px";
      }
      if (top < 0) tooltip[0].style.top = "0px";
      // Vertical position
      tooltip[0].style.left = "";
      const left = tooltip[0].getBoundingClientRect().left;
      const width = tooltip[0].getBoundingClientRect().width;
      if (!options.inside) tooltip[0].style.left = (left - width) + "px";
      if (tooltip[0].getBoundingClientRect().left < 0) {
        // In the case that tooltip exits window areas we want to put it next to the cursor
        const cursorPosition = event.pageX;
        tooltip[0].style.left = (cursorPosition + 50) + "px";
      }
    } 
}