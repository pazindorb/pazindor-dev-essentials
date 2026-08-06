export function daggerheartConfig() {
  PDE.system = {
    itemDescriptionPath: "system.description",
    enhanceTooltipDescription: enhanceTooltipDescription,
    itemDetails: itemDetails
  }
}

async function enhanceTooltipDescription(description, options={}) {
  const item = options.object;
  if (item?.system.metadata?.hasDescription) {
    const data = await item.system.getDescriptionData();
    description = [data.prefix, data.value, data.suffix]
      .filter(Boolean)
      .join("<hr>");
  }

  return runEnrichers(description, options);
}

async function runEnrichers(description, options={}) {
  description = description.replaceAll("&amp;", "&");
  options.relativeTo = options.object;

  for (const enricher of CONFIG.TextEditor.enrichers) {
    const matches = [...description.matchAll(enricher.pattern)];
    for (const match of matches) {
      const enriched = await enricher.enricher(match, options);
      const element = typeof enriched === "string" ? null : enriched;
      const uuidElement = element?.matches?.("[data-uuid]")
        ? element
        : element?.querySelector?.("[data-uuid]");
      const uuid = uuidElement?.dataset.uuid;

      if (uuid) {
        const label = uuidElement.textContent?.trim() || match[2] || uuid;
        description = description.replace(match[0], `@UUID[${uuid}]{${label}}`);
        continue;
      }

      const html = typeof enriched === "string"
        ? enriched
        : enriched?.getHTML?.() ?? enriched?.outerHTML ?? match[0];
      description = description.replace(match[0], html);
    }
  }

  return description;
}

function itemDetails(item) {
  let content = "";
  const actions = item.system.actionsList?.values() ?? [];

  // Action Info
  for (const action of actions) {
    content += costDetail(action);
    switch (action.type) {
      case "attack": 
        content += rollDetail(action); 
        content += partsDetail(action, "damage");
        break;

      case "healing":
        content += rollDetail(action); 
        content += partsDetail(action, "healing");
        break;

      case "damage": 
        content += partsDetail(action, "damage"); 
        break;

      case "countdown":
        content += countdownDetail(action);
        break;

      default: 
        content += actionDetail(action); 
        break;
    }
    content += rangeDetail(action);
  }

  if (content) return `<div class="box-wrapper">${content}</div>`;
  return "";
}

function rollDetail(action) {
  const actionType = action.type;
  const trait = action.roll?.trait;
  const rollType = action.roll?.type;

  let label = `${game.i18n.localize(CONFIG.DH.ACTIONS.actionTypes?.[actionType].name)}`;  // Roll Type
  if (rollType) 
    label += `: ${game.i18n.localize(CONFIG.DH.GENERAL.rollTypes?.[rollType]?.label)}`    // Roll Subtype
  if(["attack", "trait"].includes(rollType) && trait) 
    label += `(${game.i18n.localize(CONFIG.DH.ACTOR.abilities?.[trait]?.label)})`         // Ability/Trait
  
  return `<div class="detail" style="background-color: #4d0353">${label}</div>`;
}

function partsDetail(action, partsType) {
  const actionType = action.type;
  let label = `${game.i18n.localize(CONFIG.DH.ACTIONS.actionTypes?.[actionType].name)}`;

  const parts = action.damage?.parts || {};
  let first = true;
  for (const part of Object.values(parts)) {
    let partLabel = "";

    // Formula
    if (part.value.custom.enabled) partLabel += `${part.value.custom.formula} `;
    else partLabel += `${prepareFormula(action, part)} `;

    // Type
    partLabel += game.i18n.localize(CONFIG.DH.GENERAL.abilityCosts?.[part.applyTo]?.label);
    if (part.applyTo === "hitPoints") {
      if (part.type.has("physical")) partLabel += " [P]";
      if (part.type.has("magical")) partLabel += " [M]";
    }

    // Merge
    if (first) label += ": ";
    if (!first) label += ", ";
    label += partLabel;
    first = false;
  }

  const color = actionType === "healing" ? "#0a6e1b" : "#6e0a0a";
  return `<div class="detail" style="background-color: ${color}">${label}</div>`;
}

function prepareFormula(action, part) {
  return Roll.replaceFormulaData(part.value.getFormula(), action.actor?.getRollData() ?? {});
}

function rangeDetail(action) {
  if (!action.range) return "";

  const rangeName = CONFIG.DH.GENERAL.range?.[action.range]?.label ?? action.range;
  const range = game.i18n.localize(rangeName);
  const label = `${game.i18n.localize("DAGGERHEART.GENERAL.range")}: ${range}`;
  return `<div class="detail">${label}</div>`;
}

function costDetail(action) {
  let content = "";
  const costs = action.cost ?? [];
  for (const cost of costs) {
    let name = CONFIG.DH.GENERAL.abilityCosts?.[cost.key]?.label;
    if (cost.itemId) name = action.parent?.parent?.name;
    else name = game.i18n.localize(name);
    const amount = cost.scalable ? `${cost.value} (+${cost.step})` : cost.value;
    const color = costColor(cost.key);
    content += `<div class="detail" style="background-color: ${color}">${amount} ${name}</div>`;
  }
  return content;
}

function costColor(key) {
  switch(key) {
    case "stress": return "#037461";
    case "hope": return "#998b09";
    case "hitPoints": return "#914600";
    case "fear": return "#841999";
    default: return ""
  }
}

function countdownDetail(action) {
  const actionName = CONFIG.DH.ACTIONS.actionTypes?.[action.type]?.name ?? action.type;
  let label = game.i18n.localize(actionName);
  const rollData = action.actor?.getRollData() ?? {};
  const countdowns = action.countdown ?? [];

  if (countdowns.length) {
    const details = countdowns.map(countdown => {
      const formula = Roll.replaceFormulaData(countdown.progress?.startFormula || "1", rollData);
      return `${countdown.name} (${formula})`;
    });
    label += `: ${details.join(", ")}`;
  }

  return `<div class="detail" style="background-color: #233aa0">${label}</div>`;
}

function actionDetail(action) {
  const name = CONFIG.DH.ACTIONS.actionTypes?.[action.type]?.name ?? action.type;
  const label = game.i18n.localize(name);
  return `<div class="detail" style="background-color: #71807f">${label}</div>`;
}
