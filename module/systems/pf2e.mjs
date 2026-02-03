export function pf2eConfig() {
  PDE.system = {
    itemDescriptionPath: "system.description.value",
    enhanceTooltipDescription: enhanceTooltipDescription,
    itemDetails: itemDetails
  }
}

async function enhanceTooltipDescription(description) {
  description = description.replaceAll("&amp;", "&");

  for (const enricher of CONFIG.TextEditor.enrichers) {
    const matches = [...description.matchAll(enricher.pattern)];
    for (const match of matches) {
      const enriched = await enricher.enricher(match);

      let uuidElement;
      if (enriched.hasAttribute(["data-uuid"])) uuidElement = enriched;
      if (enriched.querySelector("[data-uuid]")) uuidElement = enriched.querySelector("[data-uuid]");
      
      let uuid;
      if (uuidElement) {
        uuid = uuidElement.getAttribute("data-uuid");
      }

      if (uuid) {
        const uuidLink = `@UUID[${uuid}]{${match[2]}}`;
        description = description.replace(match[0], uuidLink); // tooltip will handle that format
      }
    }
  }
  return description;
}

function itemDetails(item) {
  let content = "";

  if (item.system.time?.value) {
    const value = item.system.time.value;
    if (isNaN(value)) content += actionElement(value) ;
    else content += actionElement(`${value} ${game.i18n.localize("PDE.TOOLTIP.ACTION")}`);
  }
  if (item.type === "weapon" || item.type === "shield") {
    content += actionElement(`1 ${game.i18n.localize("PDE.TOOLTIP.ACTION")}`);
  }
  let actionType = item.system.actionType?.value;
  if (actionType) {
    const value = item.system.actions?.value;
    if (value) content += actionElement(`${value} ${game.i18n.localize("PDE.TOOLTIP.ACTION")}`);
    else content += actionElement(capitalize(actionType));
  }

  if (item.system.defense) {
    const def = item.system.defense;
    let defense = "";
    if (def.save) {
      if (def.save.basic) defense += `${game.i18n.localize("PDE.TOOLTIP.BASIC")} `;
      defense += game.i18n.localize(`PF2E.Saves${capitalize(def.save.statistic)}`); 
    }
    if (def.passive) defense += "AC";

    content += `<div class="detail" style="background-color: #196e69">${game.i18n.localize("PDE.TOOLTIP.DEFENSE")}${defense}</div>`;
  }

  if (item.system.damage) {
    const damage = item.system.damage;
    let formulas = [];
    if (damage.damageType || damage.type) formulas.push(damage);
    else formulas = Object.values(damage);

    for (const formula of formulas) {
      const modifier = formula.modifier ? ` + ${formula.modifier}` : "";
      const applyMod = (formula.applyMod || formula.die)  ? ` + (Mod)` : "";

      const value = formula.formula ? `${formula.formula}${applyMod}` : `${formula.dice}${formula.die}${applyMod}${modifier}`;
      const type = formula.damageType || formula.type;
      
      const label = game.i18n.localize(CONFIG.PF2E.damageTypes[type]);
      const color = type === "vitality" ? "#0a6e1b" : "#6e0a0a";
      content += `<div class="detail" style="background-color: ${color}">${value} ${label}</div>`;
    }
  }

  if (item.system.area) {
    const area = item.system.area;
    content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.AREA")}${area.value} feet ${capitalize(area.type)}</div>`;
  }

  if (item.system.duration?.value) 
    content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.DURATION")}${item.system.duration.value}</div>`;

  if (item.system.range?.value)
    content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.RANGE")}${item.system.range.value}</div>`;

  if (!isNaN(item.system.range) && item.system.range > 0)
    content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.RANGE")}${item.system.range} feet</div>`;

  if (item.system.target?.value)
    content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.TARGET")}${item.system.target.value}</div>`;

  if (item.system?.reload?.label) 
    content += `<div class="detail">${item.system.reload.label}</div>`;

  let traitContent = ""
  const traits = item.system.traits;
  if (traits && traits.value.length > 0) {
    let allTraits = {};
    for (const [key, traits] of Object.entries(CONFIG.PF2E)) {
      if (key.includes("Traits")) allTraits = {...allTraits, ...traits};
    }

    for (const traitKey of traits.value) {
      const trait = allTraits[traitKey];
      if (trait) {
        traitContent += `<div class="detail" style="font-size: 12px; background-color: #71807f">${game.i18n.localize(trait)}</div>`
      }
    }
  }

  let finalContent = "";
  if (content) finalContent += `<div class="box-wrapper">${content}</div>`
  if (traitContent) {
    const underline = finalContent ? '<div id="trait-underline" class="underline"></div>' : "";
    finalContent += `${underline} <div class="box-wrapper" style="gap: 3px;">${traitContent}</div>`
  } 
  return finalContent;
}

function capitalize(s) {
  return s[0].toUpperCase() + s.slice(1);;
} 

function actionElement(value) {
  return `<div class="detail" style="background-color: #4d0353; box-shadow: 0 0 5px 2px #863986 inset;">${value}</div>`
}