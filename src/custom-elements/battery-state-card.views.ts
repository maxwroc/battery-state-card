import { html } from "lit";
import { BatteryStateCard } from "./battery-state-card";
import { BatteryStateEntity } from "./battery-state-entity";
import { secondaryInfo } from "./battery-state.entity.views";

const header = (text: string | undefined) => text && html`
<div class="card-header">
    <div class="truncate">
        ${text}
    </div>
</div>
`;


// export const collapsableWrapper = (contents: any[], model: IBatteryGroupViewData) => {
//     const elemId = "expander" + Math.random().toString().substr(2);
//     return html`
// <div class="expandWrapper entity-spacing">
//     <div class="entity-row toggler" @click=${(e: MouseEvent) => (<HTMLElement>e.currentTarget).classList.toggle("expanded")}>
//         ${icon(model.icon, model.iconColor)}
//         <div class="name truncate">
//             ${model.name}
//             ${secondaryInfo(model.secondary_info)}
//         </div>
//         <div class="chevron">&lsaquo;</div>
//     </div>
//     <div style="max-height: ${contents.length * 50}px">${contents}</div>
// </div>
// `
// };


export const cardHtml = (model: BatteryStateCard) => html`
<ha-card>
    ${header(model.header)}
    <div class="card-content">
        ${model.list.map(i => batteryWrapper(model.batteries[i]))}
    </div>
</ha-card>
`;

const batteryWrapper = (battery: BatteryStateEntity) => html`
<div class="entity">
    ${battery}
</div>
`;