import BatteryViewModel from "./battery-vm";
import { IBatteryStateCardConfig, IFilter, FilterOperator, IBatteryEntity, IHomeAssistantGroupProps, IBatteriesResultViewData, IGroupDataMap } from "./types";
import { HassEntity, HomeAssistant } from "./ha-types";
import { log, safeGetConfigObject } from "./utils";
import { ActionFactory } from "./action";
import { getBatteryCollections } from "./grouping";

/**
 * Properties which should be copied over to individual entities from the card
 */
const entititesGlobalProps = [ "tap_action", "state_map", "charging_state", "secondary_info", "color_thresholds", "color_gradient", "bulk_rename" ];

/**
 * Functions to check if filter condition is met
 */
const operatorHandlers: { [key in FilterOperator]: (val: string | number | undefined, expectedVal: string | number) => boolean } = {
    "exists": val => val !== undefined,
    "contains": (val, searchString) => val !== undefined && val.toString().indexOf(searchString.toString()) != -1,
    "=": (val, expectedVal) => val == expectedVal,
    ">": (val, expectedVal) => Number(val) > expectedVal,
    "<": (val, expectedVal) => Number(val) < expectedVal,
    ">=": (val, expectedVal) => Number(val) >= expectedVal,
    "<=": (val, expectedVal) => Number(val) <= expectedVal,
    "matches": (val, pattern) => {
        if (val === undefined) {
            return false;
        }

        pattern = pattern.toString();

        let exp: RegExp | undefined;
        if (pattern[0] == "/" && pattern[pattern.length - 1] == "/") {
            // create regexp after removing slashes
            exp = new RegExp(pattern.substr(1, pattern.length - 2));
        } else if (pattern.indexOf("*") != -1) {
            exp = new RegExp("^" + pattern.replace(/\*/g, ".*") + "$");
        }

        return exp ? exp.test(val.toString()) : val === pattern;
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
    private meetsExpectations(val: string | number | undefined): boolean {

        let operator = this.config.operator;
        if (!operator) {
            if (this.config.value === undefined) {
                operator = "exists";
            }
            else {
                const expectedVal = this.config.value.toString();
                operator = expectedVal.indexOf("*") != -1 || (expectedVal[0] == "/" && expectedVal[expectedVal.length - 1] == "/") ?
                    "matches" :
                    "=";
            }
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
     * Groups to be resolved on HA state update.
     */
    private groupsToResolve: string[] = [];

    /**
     * Collection of groups and their properties taken from HA
     */
    private groupsData: IGroupDataMap = {};

    /**
     * Whether include filters were processed already.
     */
    private initialized: boolean = false;

    constructor(private config: IBatteryStateCardConfig, private cardNode: Node) {
        this.include = config.filter?.include?.map(f => new Filter(f));
        this.exclude = config.filter?.exclude?.map(f => new Filter(f));

        if (!this.include) {
            this.initialized = false;
        }

        this.processExplicitEntities();
    }

    update(hass: HomeAssistant): boolean {
        let updated = false;
        if (!this.initialized) {
            // groups and includes should be processed just once
            this.initialized = true;

            updated = this.processGroups(hass) || updated;

            updated = this.processIncludes(hass) || updated;
        }

        updated = this.updateBatteries(hass) || updated;

        if (updated) {
            this.processExcludes(hass);
        }

        return updated;
    }

    /**
     * Return batteries
     * @param hass Home Assistant instance
     */
    getBatteries(): IBatteriesResultViewData {
        return getBatteryCollections(this.config.collapse, this.batteries, this.groupsData);
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
                card: this.cardNode,
                config: safeGetConfigObject(entity.tap_action || this.config.tap_action || <any>null, "action"),
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
            : (this.config.entities || []).map((entity: string | IBatteryEntity) => {
                // check if it is just the id string
                if (typeof (entity) === "string") {
                    entity = <IBatteryEntity>{ entity: entity };
                }

                return entity;
            });

        // remove groups to add them later
        entities = entities.filter(e => {
            if (!e.entity) {
                throw new Error("Invalid configuration - missing property 'entity' on:\n" + JSON.stringify(e));
            }

            if (e.entity.startsWith("group.")) {
                this.groupsToResolve.push(e.entity);
                return false;
            }

            return true;
        });

        // processing groups and entities from collapse property
        // this way user doesn't need to put same IDs twice in the configuration
        if (this.config.collapse && Array.isArray(this.config.collapse)) {
            this.config.collapse.forEach(group => {
                if (group.group_id) {
                    // check if it's not there already
                    if (this.groupsToResolve.indexOf(group.group_id) == -1) {
                        this.groupsToResolve.push(group.group_id);
                    }
                }
                else if (group.entities) {
                    group.entities.forEach(entity_id => {
                        // check if it's not there already
                        if (!entities.some(e => e.entity == entity_id)) {
                            entities.push({ entity: entity_id });
                        }
                    });
                }
            });
        }

        this.batteries = entities.map(entity => this.createBattery(entity));
    }

    /**
     * Adds batteries based on filter.include config.
     * @param hass Home Assistant instance
     */
    private processIncludes(hass: HomeAssistant): boolean {

        let updated = false;
        if (!this.include) {
            return updated;
        }

        Object.keys(hass.states).forEach(entity_id => {
            // check if entity matches filter conditions
            if (this.include?.some(filter => filter.isValid(hass.states[entity_id])) &&
                // check if battery is not added already (via explicit entities)
                !this.batteries.some(b => b.entity_id == entity_id)) {

                updated = true;
                this.batteries.push(this.createBattery({ entity: entity_id }));
            }
        });

        return updated;
    }

    /**
     * Adds batteries from group entities (if they were on the list)
     * @param hass Home Assistant instance
     */
    private processGroups(hass: HomeAssistant): boolean {

        let updated = false;

        this.groupsToResolve.forEach(group_id => {
            const groupEntity = hass.states[group_id];
            if (!groupEntity) {
                log(`Group "${group_id}" not found`);
                return;
            }

            const groupData = groupEntity.attributes as IHomeAssistantGroupProps;
            if (!Array.isArray(groupData.entity_id)) {
                log(`Entities not found in "${group_id}"`);
                return;
            }

            groupData.entity_id.forEach(entity_id => {
                // check if battery is on the list already
                if (this.batteries.some(b => b.entity_id == entity_id)) {
                    return;
                }

                updated = true;
                this.batteries.push(this.createBattery({ entity: entity_id }));
            });

            this.groupsData[group_id] = groupData;
        });

        this.groupsToResolve = [];

        return updated;
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

        // we need to reverse otherwise the indexes will be messed up after removing
        toBeRemoved.reverse().forEach(i => this.batteries.splice(i, 1));
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