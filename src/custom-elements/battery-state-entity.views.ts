import { HomeAssistant } from "custom-card-helpers";
import { TemplateResult, html } from "lit";
import { BatteryStateEntity } from "./battery-state-entity";

const relativeTimeTag = new RegExp("<rt>([^<]+)</rt>", "g");

/**
 * Replaces temporary RT tages with proper HA "relative-time" ones
 * 
 * @param text Text to be processed
 * @param hass HomeAssistant instance
 * @returns Rendered templates
 */
const replaceTags = (text: string, hass?: HomeAssistant): TemplateResult[] => {

    const result: TemplateResult[] = []

    let matches: string[] | null = [];
    let currentPos = 0;
    while(matches = relativeTimeTag.exec(text)) {
        const matchPos = text.indexOf(matches[0], currentPos);

        if (matchPos != 0) {
            result.push(html`${text.substring(currentPos, matchPos)}`);
        }

        result.push(html`<ha-relative-time .hass="${hass}" .datetime="${new Date(matches[1])}"></ha-relative-time>`);

        currentPos += matchPos + matches[0].length;
    }
    
    if (currentPos < text.length) {
        result.push(html`${text.substring(currentPos, text.length)}`);
    }

    return result;
}

export const secondaryInfo = (text?: string, hass?: HomeAssistant) => text && html`
<div class="secondary">${replaceTags(text, hass)}</div>
`;

export const icon = (icon?: string, color?: string) => icon && html`
<div class="icon">
    <ha-icon
        style="color: ${color}"
        icon="${icon}"
    ></ha-icon>
</div>
`;

export const batteryHtml = (model: BatteryStateEntity) => html`
${icon(model.icon, model.iconColor)}
<div class="name truncate">
    ${model.name}
    ${secondaryInfo(model.secondaryInfo, model.hass)}
</div>
<div class="state">
    ${model.state}${unit(model.unit)}
</div>
`;

const unit = (unit: string | undefined) => unit && html`&nbsp;${unit}`;