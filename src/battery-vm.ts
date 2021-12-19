import { IBatteryEntity } from "./types";
import { log, getColorInterpolationForPercentage, isNumber, safeGetArray } from "./utils";
import { IAction } from "./action";
import { HomeAssistant } from "custom-card-helpers";

/**
 * Battery view model.
 */
class BatteryViewModel {

    private _name: string;

    private _level: string = "Unknown";

    private _charging: boolean = false;

    private _secondary_info: string | Date = <any>null;

    private _is_hidden: boolean = false;

    public updated: boolean = false;

    private colorPattern = /^#[A-Fa-f0-9]{6}$/;

    /**
     * Some sensor may produce string value like "45%". This regex is meant to parse such values.
     */
    private stringValuePattern = /\b([0-9]{1,3})\s?%/;

    /**
     * Home Assistant state instance
     */
    public hass: HomeAssistant;

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

    get secondary_info(): string | Date {
        return this._secondary_info;
    }

    set secondary_info(val: string | Date) {
        this.updated = this.updated || this._secondary_info != val;
        this._secondary_info = val;
    }

    get classNames(): string {
        const classNames = [];
        this.action && classNames.push("clickable");
        !isNumber(this.level) && classNames.push("non-numeric-state");
        return classNames.join(" ");
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