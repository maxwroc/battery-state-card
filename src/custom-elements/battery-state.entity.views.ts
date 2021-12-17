import { HomeAssistant } from "custom-card-helpers";
import { html } from "lit";
import { isNumber } from "../utils";
import { BatteryStateEntity } from "./battery-state-entity";

const secondaryInfo = (text?: string) => text && html`
<div class="secondary">${text}</div>
`;

const secondaryInfoTime = (hass: HomeAssistant | undefined, time?: Date) => time && html`
<div class="secondary">
    <ha-relative-time .hass="${hass}" .datetime="${time}"></ha-relative-time>
</div>
`;

const icon = (icon?: string, color?: string) => icon && html`
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
    ${typeof(model.secondaryInfo) == "string" ? secondaryInfo(model.secondaryInfo) : secondaryInfoTime(model.hass, model.secondaryInfo)}
</div>
<div class="state">
    ${model.state}${isNumber(model.state) ? html`&nbsp;%` : ""}
</div>
`;