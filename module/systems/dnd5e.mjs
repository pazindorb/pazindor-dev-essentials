export function dnd5eConfig() {
  PDE.system = {
    itemDescriptionPath: "system.description.value",
    enhanceTooltipDescription: enhanceTooltipDescription,
    itemDetails: itemDetails
  }
}

async function enhanceTooltipDescription(description, options={}) {
  description = description.replaceAll("&amp;", "&");
  options.relativeTo = options.object;

  for (const enricher of CONFIG.TextEditor.enrichers) {
    const matches = [...description.matchAll(enricher.pattern)];
    for (const match of matches) {
      const enriched = await enricher.enricher(match, options);

      // Handle Links
      let uuidElement;
      if (enriched.hasAttribute(["data-uuid"])) uuidElement = enriched;
      if (enriched.querySelector("[data-uuid]")) uuidElement = enriched.querySelector("[data-uuid]");
      if (uuidElement) {
        const uuid = uuidElement.getAttribute("data-uuid");
        if (uuid) {
          const uuidLink = `@UUID[${uuid}]{${match[2]}}`;
          description = description.replace(match[0], uuidLink); // tooltip will handle that format
          continue;
        }
      }

      description = description.replace(match[0], enriched.getHTML());
    }
  }
  return description;
}

function itemDetails(item) {
  let content = "";
  if (!item.system.isActive) return `<div class="box-wrapper"><div class="detail" style="background-color: #4d0353">${game.i18n.localize("DND5E.Passive")}</div></div>` // Return Passive

  const activity = item.system.activities.find(() => true); // We want to grab 1st activity only
  const l = activity.labels;

  if (l.activation) content += `<div class="detail" style="background-color: #4d0353">${l.activation}</div>`;
  if (l.toHit)      content += `<div class="detail" style="background-color: #196e69">${game.i18n.localize("PDE.TOOLTIP.TO_HIT")}${l.toHit}</div>`;
  if (l.save)       content += `<div class="detail" style="background-color: #196e69">${l.save}</div>`;
  
  if (l.damage) {
    for (const dmg of l.damage) {
      const color = ["temphp", "healing"].includes(dmg.damageType) ? "#0a6e1b" : "#6e0a0a";
      content += `<div class="detail" style="background-color: ${color}">${dmg.label}</div>`;
    }
  }
  
  if (l.duration)     content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.DURATION")}${l.duration}</div>`;
  if (l.target)       content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.TARGET")}${l.target}</div>`;
  if (l.range)        content += `<div class="detail">${game.i18n.localize("PDE.TOOLTIP.RANGE")}${l.range}</div>`;

  let propContent = ""
  const properties = item.system.properties;
  if (properties && properties.size > 0) {
    for (const propKey of properties) {
      const property = CONFIG.DND5E.itemProperties[propKey];
      if (property) propContent += `<div class="detail" style="font-size: 11px; background-color: #71807f;">${property.label}</div>`
    }
  }

  let finalContent = "";
  if (content) finalContent += `<div class="box-wrapper">${content}</div>`
  if (propContent) finalContent += `<div id="prop-underline" class="underline"></div> <div class="box-wrapper" style="gap: 3px;">${propContent}</div>`
  return finalContent;
}