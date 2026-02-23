import { HomeAssistant } from "custom-card-helpers";
import { log } from "../utils";
import { RichStringProcessor } from "../rich-string-processor";

/**
 * Gets MDI icon class
 * @param config Entity config
 * @param level Battery level/state
 * @param isCharging Whether battery is in chargin mode
 * @param hass HomeAssistant state object
 * @returns Mdi icon string
 */
export const getIcon = (config: IBatteryEntityConfig, level: number | undefined, isCharging: boolean, hass: HomeAssistant): string => {
    if (isCharging && config.charging_state?.icon) {
        return config.charging_state.icon;
    }

    if (config.icon) {

        const entityData = hass.states[config.entity];
        if (!entityData) {
            log(`Entity '${config.entity}' not found`, "error");
            return "mdi:battery-unknown";
        }

        const attribPrefix = "attribute.";
        // check if we should return the icon/string from the attribute value
        if (config.icon.startsWith(attribPrefix)) {
            const attribName = config.icon.substr(attribPrefix.length);

            const val = entityData.attributes[attribName] as string | undefined;
            if (!val) {
                log(`Icon attribute missing in '${config.entity}' entity`, "error");
                return "mdi:battery-unknown";
            }

            return val;
        }

        const processor = new RichStringProcessor(hass, { ...entityData });
        return processor.process(config.icon);
    }

    if (level === undefined || isNaN(level) || level > 100 || level < 0) {
        return "mdi:battery-unknown";
    }

    const roundedLevel = Math.round(level / 10) * 10;
    switch (roundedLevel) {
        case 100:
            return isCharging ? 'mdi:battery-charging-100' : "mdi:battery";
        case 0:
            return isCharging ? "mdi:battery-charging-outline" : "mdi:battery-outline";
        default:
            return (isCharging ? "mdi:battery-charging-" : "mdi:battery-") + roundedLevel;
    }
}