import { css, LitElement } from "lit";
import { property } from "lit/decorators.js"
import { HomeAssistant } from "custom-card-helpers"
import { IBatteryEntity } from "../types";
import { getColorInterpolationForPercentage, isNumber, log, safeGetArray } from "../utils";
import { IAction } from "../action";
import { batteryHtml } from "./battery-state-entity.views";
import { LovelaceCard } from "./lovelace-card";
import sharedStyles from "./shared.css"
import entityStyles from "./battery-state-entity.css";

/**
 * Some sensor may produce string value like "45%". This regex is meant to parse such values.
 */
const stringValuePattern = /\b([0-9]{1,3})\s?%/;

/**
 * Valid HTML color pattern
 */
const colorPattern = /^#[A-Fa-f0-9]{6}$/;

export class BatteryStateEntity extends LovelaceCard<IBatteryEntity> {

    @property({ attribute: false })
    public name: string;

    @property({ attribute: false })
    public secondaryInfo: string | Date;

    @property({ attribute: false })
    public state: string;

    @property({ attribute: false })
    public icon: string;

    @property({ attribute: false })
    public iconColor: string;

    @property({ attribute: false })
    public action: IAction;

    public static get styles() {
        return css(<any>[sharedStyles + entityStyles]);
    }
    
    internalUpdate(): void {
        this.name = getName(this.config, this.hass);
        this.state = getLevel(this.config, this.hass);

        const isCharging = getChargingState(this.config, this.state, this.hass);
        this.secondaryInfo = getSecondaryInfo(this.config, this.hass, isCharging);
        this.icon = getIcon(this.config, Number(this.state), isCharging);
        this.iconColor = getIconColor(this.config, this.state, isCharging);

    }

    render() {
        return batteryHtml(this);
    }
}

const getName = (config: IBatteryEntity, hass: HomeAssistant | undefined): string => {
    if (config.name) {
        return config.name;
    }

    if (!hass) {
        return config.entity;
    }

    let name = hass.states[config.entity]?.attributes.friendly_name || config.entity;

    const renameRules = safeGetArray(config.bulk_rename)
    renameRules.forEach(r => {
        if (r.from[0] == "/" && r.from[r.from.length - 1] == "/") {
            // create regexp after removing slashes
            name = name.replace(new RegExp(r.from.substr(1, r.from.length - 2)), r.to || "");
        }
        else {
            name = name.replace(r.from, r.to || "");
        }
    });

    return name;
}

const getSecondaryInfo = (config: IBatteryEntity, hass: HomeAssistant | undefined, isCharging: boolean): string | Date => {
    if (config.secondary_info) {
        if (config.secondary_info == "charging") {
            if (isCharging) {
                return config.charging_state?.secondary_info_text || "Charging"; // todo: think about i18n
            }

            return <any>null;
        }
        else {
            let val = config.secondary_info;

            const entityData = hass?.states[config.entity];
            if (entityData) {
                val = (<any>entityData)[config.secondary_info] || entityData?.attributes[config.secondary_info] || config.secondary_info
            }

            const dateVal = Date.parse(val);
            return isNaN(dateVal) ? val : new Date(dateVal);
        }
    }

    return <any>null;
}

const getLevel = (config: IBatteryEntity, hass?: HomeAssistant): string => {
    const UnknownLevel = hass?.localize("state.default.unknown") || "Unknown";
    let level: string;

    if (config.value_override !== undefined) {
        return config.value_override;
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

        level = candidates.find(n => n !== null && n !== undefined)?.toString() || UnknownLevel;
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

    if (!isNumber(level)) {
        const match = stringValuePattern.exec(level);
        if (match != null) {
            level = match[1];
        }
    }

    if (config.multiplier && isNumber(level)) {
        level = (config.multiplier * Number(level)).toString();
    }

    if (!isNumber(level)) {
        // capitalize first letter
        level = level.charAt(0).toUpperCase() + level.slice(1);
    }

    return level;
}

const getIcon = (config: IBatteryEntity, level: number, isCharging: boolean): string => {
    if (isCharging && config.charging_state?.icon) {
        return config.charging_state.icon;
    }

    if (config.icon) {
        return config.icon;
    }

    if (isNaN(level) || level > 100 || level < 0) {
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

const getIconColor = (config: IBatteryEntity, state: string, isCharging: boolean): string => {

    const defaultColor = "inherit";
    const level = Number(state);

    if (isCharging && config.charging_state?.color) {
        return config.charging_state.color;
    }

    if (isNaN(level) || level > 100 || level < 0) {
        return defaultColor;
    }

    if (config.color_gradient && isColorGradientValid(config.color_gradient)) {
        return getColorInterpolationForPercentage(config.color_gradient, level);
    }

    const thresholds = config.color_thresholds ||
        [{ value: 20, color: "var(--label-badge-red)" }, { value: 55, color: "var(--label-badge-yellow)" }, { value: 101, color: "var(--label-badge-green)" }];

    return thresholds.find(th => level <= th.value)?.color || defaultColor;
}


const getChargingState = (config: IBatteryEntity, state: string, hass?: HomeAssistant): boolean => {
    const chargingConfig = config.charging_state;
    if (!chargingConfig || !hass) {
        return false;
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
        const exisitngAttrib = attributesLookup.find(attr => entityWithChargingState.attributes[attr.name] != undefined);
        if (exisitngAttrib) {
            return exisitngAttrib.value != undefined ?
                entityWithChargingState.attributes[exisitngAttrib.name] == exisitngAttrib.value :
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

const isColorGradientValid = (color_gradient: string[]) => {
    if (color_gradient.length < 2) {
        log("Value for 'color_gradient' should be an array with at least 2 colors.");
        return;
    }

    for (const color of color_gradient) {
        if (!colorPattern.test(color)) {
            log("Color '${color}' is not valid. Please provide valid HTML hex color in #XXXXXX format.");
            return false;
        }
    }

    return true;
}




