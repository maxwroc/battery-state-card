import { HomeAssistant } from "custom-card-helpers/dist/types";
import { RichStringProcessor } from "../rich-string-processor";
import { isNumber, log } from "../utils";

/**
 * Some sensor may produce string value like "45%". This regex is meant to parse such values.
 */
 const stringValuePattern = /\b([0-9]{1,3})\s?%/;

/**
 * Getts battery level/state
 * @param config Entity config
 * @param hass HomeAssistant state object
 * @returns Battery level
 */
 export const getBatteryLevel = (config: IBatteryEntityConfig, hass?: HomeAssistant): string => {
    const UnknownLevel = hass?.localize("state.default.unknown") || "Unknown";
    let level: string;

    if (config.value_override !== undefined) {
        const proc = new RichStringProcessor(hass, config.entity);
        return proc.process(config.value_override.toString());
    }

    const entityData = hass?.states[config.entity];

    if (!entityData) {
        return UnknownLevel;
    }

    if (config.attribute) {
        level = entityData.attributes[config.attribute];
        if (level == undefined) {
            log(`Attribute "${config.attribute}" doesn't exist on "${config.entity}" entity`);
            level = UnknownLevel;
        }
    }
    else {
        const candidates: string[] = [
            entityData.attributes.battery_level,
            entityData.attributes.battery,
            entityData.state
        ];

        level = candidates.find(val => isNumber(val)) ||
                candidates.find(val => val !== null && val !== undefined)?.toString() ||
                UnknownLevel
    }

    // check if we should convert value eg. for binary sensors
    if (config.state_map) {
        const convertedVal = config.state_map.find(s => s.from === level);
        if (convertedVal === undefined) {
            if (!isNumber(level)) {
                log(`Missing option for '${level}' in 'state_map'`);
            }
        }
        else {
            level = convertedVal.to.toString();
        }
    }

    // trying to extract value from string e.g. "34 %"
    if (!isNumber(level)) {
        const match = stringValuePattern.exec(level);
        if (match != null) {
            level = match[1];
        }
    }

    if (isNumber(level)) {
        if (config.multiplier) {
            level = (config.multiplier * Number(level)).toString();
        }

        if (typeof config.round === "number") {
            level = parseFloat(level).toFixed(config.round).toString();
        }
    }
    else {
        // capitalize first letter
        level = level.charAt(0).toUpperCase() + level.slice(1);
    }

    return level;
}