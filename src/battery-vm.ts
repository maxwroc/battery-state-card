import { IBatteryEntity, IAppearance } from "./types";
import { log, getColorInterpolationForPercentage } from "./utils";

/**
 * Battery view model.
 */
class BatteryViewModel {

    private _name: string = "";

    private _level: number = 0;

    public updated: boolean = false;

    private colorPattern = /^#[A-Fa-f0-9]{6}$/;

    /**
     * @param entity Battery entity
     */
    constructor(public entity: IBatteryEntity, private config: IAppearance) {
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
    set level(level: number) {
        this.updated = this._level != level;
        this._level = level;
    }

    /**
     * Battery level.
     */
    get level(): number {
        return this._level;
    }

    /**
     * Battery level color.
     */
    get levelColor(): string {

        if (this.config.color_gradient && this.isColorGradientValid(this.config.color_gradient)) {
            return getColorInterpolationForPercentage(this.config.color_gradient, this.level);
        }

        const defaultColor = "inherit";
        const thresholds = this.config.color_thresholds ||
            [{ value: 20, color: "var(--label-badge-red)" }, { value: 55, color: "var(--label-badge-yellow)" }, { value: 101, color: "var(--label-badge-green)" }];

        return thresholds.find(th => this.level <= th.value)?.color || defaultColor;
    }

    /**
     * Icon showing battery level/state.
     */
    get icon(): string {
        const roundedLevel = Math.round(this.level / 10) * 10;
        switch (roundedLevel) {
            case 100:
                return 'mdi:battery';
            case 0:
                return 'mdi:battery-outline';
            default:
                return 'mdi:battery-' + roundedLevel;
        }
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