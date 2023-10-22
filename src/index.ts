import { BatteryStateEntity } from "./custom-elements/battery-state-entity";
import { BatteryStateCard } from "./custom-elements/battery-state-card";
import { log, printVersion } from "./utils";

declare let window: HomeAssistantWindow;

if (customElements.get("battery-state-entity") === undefined) {
    printVersion();
    customElements.define("battery-state-entity", BatteryStateEntity);
    customElements.define("battery-state-card", BatteryStateCard);
}
else {
    log("Element seems to be defined already", "warn");
}

window.customCards = window.customCards || [];
window.customCards.push({
    type: "battery-state-card",
    name: "Battery state card",
    preview: true,
    description: "Customizable card for listing battery states/levels"
});