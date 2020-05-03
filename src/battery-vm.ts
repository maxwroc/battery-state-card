import { IBatteryEntity } from "./types";
import { log, getColorInterpolationForPercentage, isNumber, safeGetArray } from "./utils";
import { IAction } from "./action";
import { HomeAssistant } from "./ha-types";

/**
 * Battery view model.
 */
class BatteryViewModel {

    private _name: string;

    private _level: string = "Unknown";

    private _charging: boolean = false;

    public updated: boolean = false;

    private colorPattern = /^#[A-Fa-f0-9]{6}$/;

    /**
     * @param config Battery entity
     */
    constructor(private config: IBatteryEntity, public action: IAction | null) {
        this._name = config.name || config.entity;
    }

    /**
     * List of entity ids for which data is required.
     */
    get data_required_for(): string[] {
        return this.config.charging_state?.entity_id ?
            [this.config.entity, this.config.charging_state.entity_id] :
            [this.config.entity];
    }

    /**
     * Device name to display.
     */
    set name(name: string) {
        this.updated = this._name != name;
        this._name = name;
    }

    /**
     * Device name to display.
     */
    get name(): string {
        return this._name;
    }

    /**
     * Battery level.
     */
    set level(level: string) {
        this.updated = this._level != level;
        this._level = level;
    }

    /**
     * Battery level.
     */
    get level(): string {
        return this._level;
    }

    set charging(charging: boolean) {
        this.updated = this.updated || this.charging != charging;
        this._charging = charging;
    }

    get charging(): boolean {
        return this._charging;
    }

    /**
     * Battery level color.
     */
    get levelColor(): string {

        const defaultColor = "inherit";
        const level = Number(this._level);

        if (this.charging && this.config.charging_state?.color) {
            return this.config.charging_state.color;
        }

        if (isNaN(level)) {
            return defaultColor;
        }

        if (this.config.color_gradient && this.isColorGradientValid(this.config.color_gradient)) {
            return getColorInterpolationForPercentage(this.config.color_gradient, level);
        }

        const thresholds = this.config.color_thresholds ||
            [{ value: 20, color: "var(--label-badge-red)" }, { value: 55, color: "var(--label-badge-yellow)" }, { value: 101, color: "var(--label-badge-green)" }];

        return thresholds.find(th => level <= th.value)?.color || defaultColor;
    }

    /**
     * Icon showing battery level/state.
     */
    get icon(): string {

        const level = Number(this._level);

        if (this.charging && this.config.charging_state?.icon) {
            return this.config.charging_state.icon;
        }

        if (isNaN(level)) {
            return "mdi:battery-unknown";
        }

        const roundedLevel = Math.round(level / 10) * 10;
        switch (roundedLevel) {
            case 100:
                return this.charging ? 'mdi:battery-charging-100' : "mdi:battery";
            case 0:
                return this.charging ? "mdi:battery-charging-outline" : "mdi:battery-outline";
            default:
                return (this.charging ? "mdi:battery-charging-" : "mdi:battery-") + roundedLevel;
        }
    }

    get classNames(): string {
        return this.action ? "clickable" : "";
    }

    /**
     * Updates battery data.
     * @param entityData HA entity data
     */
    public update(hass: HomeAssistant) {
        const entityData = hass.states[this.config.entity];

        if (!entityData) {
            log("Entity not found: " + this.config.entity, "error");
            return;
        }

        this.name = this.config.name || entityData.attributes.friendly_name

        let level: string;
        if (this.config.attribute) {
            level = entityData.attributes[this.config.attribute]
        }
        else {
            const candidates: string[] = [
                entityData.attributes.battery_level,
                entityData.attributes.battery,
                entityData.state
            ];

            level = candidates.find(n => n !== null && n !== undefined)?.toString() || "Unknown";
        }

        // check if we should convert value eg. for binary sensors
        if (this.config.state_map) {
            const convertedVal = this.config.state_map.find(s => s.from == level);
            if (convertedVal == undefined) {
                log(`Missing option for '${level}' in 'state_map'`);
            }
            else {
                level = convertedVal.to.toString();
            }
        }

        if (this.config.multiplier && isNumber(level)) {
            level = (this.config.multiplier * Number(level)).toString();
        }

        // for dev/testing purposes we allow override for value
        this.level = this.config.value_override === undefined ? level : this.config.value_override;

        if (!isNumber(this.level)) {
            // capitalize first letter
            this.level = this.level.charAt(0).toUpperCase() + this.level.slice(1);
        }

        this.setChargingState(hass);
    }

    /**
     * Sets charging state if configuration specified.
     * @param entityDataList HA entity data
     */
    private setChargingState(hass: HomeAssistant) {
        const chargingConfig = this.config.charging_state;
        if (!chargingConfig) {
            return;
        }

        // take the state from the level property as it can be extracted from
        let state = this.level;
        let entityWithChargingState = hass.states[this.config.entity];

        // check whether we should use different entity to get charging state
        if (chargingConfig.entity_id) {
            entityWithChargingState = hass.states[chargingConfig.entity_id]
            if (!entityWithChargingState) {
                log(`'charging_state' entity id (${chargingConfig.entity_id}) not found`);
                return;
            }

            state = entityWithChargingState.state;
        }

        const attributesLookup = safeGetArray(chargingConfig.attribute);
        // check if we should take the state from attribute
        if (attributesLookup.length != 0) {
            // take first attribute name which exists on entity
            const exisitngAttrib = attributesLookup.find(attr => entityWithChargingState.attributes[attr.name] != undefined);
            if (exisitngAttrib) {
                this.charging = exisitngAttrib.value != undefined ?
                    entityWithChargingState.attributes[exisitngAttrib.name] == exisitngAttrib.value :
                    true;
                return;
            }
        }

        const statesIndicatingCharging = safeGetArray(chargingConfig.state);

        this.charging = statesIndicatingCharging.length == 0 ? !!state : statesIndicatingCharging.some(s => s == state);
    }

    private isColorGradientValid(color_gradient: string[]) {
        if (color_gradient.length < 2) {
            log("Value for 'color_gradient' should be an array with at least 2 colors.");
            return;
        }

        for (const color of color_gradient) {
            if (!this.colorPattern.test(color)) {
                log("Color '${color}' is not valid. Please provide valid HTML hex color in #XXXXXX format.");
                return false;
            }
        }

        return true;
    }
}

export default BatteryViewModel;