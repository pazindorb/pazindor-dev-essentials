export function pf1Config() {
  PDE.system.itemDescriptionPath = "system.description.value";
  PDE.system.itemDetails = itemDetails;
}

function itemDetails(item) {
  let content = "";
  const action = item.defaultAction;
  const labels = action?.getLabels({isolated: !item.actor}) ?? item.labels ?? {};

  if (labels.activation) content += actionElement(localizeLabel(labels.activation));
  if (labels.actionType) content += `<div class="detail" style="background-color: #4d0353">${localizeLabel(labels.actionType)}</div>`;

  if (labels.save) content += `<div class="detail" style="background-color: #196e69">${localizeLabel(labels.save)}</div>`;

  const damageParts = action?.damage?.parts ?? [];
  for (const part of damageParts) {
    if (!part.formula) continue;
    const damageTypes = damageTypeLabels(part);
    const label = damageTypes ? `${part.formula} ${damageTypes}` : part.formula;
    const color = action.isHealing ? "#0a6e1b" : "#6e0a0a";
    content += `<div class="detail" style="background-color: ${color}">${label}</div>`;
  }

  if (labels.duration) content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.DURATION")}${localizeLabel(labels.duration)}</div>`;
  if (labels.range) content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.RANGE")}${localizeLabel(labels.range)}</div>`;
  if (labels.targets) content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.TARGET")}${labels.targets}</div>`;
  if (labels.area) content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.AREA")}${labels.area}</div>`;

  if (item.type === "spell") {
    const school = item.labels?.school ?? pf1.config.spellSchools[item.system.school];
    const components = item.labels?.components ?? item.getSpellComponents?.().map(localizeLabel).join(", ");

    if (school) content += `<div class="detail" style="background-color: #71807f">${localizeLabel(school)}</div>`;
    if (components) content += `<div class="detail" style="background-color: #71807f">${components}</div>`;
  }

  let propContent = "";
  const properties = item.system.properties;
  if (properties) {
    for (const [propKey, enabled] of Object.entries(properties)) {
      if (!enabled) continue;
      const property = pf1.config.weaponProperties[propKey];
      if (property) propContent += `<div class="detail" style="font-size: 11px; background-color: #71807f;">${game.i18n.localize(property)}</div>`
    }
  }

  let finalContent = "";
  if (content) finalContent += `<div class="box-wrapper">${content}</div>`
  if (propContent) {
    const underline = finalContent ? '<div id="prop-underline" class="underline"></div>' : "";
    finalContent += `${underline} <div class="box-wrapper" style="gap: 3px;">${propContent}</div>`
  }
  return finalContent;
}

function damageTypeLabels(part) {
  const types = Array.from(part.types ?? []);
  const labels = types.map(type => {
    const damageType = pf1.registry.damageTypes.get(type);
    return damageType?.name || type;
  });
  return labels.join(", ");
}

function localizeLabel(label) {
  return game.i18n.has(label) ? game.i18n.localize(label) : label;
}

function actionElement(value) {
  return `<div class="detail" style="background-color: #4d0353; box-shadow: 0 0 5px 2px #863986 inset;">${value}</div>`
}
