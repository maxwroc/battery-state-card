import { log, safeGetConfigArrayOfObjects } from "./utils";
import { HomeAssistant } from "custom-card-helpers";
import { BatteryStateEntity } from "./custom-elements/battery-state-entity";

/**
 * Properties which should be copied over to individual entities from the card
 */
const entititesGlobalProps: (keyof IBatteryEntityConfig)[] = [ "tap_action", "state_map", "charging_state", "secondary_info", "colors", "bulk_rename", "icon", "round", "unit" ];

const regExpPattern = /\/([^/]+)\/([igmsuy]*)/;

/**
 * Functions to check if filter condition is met
 */
const operatorHandlers: { [key in FilterOperator]: (val: string | number | undefined, expectedVal: string | number) => boolean } = {
    "exists": val => val !== undefined,
    "contains": (val, searchString) => val !== undefined && val.toString().indexOf(searchString.toString()) != -1,
    "=": (val, expectedVal) => val == expectedVal,
    ">": (val, expectedVal) => Number(val) > Number(expectedVal),
    "<": (val, expectedVal) => Number(val) < Number(expectedVal),
    ">=": (val, expectedVal) => Number(val) >= Number(expectedVal),
    "<=": (val, expectedVal) => Number(val) <= Number(expectedVal),
    "matches": (val, pattern) => {
        if (val === undefined) {
            return false;
        }

        pattern = pattern.toString();

        let exp: RegExp | undefined;
        const regexpMatch = pattern.match(regExpPattern);
        if (regexpMatch) {
            // create regexp after removing slashes
            exp = new RegExp(regexpMatch[1], regexpMatch[2]);
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
    isValid(entity: any, state?: string): boolean {
        const val = this.getValue(entity, state);
        return this.meetsExpectations(val);
    }

    /**
     * Gets the value to validate.
     * @param entity Hass entity
     * @param state State override - battery state/level
     */
    private getValue(entity: any, state?: string): string | undefined {
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

    private batteries: IBatteryCollection = {};

    /**
     * Groups to be resolved on HA state update.
     */
    private groupsToResolve: string[] = [];

    /**
     * Collection of groups and their properties taken from HA
     */
    public groupsData: IGroupDataMap = {};

    /**
     * Whether include filters were processed already.
     */
    private initialized: boolean = false;

    constructor(private config: IBatteryCardConfig) {
        this.include = config.filter?.include?.map(f => new Filter(f));
        this.exclude = config.filter?.exclude?.map(f => new Filter(f));

        if (!this.include) {
            this.initialized = false;
        }

        this.processExplicitEntities();
    }

    async update(hass: HomeAssistant): Promise<void> {
        if (!this.initialized) {
            // groups and includes should be processed just once
            this.initialized = true;
            this.processGroupEntities(hass);
            this.processIncludes(hass);
        }

        this.processExcludes(hass);

        const updateComplete = Object.keys(this.batteries).map(id => {
            const battery = this.batteries[id];
            battery.hass = hass;
            return battery.cardUpdated;
        });

        await Promise.all(updateComplete);
    }

    /**
     * Return batteries
     * @param hass Home Assistant instance
     */
    getBatteries(): IBatteryCollection {
        return this.batteries;
    }

    /**
     * Creates and returns new Battery View Model
     */
    private createBattery(entityConfig: IBatteryEntityConfig): IBatteryCollectionItem {
        // assing card-level values if they were not defined on entity-level
        entititesGlobalProps
            .filter(p => (<any>entityConfig)[p] == undefined)
            .forEach(p => (<any>entityConfig)[p] = (<any>this.config)[p]);

        const battery = <IBatteryCollectionItem>new BatteryStateEntity();
        battery.entityId = entityConfig.entity
        battery.setConfig(entityConfig);

        return battery;
    }

    /**
     * Adds batteries based on entities from config.
     */
    private processExplicitEntities() {
        let entities = safeGetConfigArrayOfObjects(this.config.entities, "entity");

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

        entities.forEach(entityConf => {
            this.batteries[entityConf.entity] = this.createBattery(entityConf);
        });
    }

    /**
     * Adds batteries based on filter.include config.
     * @param hass Home Assistant instance
     */
    private processIncludes(hass: HomeAssistant): void {
        if (!this.include) {
            return;
        }

        Object.keys(hass.states).forEach(entityId => {
            // check if entity matches filter conditions
            if (this.include?.some(filter => filter.isValid(hass.states[entityId])) &&
                // check if battery is not added already (via explicit entities)
                !this.batteries[entityId]) {

                this.batteries[entityId] = this.createBattery({ entity: entityId });
            }
        });
    }

    /**
     * Adds batteries from group entities (if they were on the list)
     * @param hass Home Assistant instance
     */
    private processGroupEntities(hass: HomeAssistant): void {
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
                if (this.batteries[entity_id]) {
                    return;
                }
                
                this.batteries[entity_id] = this.createBattery({ entity: entity_id });
            });

            this.groupsData[group_id] = groupData;
        });

        this.groupsToResolve = [];
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
        const toBeRemoved: string[] = [];



        Object.keys(this.batteries).forEach((entityId) => {
            const battery = this.batteries[entityId];
            let isHidden = false;
            for (let filter of filters) {
                const entityState = hass.states[entityId];
                // we want to show batteries for which entities are missing in HA
                if (entityState !== undefined && filter.isValid(entityState, battery.state)) {
                    if (filter.is_permanent) {
                        // permanent filters have conditions based on static values so we can safely
                        // remove such battery to avoid updating them unnecessarily
                        toBeRemoved.push(entityId);
                        // no need to process further
                        break;
                    }
                    else {
                        isHidden = true;
                    }
                }
            }

            // we keep the view model to keep updating it
            // it might be shown/not-hidden next time
            battery.isHidden = isHidden;
        });

        toBeRemoved.forEach(entityId => delete this.batteries[entityId]);
    }
}

export interface IBatteryCollection {
    [key: string]: IBatteryCollectionItem
}

export interface IBatteryCollectionItem extends BatteryStateEntity {
    entityId?: string;
    isHidden?: boolean;
}