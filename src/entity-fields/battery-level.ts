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
 export const getBatteryLevel = (config: IBatteryEntityConfig, hass?: HomeAssistant): IBatteryState => {
    const UnknownLevel = hass?.localize("state.default.unknown") || "Unknown";
    let state: string;

    const stringProcessor = new RichStringProcessor(hass, config.entity);

    if (config.value_override !== undefined) {
        const processedValue = stringProcessor.process(config.value_override.toString());
        return {
            state: processedValue,
            level: isNumber(processedValue) ? Number(processedValue) : undefined
        }
    }

    const entityData = hass?.states[config.entity];

    if (!entityData) {
        return {
            state: UnknownLevel
        };
    }

    if (config.attribute) {
        state = entityData.attributes[config.attribute];
        if (state == undefined) {
            log(`Attribute "${config.attribute}" doesn't exist on "${config.entity}" entity`);
            state = UnknownLevel;
        }
    }
    else {
        const candidates: string[] = [
            config.non_battery_entity ? null: entityData.attributes.battery_level,
            config.non_battery_entity ? null: entityData.attributes.battery,
            entityData.state
        ];

        state = candidates.find(val => isNumber(val)) ||
                candidates.find(val => val !== null && val !== undefined)?.toString() ||
                UnknownLevel
    }

    let displayValue: string | undefined;

    // check if we should convert value eg. for binary sensors
    if (config.state_map) {
        const convertedVal = config.state_map.find(s => s.from === state);
        if (convertedVal === undefined) {
            if (!isNumber(state)) {
                log(`Missing option for '${state}' in 'state_map.'`);
            }
        }
        else {
            state = convertedVal.to.toString();
            if (convertedVal.display !== undefined) {
                displayValue = stringProcessor.process(convertedVal.display);
            }
        }
    }

    // trying to extract value from string e.g. "34 %"
    if (!isNumber(state)) {
        const match = stringValuePattern.exec(state);
        if (match != null) {
            state = match[1];
        }
    }

    if (isNumber(state)) {
        if (config.multiplier) {
            state = (config.multiplier * Number(state)).toString();
        }

        if (typeof config.round === "number") {
            state = parseFloat(state).toFixed(config.round).toString();
        }
    }
    else {
        // capitalize first letter
        state = state.charAt(0).toUpperCase() + state.slice(1);
    }

    return {
        state: displayValue || state,
        level: isNumber(state) ? Number(state) : undefined
    };
}

interface IBatteryState {
    /**
     * Battery level
     */
    level?: number;

    /**
     * Battery state to display
     */
    state: string;
}