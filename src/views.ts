import { html } from "./lit-element";

function getIcon(batteryLevel: number): string {
    const roundedLevel = Math.round(batteryLevel / 10) * 10;
    switch (roundedLevel) {
        case 100:
            return 'mdi:battery';
        case 0:
            return 'mdi:battery-outline';
        default:
            return 'mdi:battery-' + roundedLevel;
    }
}

function getColor(batteryLevel: number): string {
    if (batteryLevel > 35) {
        return  "good";
    }
    else if (batteryLevel > 15) {
        return "warning";
    }

    return "critical";
}


const header = (text: string) => html`
<div class="card-header">
    <div class="name">
        ${text}
    </div>
</div>
`;


export const battery = (level: number, name: string) => html`
<div class="battery">
    <div class="icon">
        <ha-icon
            class="${getColor(level)}"
            icon="${getIcon(level)}"
        ></ha-icon>
    </div>
    <div class="name">
        ${name}
    </div>
    <div class="state">
        ${level} %
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