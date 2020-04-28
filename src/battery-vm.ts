import { IBatteryEntity, IAppearance } from "./types";
import { log, getColorInterpolationForPercentage } from "./utils";
import { IAction } from "./action";

/**
 * Battery view model.
 */
class BatteryViewModel {

    private _name: string;

    private _level: string = "Unknown";

    public updated: boolean = false;

    private colorPattern = /^#[A-Fa-f0-9]{6}$/;

    /**
     * @param config Battery entity
     */
    constructor(private config: IBatteryEntity, private appearance: IAppearance, public action: IAction | null) {
        this._name = config.name || config.entity;
    }

    get entity_id(): string {
        return this.config.entity;
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
        return isNaN(Number(this._level)) ? this._level : this._level;
    }

    /**
     * Battery level color.
     */
    get levelColor(): string {

        const defaultColor = "inherit";
        const level = Number(this._level);

        if (isNaN(level)) {
            return defaultColor;
        }

        if (this.appearance.color_gradient && this.isColorGradientValid(this.appearance.color_gradient)) {
            return getColorInterpolationForPercentage(this.appearance.color_gradient, level);
        }

        const thresholds = this.appearance.color_thresholds ||
            [{ value: 20, color: "var(--label-badge-red)" }, { value: 55, color: "var(--label-badge-yellow)" }, { value: 101, color: "var(--label-badge-green)" }];

        return thresholds.find(th => level <= th.value)?.color || defaultColor;
    }

    /**
     * Icon showing battery level/state.
     */
    get icon(): string {

        const level = Number(this._level);

        if (isNaN(level)) {
            return "mdi:battery-unknown";
        }

        const roundedLevel = Math.round(level / 10) * 10;
        switch (roundedLevel) {
            case 100:
                return 'mdi:battery';
            case 0:
                return 'mdi:battery-outline';
            default:
                return 'mdi:battery-' + roundedLevel;
        }
    }

    get classNames(): string {
        return this.action ? "clickable" : "";
    }

    /**
     * Updates battery data.
     * @param entityData HA entity data
     */
    public update(entityData: any) {
        if (!entityData) {
            log("Entity not found: " + this.config.entity, "error");
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

        if (this.config.multiplier && !isNaN(Number(level))) {
            level = (this.config.multiplier * Number(level)).toString();
        }

        // for dev/testing purposes we allow override for value
        this.level = this.config.value_override === undefined ? level : this.config.value_override;
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