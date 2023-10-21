import { HomeAssistant } from "custom-card-helpers/dist/types";
import { log, safeGetArray } from "../utils";

/**
 * Gets flag indicating charging mode
 * @param config Entity config
 * @param state Battery level/state
 * @param hass HomeAssistant state object
 * @returns Whether battery is in chargin mode
 */
 export const getChargingState = (config: IBatteryEntityConfig, state: string, hass?: HomeAssistant): boolean => {

    if (!hass) {
        return false;
    }

    const chargingConfig = config.charging_state;
    if (!chargingConfig) {
        return getDefaultChargingState(config, hass);
    }

    let entityWithChargingState = hass.states[config.entity];

    // check whether we should use different entity to get charging state
    if (chargingConfig.entity_id) {
        entityWithChargingState = hass.states[chargingConfig.entity_id]
        if (!entityWithChargingState) {
            log(`'charging_state' entity id (${chargingConfig.entity_id}) not found`);
            return false;
        }

        state = entityWithChargingState.state;
    }

    const attributesLookup = safeGetArray(chargingConfig.attribute);
    // check if we should take the state from attribute
    if (attributesLookup.length != 0) {
        // take first attribute name which exists on entity
        const exisitngAttrib = attributesLookup.find(attr => getValueFromJsonPath(entityWithChargingState.attributes, attr.name) !== undefined);
        if (exisitngAttrib) {
            return exisitngAttrib.value !== undefined ?
                getValueFromJsonPath(entityWithChargingState.attributes, exisitngAttrib.name) == exisitngAttrib.value :
                true;
        }
        else {
            // if there is no attribute indicating charging it means the charging state is false
            return false;
        }
    }

    const statesIndicatingCharging = safeGetArray(chargingConfig.state);

    return statesIndicatingCharging.length == 0 ? !!state : statesIndicatingCharging.some(s => s == state);
}

const standardBatteryLevelEntitySuffix = "_battery_level";
const standardBatteryStateEntitySuffix = "_battery_state";
const getDefaultChargingState = (config: IBatteryEntityConfig, hass?: HomeAssistant): boolean => {
    if (!config.entity.endsWith(standardBatteryLevelEntitySuffix)) {
        return false;
    }

    const batteryStateEntity = hass?.states[config.entity.replace(standardBatteryLevelEntitySuffix, standardBatteryStateEntitySuffix)];
    if (!batteryStateEntity) {
        return false;
    }

    return ["Charging", "charging"].includes(batteryStateEntity.state);
}

/**
 * Returns value from given object and the path
 * @param data Data
 * @param path JSON path
 * @returns Value from the path
 */
 const getValueFromJsonPath = (data: any, path: string) => {
    if (data === undefined) {
        return data;
    }

    path.split(".").forEach(chunk => {
        data = data ? data[chunk] : undefined;
    });

    return data;
}