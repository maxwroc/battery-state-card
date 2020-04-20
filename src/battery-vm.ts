import { IBatteryEntity, IAppearance } from "./types";

/**
 * Battery view model.
 */
class BatteryViewModel {

    private _name: string = "";

    private _level: number = 0;

    public updated: boolean = false;

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
        if (this.config.icon_colors === false) {
            return "inherit";
        }

        if (this.level > (this.config.warrning_level || 35)) {
            return this.config.good_color || "var(--label-badge-green)";
        }
        else if (this.level > (this.config.critical_level || 15)) {
            return this.config.warrning_color || "var(--label-badge-yellow)";
        }

        return this.config.critical_color || "var(--label-badge-red)";
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
}

export default BatteryViewModel;