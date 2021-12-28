import { BatteryStateEntity } from "./custom-elements/battery-state-entity";
import { BatteryStateCard } from "./custom-elements/battery-state-card";
import { log, printVersion } from "./utils";


if (customElements.get("battery-state-entity") === undefined) {
    printVersion();
    customElements.define("battery-state-entity", BatteryStateEntity);
    customElements.define("battery-state-card", BatteryStateCard);
}
else {
    log("Element seems to be defined already", "warn");
}