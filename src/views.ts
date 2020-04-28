import { html } from "./lit-element";
import BatteryViewModel from "./battery-vm";


const header = (text: string) => html`
<div class="card-header">
    <div class="name">
        ${text}
    </div>
</div>
`;


export const battery = (model: BatteryViewModel) => html`
<div class="battery ${model.classNames}" @click=${model.action}>
    <div class="icon">
        <ha-icon
            style="color: ${model.levelColor}"
            icon="${model.icon}"
        ></ha-icon>
    </div>
    <div class="name">
        ${model.name}
    </div>
    <div class="state">
        ${model.level}${isNaN(Number(model.level)) ? "" : " %"}
    </div>
</div>
`;

export const card = (headerText: string, contents: string[]) => html`
<ha-card>
    ${header(headerText)}
    <div class="card-content">
        ${contents}
    </div>
</ha-card>
`;

export const collapsableWrapper = (contents: string[], collapseAfter: number) => {
    const elemId = "expander" + Math.random().toString().substr(2);
    return html`
    ${contents.slice(0, collapseAfter)}
    <input type="checkbox" class="expand" id="${elemId}" />
    <label for="${elemId}"><div>&lsaquo;</div></label>
    <div>${contents.slice(collapseAfter)}</div>
    `
};