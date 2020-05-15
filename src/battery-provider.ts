import BatteryViewModel from "./battery-vm";
import { IBatteryStateCardConfig, IFilter, FilterOperator, IBatteryEntity } from "./types";
import { HassEntity, HomeAssistant } from "./ha-types";
import { log } from "./utils";
import { ActionFactory } from "./action";

/**
 * Properties which should be copied over to individual entities from the card
 */
const entititesGlobalProps = [ "tap_action", "state_map", "charging_state", "secondary_info", "color_thresholds", "color_gradient" ];

/**
 * Functions to check if filter condition is met
 */
const operatorHandlers: { [key in FilterOperator]: (val: string | undefined, expectedVal: any) => boolean } = {
    "exists": val => val !== undefined,
    "contains": (val, searchString) => val !== undefined && val.indexOf(searchString) != -1,
    "=": (val, expectedVal) => val == expectedVal,
    ">": (val, expectedVal) => Number(val) > expectedVal,
    "<": (val, expectedVal) => Number(val) < expectedVal,
    ">=": (val, expectedVal) => Number(val) >= expectedVal,
    "<=": (val, expectedVal) => Number(val) <= expectedVal,
    "matches": (val, pattern: string) => {
        if (val === undefined) {
            return false;
        }

        let exp: RegExp | undefined;
        if (pattern[0] == "/" && pattern[pattern.length - 1] == "/") {
            // create regexp after removing slashes
            exp = new RegExp(pattern.substr(1, pattern.length - 2));
        } else if (pattern.indexOf("*") != -1) {
            exp = new RegExp(pattern.replace(/\*/g, ".*"));
        }

        return exp ? exp.test(val) : val === pattern;
    }
}

/**
 * Filter class
 */
class Filter {

    /**
     * Whether filter is permanent.
     *
     * Permanent filters removes entities/batteries from collections permanently
     * instead of making them hidden.
     */
    get is_permanent(): boolean {
        return this.config.name != "state";
    }

    constructor(private config: IFilter) {

    }

    /**
     * Checks whether entity meets the filter conditions.
     * @param entity Hass entity
     * @param state State override - battery state/level
     */
    isValid(entity: HassEntity, state?: string): boolean {
        const val = this.getValue(entity, state);
        return this.meetsExpectations(val);
    }

    /**
     * Gets the value to validate.
     * @param entity Hass entity
     * @param state State override - battery state/level
     */
    private getValue(entity: HassEntity, state?: string): string | undefined {
        if (!this.config.name) {
            log("Missing filter 'name' property");
            return;
        }

        if (this.config.name.indexOf("attributes.") == 0) {
            return entity.attributes[this.config.name.substr(11)];
        }

        if (this.config.name == "state" && state !== undefined) {
            return state;
        }

        return (<any>entity)[this.config.name];
    }

    /**
     * Checks whether value meets the filter conditions.
     * @param val Value to validate
     */
    private meetsExpectations(val: string | undefined): boolean {

        let operator = this.config.operator;
        if (!operator) {
            operator = val === undefined ? "exists" : "=";
        }

        const func = operatorHandlers[operator];
        if (!func) {
            log(`Operator '${this.config.operator}' not supported. Supported operators: ${Object.keys(operatorHandlers).join(", ")}`);
            return false;
        }

        return func(val, this.config.value);
    }
}

/**
 * Class responsible for intializing Battery view models based on given configuration.
 */
export class BatteryProvider {

    /**
     * Filters for automatic adding entities.
     */
    private include: Filter[] | undefined;

    /**
     * Filters to remove entitites from collection.
     */
    private exclude: Filter[] | undefined;

    /**
     * Battery view models.
     */
    private batteries: BatteryViewModel[] = [];

    /**
     * Whether include filters were processed already.
     */
    private initialized: boolean = false;

    constructor(private config: IBatteryStateCardConfig) {
        this.include = config.filter?.include?.map(f => new Filter(f));
        this.exclude = config.filter?.exclude?.map(f => new Filter(f));

        if (!this.include) {
            this.initialized = false;
        }

        this.processExplicitEntities();
    }

    /**
     * Return batteries
     * @param hass Home Assistant instance
     */
    getBatteries(hass?: HomeAssistant): BatteryViewModel[] {

        if (hass) {
            if (!this.initialized) {
                this.processIncludes(hass);
            }

            const updated = this.updateBatteries(hass);

            if (updated) {
                this.processExcludes(hass);
            }
        }

        return this.batteries;
    }

    /**
     * Creates and returns new Battery View Model
     */
    private createBattery(entity: IBatteryEntity) {
        // assing card-level values if they were not defined on entity-level
        entititesGlobalProps
            .filter(p => (<any>entity)[p] == undefined)
            .forEach(p => (<any>entity)[p] = (<any>this.config)[p]);

        return new BatteryViewModel(
            entity,
            ActionFactory.getAction({
                card: <any>this,
                config: entity.tap_action || this.config.tap_action || <any>null,
                entity: entity
            })
        );
    }

    /**
     * Adds batteries based on entities from config.
     */
    private processExplicitEntities() {
        let entities = this.config.entity
            ? [this.config]
            : this.config.entities!.map((entity: string | IBatteryEntity) => {
                // check if it is just the id string
                if (typeof (entity) === "string") {
                    entity = <IBatteryEntity>{ entity: entity };
                }

                return entity;
            });

        this.batteries = entities.map(entity => this.createBattery(entity));
    }

    /**
     * Adds batteries based on filter.include config.
     * @param hass Home Assistant instance
     */
    private processIncludes(hass: HomeAssistant) {
        // avoiding processing filter.include again
        this.initialized = true;

        Object.keys(hass.states).forEach(entity_id => {
            // check if entity matches filter conditions
            if (this.include?.some(filter => filter.isValid(hass.states[entity_id])) &&
                // check if battery is not added already (via explicit entities)
                !this.batteries.some(b => b.entity_id == entity_id)) {

                this.batteries.push(this.createBattery({ entity: entity_id }));
            }
        });
    }

    /**
     * Removes or hides batteries based on filter.exclude config.
     * @param hass Home Assistant instance
     */
    private processExcludes(hass: HomeAssistant) {
        if (this.exclude == undefined) {
            return;
        }

        const filters = this.exclude;
        const toBeRemoved: number[] = [];

        this.batteries.forEach((battery, index) => {
            let is_hidden = false;
            for (let filter of filters) {
                // passing HA entity state together with VM battery level as the source of this value can vary
                if (filter.isValid(hass.states[battery.entity_id], battery.level)) {
                    if (filter.is_permanent) {
                        // permanent filters have conditions based on static values so we can safely
                        // remove such battery to avoid updating it unnecessarily
                        toBeRemoved.push(index);
                    }
                    else {
                        is_hidden = true;
                    }
                }
            }

            // we keep the view model to keep updating it
            // it might be shown/not-hidden next time
            battery.is_hidden = is_hidden;
        });

        toBeRemoved.forEach(i => this.batteries.splice(i, 1));
    }

    /**
     * Updates battery view models based on HA states.
     * @param hass Home Assistant instance
     */
    private updateBatteries(hass: HomeAssistant): boolean {
        let updated = false;

        this.batteries.forEach((battery, index) => {
            battery.update(hass);
            updated = updated || battery.updated;
        });

        if (updated) {
            switch (this.config.sort_by_level) {
                case "asc":
                    this.batteries.sort((a, b) => this.sort(a.level, b.level));
                    break;
                case "desc":
                    this.batteries.sort((a, b) => this.sort(b.level, a.level));
                    break;
                default:
                    if (this.config.sort_by_level) {
                        log("Unknown sort option. Allowed values: 'asc', 'desc'");
                    }
            }

            // trigger the UI update
            this.batteries = [...this.batteries];
        }

        return updated;
    }

    /**
     * Sorting function for battery levels which can have "Unknown" state.
     * @param a First value
     * @param b Second value
     */
    private sort(a: string, b: string): number {
        let aNum = Number(a);
        let bNum = Number(b);
        aNum = isNaN(aNum) ? -1 : aNum;
        bNum = isNaN(bNum) ? -1 : bNum;
        return aNum - bNum;
    }
}