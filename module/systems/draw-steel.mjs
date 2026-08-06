export function drawSteelConfig() {
  PDE.system = {
    itemDescriptionPath: "system.description.value",
    enhanceTooltipDescription: enhanceTooltipDescription,
    itemDetails: itemDetails
  }
}

async function enhanceTooltipDescription(description, options={}) {
  if (options.object?.type === "ability") {
    const ability = options.object.system;
    const spendValue = ability.spend?.value;
    const resourceName = options.object.actor?.system.coreResource?.name
      ?? game.i18n.localize("DRAW_STEEL.Actor.hero.FIELDS.hero.primary.value.label");
    const spendLabel = spendValue == null
      ? game.i18n.localize("DRAW_STEEL.Item.ability.FIELDS.spend.text.label")
      : game.i18n.format("DRAW_STEEL.Item.ability.SpendLabel", { value: spendValue, name: resourceName });
    const sections = [
      [game.i18n.localize("DRAW_STEEL.Item.ability.FIELDS.story.label"), ability.story],
      [game.i18n.localize("DRAW_STEEL.Item.ability.FIELDS.trigger.label"), ability.trigger],
      [game.i18n.localize("DRAW_STEEL.Item.ability.FIELDS.effect.before.label"), ability.effect?.before],
      [game.i18n.localize("DRAW_STEEL.Item.ability.FIELDS.effect.after.label"), ability.effect?.after],
      [spendLabel, ability.spend?.text]
    ];

    const rows = sections
      .filter(([, content]) => content)
      .map(([label, content]) => `<dt><b>${label}</b></dt><dd>${content}</dd>`)
      .join("");
    description = rows ? `<dl class="ability-description">${rows}</dl>` : "";
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
  if (item.type !== "ability") return "";

  // Power Tier Tresholds
  const tier1 = item.system.power.effects.sortedContents.map(effect => effect.toText(1)).filter(_ => _).join("; ");
  const tier2 = item.system.power.effects.sortedContents.map(effect => effect.toText(2)).filter(_ => _).join("; ");
  const tier3 = item.system.power.effects.sortedContents.map(effect => effect.toText(3)).filter(_ => _).join("; ");
  const powerRolls = !tier1 ? "" : `
  <dl class="power-roll-display">
    <div style="display: flex;">
      <dt class="tier1" style="margin: 0 0 5px 5px;">!</dt>
      <dd class="tier1" style="margin: 0 0 5px 5px;">${tier1}</dd>
    </div>

    <div style="display: flex;">
      <dt class="tier2" style="margin: 0 0 5px 5px;">@</dt>
      <dd class="tier2" style="margin: 0 0 5px 5px;">${tier2}</dd>
    </div>

    <div style="display: flex;">
      <dt class="tier3" style="margin: 0 0 5px 5px;">#</dt>
      <dd class="tier3" style="margin: 0 0 5px 5px;">${tier3}</dd>
    </div>
  </dl>
  `;

  let details = ""
  const ability = item.system;

  if (ability.resource) {
    const resourceName = item.actor.system?.coreResource?.name;
    details += `<div class="detail" style="background-color: #196e69">${ability.resource} ${resourceName}</div>`
  }
  if (ability.type) {
    const label = ds.CONFIG.abilities.types[ability.type]?.label;
    if (label) details += `<div class="detail" style="background-color: #4d0353">${label}</div>`;
  }
  if (ability.category) {
    const label = ds.CONFIG.abilities.categories[ability.category]?.label;
    if (label) details += `<div class="detail" style="background-color: #15069c">${label}</div>`;
  }
  if (ability.target.type) {
    const label = ability.formattedLabels.target;
    if (label) details += `<div class="detail"><i class="fa-solid fa-bullseye-arrow" style="margin-right: 2px;"></i>${label}</div>`
  }
  if (ability.distance.type) {
    const label = ability.formattedLabels.distance;
    if (label) details += `<div class="detail"><i class="fa-solid fa-ruler-triangle" style="margin-right: 2px;"></i>${label}</div>`
  }

  // Keywords
  let keywords = "";
  for (const keyword of item.system.keywords) {
    const label = ds.CONFIG.abilities.keywords[keyword]?.label ?? keyword;
    keywords += `<div class="detail" style="font-size: 11px; background-color: #71807f;">${label}</div>`;
  }

  let content = powerRolls;
  if (details) {
    if (powerRolls) content += `<div class="underline"></div>`
    content += `<div class="box-wrapper"">${details}</div>`
  }
  if (keywords) {
    if (details || powerRolls) content += `<div class="underline"></div>`
    content += `<div class="box-wrapper" style="gap: 3px;">${keywords}</div>`;
  }
  return content;
}
