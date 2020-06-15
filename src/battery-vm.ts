import { IBatteryEntity } from "./types";
import { log, getColorInterpolationForPercentage, isNumber, safeGetArray, getRelativeTime } from "./utils";
import { IAction } from "./action";
import { HomeAssistant, HassEntity } from "./ha-types";

/**
 * Battery view model.
 */
class BatteryViewModel {

    private _name: string;

    private _level: string = "Unknown";

    private _charging: boolean = false;

    private _secondary_info: string = <any>null;

    private _is_hidden: boolean = false;

    public updated: boolean = false;

    private colorPattern = /^#[A-Fa-f0-9]{6}$/;

    /**
     * @param config Battery entity
     */
    constructor(private config: IBatteryEntity, public action: IAction | null) {
        this._name = config.name || config.entity;
    }

    get entity_id(): string {
        return this.config.entity;
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
        this.updated = this.updated || this._name != name;
        this._name = name;
    }

    /**
     * Device name to display.
     */
    get name(): string {
        let name = this._name;

        // since the getter is called only during rendering while setter always to check
        // if value has changed it is more efficient to apply rename here
        const renameRules = safeGetArray(this.config.bulk_rename)
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
     * Battery level.
     */
    set level(level: string) {
        this.updated = this.updated || this._level != level;
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

    get is_hidden(): boolean {
        return this._is_hidden;
    }

    set is_hidden(val: boolean) {
        this.updated = this.updated || this._is_hidden != val;
        this._is_hidden = val;
    }

    get secondary_info(): string {
        return this._secondary_info;
    }

    set secondary_info(val: string) {
        this.updated = this.updated || this._secondary_info != val;
        this._secondary_info = val;
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
        const classNames = [];
        this.action && classNames.push("clickable");
        !isNumber(this.level) && classNames.push("non-numeric-state");
        return classNames.join(" ");
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

        this.updated = false;

        this.name = this.config.name || entityData.attributes.friendly_name

        this.level = this.getLevel(entityData, hass);

        // must be called after getting battery level
        this.charging = this.getChargingState(hass);

        // must be called after getting charging state
        this.secondary_info = this.setSecondaryInfo(hass, entityData);
    }

    /**
     * Gets battery level
     * @param entityData Entity state data
     */
    private getLevel(entityData: HassEntity, hass: HomeAssistant): string {
        const UnknownLevel = hass.localize("state.default.unknown");
        let level: string;

        if (this.config.attribute) {
            level = entityData.attributes[this.config.attribute];
            if (level == undefined) {
                log(`Attribute "${this.config.attribute}" doesn't exist on "${this.config.entity}" entity`);
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
        level = this.config.value_override === undefined ? level : this.config.value_override;

        if (!isNumber(level)) {
            // capitalize first letter
            level = level.charAt(0).toUpperCase() + level.slice(1);
        }

        return level;
    }

    /**
     * Gets charging state if configuration specified.
     * @param entityDataList HA entity data
     */
    private getChargingState(hass: HomeAssistant): boolean {
        const chargingConfig = this.config.charging_state;
        if (!chargingConfig) {
            return false;
        }

        // take the state from the level property as it originate from various places
        let state = this.level;
        let entityWithChargingState = hass.states[this.config.entity];

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
        }

        const statesIndicatingCharging = safeGetArray(chargingConfig.state);

        return statesIndicatingCharging.length == 0 ? !!state : statesIndicatingCharging.some(s => s == state);
    }

    /**
     * Gets secondary info
     * @param hass Home Assistant instance
     * @param entityData Entity state data
     */
    private setSecondaryInfo(hass: HomeAssistant, entityData: HassEntity): string {
        if (this.config.secondary_info) {
            if (this.config.secondary_info == "charging") {
                if (this.charging) {
                    return this.config.charging_state?.secondary_info_text || "Charging"; // todo: think about i18n
                }

                return <any>null;
            }
            else {
                const val = (<any>entityData)[this.config.secondary_info] || entityData.attributes[this.config.secondary_info] || this.config.secondary_info;
                return isNaN(Date.parse(val)) ? val : getRelativeTime(hass, val);
            }
        }

        return <any>null;
    }

    /**
     * Validates if given color values are correct
     * @param color_gradient List of color values to validate
     */
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