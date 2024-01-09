import { RichStringProcessor } from "../rich-string-processor";
import { HomeAssistantExt } from "../type-extensions";
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
export const getBatteryLevel = (config: IBatteryEntityConfig, hass?: HomeAssistantExt): IBatteryState => {
    const UnknownLevel = hass?.localize("state.default.unknown") || "Unknown";
    let state: string;
    let unit: string | undefined;

    const stringProcessor = new RichStringProcessor(hass, config.entity);

    if (config.value_override !== undefined) {
        const processedValue = stringProcessor.process(config.value_override.toString());
        return {
            state: processedValue,
            level: isNumber(processedValue) ? Number(processedValue) : undefined,
            unit: getUnit(processedValue, undefined, undefined, config, hass),
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
        const candidates: (string | number | undefined)[] = [
            config.non_battery_entity ? null: entityData.attributes.battery_level,
            config.non_battery_entity ? null: entityData.attributes.battery,
            entityData.state
        ];

        state = candidates.find(val => isNumber(val))?.toString() ||
                candidates.find(val => val !== null && val !== undefined)?.toString() ||
                UnknownLevel;
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

    // check if HA should format the value
    if (config.default_state_formatting !== false && !displayValue && state === entityData.state) {
        const formattedState = hass.formatEntityState(entityData);

        // assuming it is a number followed by unit
        [state, unit] = formattedState.split(" ", 2);
        unit = unit;
    }

    return {
        state: displayValue || state,
        level: isNumber(state) ? Number(state) : undefined,
        unit: getUnit(state, displayValue, unit, config, hass),
    };
}

const getUnit = (state: string, displayValue: string | undefined, unit: string | undefined, config: IBatteryEntityConfig, hass?: HomeAssistantExt): string | undefined => {
    if (config.unit) {
        // config unit override
        unit = config.unit
    }
    else {
        // default unit
        unit = unit || hass?.states[config.entity]?.attributes["unit_of_measurement"] || "%"
    }

    if (!isNumber(state) || (displayValue && !isNumber(displayValue))) {
        // for non numeric states unit should not be rendered
        unit = undefined;
    }

    return unit;
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

    /**
     * Unit override
     */
    unit?: string
}