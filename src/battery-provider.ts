import { extendEntityData, log, safeGetConfigArrayOfObjects } from "./utils";
import { HomeAssistant } from "custom-card-helpers";
import { BatteryStateEntity } from "./custom-elements/battery-state-entity";
import { createFilter, Filter } from "./filter";
import { HomeAssistantExt } from "./type-extensions";

/**
 * Properties which should be copied over to individual entities from the card
 */
const entititesGlobalProps: (keyof IBatteryEntityConfig)[] = [
    "bulk_rename",
    "charging_state",
    "colors",
    "debug",
    "default_state_formatting",
    "extend_entity_data",
    "icon",
    "non_battery_entity",
    "respect_visibility_setting",
    "round",
    "secondary_info",
    "state_map",
    "tap_action",
    "value_override",
    "unit",
];

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
     * Collection of battery HTML elements.
     */
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
        this.include = config.filter?.include?.map(createFilter);
        this.exclude = config.filter?.exclude?.map(createFilter);

        if (!this.include) {
            this.initialized = false;
        }

        this.processExplicitEntities();
    }

    async update(hass: HomeAssistantExt): Promise<void> {
        if (!this.initialized) {
            // groups and includes should be processed just once
            this.initialized = true;
            this.processGroupEntities(hass);
            this.processIncludes(hass);
        }

        const updateComplete = Object.keys(this.batteries).map(id => {
            const battery = this.batteries[id];
            battery.hass = hass;
            return battery.cardUpdated;
        });

        await Promise.all(updateComplete);

        this.processExcludes();
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
    private processIncludes(hass: HomeAssistantExt): void {
        if (!this.include || !Array.isArray(this.include) || this.include.length == 0) {
            return;
        }

        const advancedInclude = this.include.some(filter => filter.is_advanced);

        Object.keys(hass.states).forEach(entityId => {

            if (this.batteries[entityId]) {
                // entity is already added via explicit entities in config so we skip it
                return;
            }

            let entityData = <IMap<any>>{};
            if (advancedInclude) {
                entityData = extendEntityData(hass, entityId, { ...hass.states[entityId] });
            }

            // check if entity matches filter conditions
            if (this.include!.some(filter => filter.isValid(advancedInclude ? entityData : hass.states[entityId]))) {
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
     */
    private processExcludes() {
        if (this.exclude == undefined) {
            return;
        }

        const filters = this.exclude;
        const toBeRemoved: string[] = [];

        Object.keys(this.batteries).forEach((entityId) => {
            const battery = this.batteries[entityId];
            let isHidden = false;
            for (let filter of filters) {
                // we want to show batteries for which entities are missing in HA
                if (filter.isValid(battery.entityData, battery.state)) {
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
            // it might be shown/not-hidden after next update
            isHidden? battery.hideEntity() : battery.showEntity();
        });

        toBeRemoved.forEach(entityId => delete this.batteries[entityId]);
    }
}

export interface IBatteryCollection {
    [key: string]: IBatteryCollectionItem
}

export interface IBatteryCollectionItem extends BatteryStateEntity {
    entityId?: string;
}