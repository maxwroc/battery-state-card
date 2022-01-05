import { css } from "lit";
import { property } from "lit/decorators.js"
import { HomeAssistant } from "custom-card-helpers"
import { isNumber, log, safeGetArray, safeGetConfigObject } from "../utils";
import { batteryHtml } from "./battery-state-entity.views";
import { LovelaceCard } from "./lovelace-card";
import sharedStyles from "./shared.css"
import entityStyles from "./battery-state-entity.css";
import { handleAction } from "../action";
import { RichStringProcessor } from "../rich-string-processor";
import { getColorForBatteryLevel } from "../colors";

/**
 * Some sensor may produce string value like "45%". This regex is meant to parse such values.
 */
const stringValuePattern = /\b([0-9]{1,3})\s?%/;

/**
 * Battery entity element
 */
export class BatteryStateEntity extends LovelaceCard<IBatteryEntityConfig> {

    /**
     * Name
     */
    @property({ attribute: false })
    public name: string;

    /**
     * Secondary information displayed undreneath the name
     */
    @property({ attribute: false })
    public secondaryInfo: string | Date;

    /**
     * Entity state / battery level
     */
    @property({ attribute: false })
    public state: string;

    /**
     * Unit
     */
    @property({ attribute: false })
    public unit: string | undefined;

    /**
     * Entity icon
     */
    @property({ attribute: false })
    public icon: string;

    /**
     * Entity icon color
     */
    @property({ attribute: false })
    public iconColor: string;

    /**
     * Tap action
     */
    @property({ attribute: false })
    public action: IAction | undefined;

    /**
     * Entity CSS styles
     */
    public static get styles() {
        return css(<any>[sharedStyles + entityStyles]);
    }
    
    async internalUpdate() {
        this.name = getName(this.config, this.hass);
        this.state = getBatteryLevel(this.config, this.hass);
        if (isNumber(this.state)) {
            this.unit = String.fromCharCode(160) + (this.config.unit || "%");
        }
        else {
            this.unit = undefined;
        }

        const isCharging = getChargingState(this.config, this.state, this.hass);
        this.secondaryInfo = getSecondaryInfo(this.config, this.hass, isCharging);
        this.icon = getIcon(this.config, Number(this.state), isCharging, this.hass);
        this.iconColor = getColorForBatteryLevel(this.config, this.state, isCharging);
    }

    connectedCallback() {
        super.connectedCallback();
        // enable action if configured
        this.setupAction(true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // disabling action if exists
        this.setupAction(false);
    }

    render() {
        return batteryHtml(this);
    }

    /**
     * Adding or removing action
     * @param enable Whether to enable/add the tap action
     */
    private setupAction(enable: boolean = true) {
        if (enable) {
            if (this.config.tap_action && !this.action) {
                this.action = evt => {
                    evt.stopPropagation();
                    handleAction({
                        card: this,
                        config: safeGetConfigObject(this.config.tap_action!, "action"),
                        entityId: this.config.entity,
                    }, this.hass!);
                }
    
                this.addEventListener("click", this.action);
                this.classList.add("clickable");
            }
        }
        else {
            if (this.action) {
                this.classList.remove("clickable");
                this.removeEventListener("click", this.action);
                this.action = undefined;
            }
        }
    }
}

/**
 * Battery name getter
 * @param config Entity config
 * @param hass HomeAssistant state object
 * @returns Battery name
 */
const getName = (config: IBatteryEntityConfig, hass: HomeAssistant | undefined): string => {
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

/**
 * Gets secondary info text
 * @param config Entity config
 * @param hass HomeAssistant state object
 * @param isCharging Whther battery is in charging mode
 * @returns Secondary info text
 */
const getSecondaryInfo = (config: IBatteryEntityConfig, hass: HomeAssistant | undefined, isCharging: boolean): string | Date => {
    if (config.secondary_info) {
        const processor = new RichStringProcessor(hass, config.entity, {
            "charging": isCharging ? (config.charging_state?.secondary_info_text || "Charging") : "" // todo: think about i18n
        });

        let result = processor.process(config.secondary_info);

        const dateVal = Date.parse(result);
        return isNaN(dateVal) ? result : new Date(dateVal);
    }

    return <any>null;
}

/**
 * Getts battery level/state
 * @param config Entity config
 * @param hass HomeAssistant state object
 * @returns Battery level
 */
const getBatteryLevel = (config: IBatteryEntityConfig, hass?: HomeAssistant): string => {
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

/**
 * Gets MDI icon class
 * @param config Entity config
 * @param level Battery level/state
 * @param isCharging Whether battery is in chargin mode
 * @param hass HomeAssistant state object
 * @returns Mdi icon string
 */
const getIcon = (config: IBatteryEntityConfig, level: number, isCharging: boolean, hass: HomeAssistant | undefined): string => {
    if (isCharging && config.charging_state?.icon) {
        return config.charging_state.icon;
    }

    if (config.icon) {
        const attribPrefix = "attribute.";
        if (hass && config.icon.startsWith(attribPrefix)) {
            const attribName = config.icon.substr(attribPrefix.length);
            const val = hass.states[config.entity].attributes[attribName] as string | undefined;
            if (!val) {
                log(`Icon attribute missing in '${config.entity}' entity`, "error");
                return config.icon;
            }

            return val;
        }

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

/**
 * Gets flag indicating charging mode
 * @param config Entity config
 * @param state Battery level/state
 * @param hass HomeAssistant state object
 * @returns Whether battery is in chargin mode
 */
const getChargingState = (config: IBatteryEntityConfig, state: string, hass?: HomeAssistant): boolean => {
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