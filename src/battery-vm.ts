import { IBatteryEntity } from "./types";

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
    constructor(public entity: IBatteryEntity) {
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
}

export default BatteryViewModel;