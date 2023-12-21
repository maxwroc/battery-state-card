import { html } from "lit";
import { IBatteryCollection } from "../battery-provider";
import { IBatteryGroup } from "../grouping";
import { BatteryStateCard } from "./battery-state-card";
import { BatteryStateEntity } from "./battery-state-entity";
import { icon } from "./battery-state-entity.views";

const header = (text: string | undefined) => text && html`
<div class="card-header">
    <div class="truncate">
        ${text}
    </div>
</div>
`;


export const collapsableWrapper = (model: IBatteryGroup, batteries: IBatteryCollection) => {
    const elemId = "expander" + Math.random().toString().substr(2);
    return html`
<div class="expandWrapper entity-spacing">
    <div class="toggler" @click=${(e: MouseEvent) => (<HTMLElement>e.currentTarget).classList.toggle("expanded")}>
        ${icon(model.icon, model.iconColor)}
        <div class="name truncate">
            ${model.title}
            ${model.secondaryInfo ? html`<div class="secondary">${model.secondaryInfo}</div>` : null}
        </div>
        <div class="chevron">&lsaquo;</div>
    </div>
    <div style="max-height: ${Object.keys(batteries).length * 50}px">
        ${model.batteryIds.map(id => batteryWrapper(batteries[id]))}
    </div>
</div>
`
};


export const cardHtml = (model: BatteryStateCard) => html`
<ha-card>
    ${header(model.header)}
    <div class="card-content">
        ${model.list.map(id => batteryWrapper(model.batteries[id]))}
        ${model.groups.map(g => collapsableWrapper(g, model.batteries))}
    </div>
</ha-card>
`;

const batteryWrapper = (battery: BatteryStateEntity) => html`
<div class="entity-spacing">
    ${battery}
</div>
`;