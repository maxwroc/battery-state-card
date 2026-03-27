import { log, safeGetConfigArrayOfObjects } from "./utils";
import { BatteryStateEntity } from "./custom-elements/battery-state-entity";
import { createFilter, Filter } from "./filter";
import { HomeAssistantExt } from "./type-extensions";
import { EntityDataAccessor, BATTERY_NOTES_PLATFORM } from "./entity-data-accessor";

/**
 * Properties which should be copied over to individual entities from the card
 */
const entitiesGlobalProps: (keyof IBatteryEntityConfig)[] = [
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
    "style",
    "battery_notes_dedup",
];

/**
 * Class responsible for initializing battery view models based on given configuration.
 */
export class BatteryProvider {

    /**
     * Filters for automatic adding entities.
     */
    private include: Filter[] | undefined;

    /**
     * Filters to remove entities from collection.
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
     * Entities explicitly configured by the user (protected from dedup removal).
     */
    private explicitEntities: Set<string> = new Set();

    /**
     * Whether include filters were processed already.
     */
    private initialized: boolean = false;

    constructor(private config: IBatteryStateCardConfig) {
        const filterConfig = config.filter || config.filters;
        this.include = filterConfig?.include?.map(createFilter);
        this.exclude = filterConfig?.exclude?.map(createFilter);

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

            if (this.config.unpack) {
                this.processUnpackEntities(hass);
            }

            this.processBatteryNotesDedup(hass);
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
        // assign card-level values if they were not defined on entity-level
        entitiesGlobalProps
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

            if (e.entity.startsWith("group.") || e.unpack) {
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
            this.explicitEntities.add(entityConf.entity);
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

        Object.keys(hass.states).forEach(entityId => {

            if (this.batteries[entityId]) {
                // entity is already added via explicit entities in config so we skip it
                return;
            }

            const accessor = new EntityDataAccessor(hass, entityId);

            // check if entity matches filter conditions
            if (this.include!.some(filter => filter.isValid(accessor))) {
                this.batteries[entityId] = this.createBattery({ entity: entityId });
            }
        });
    }

    /**
     * Adds batteries from group entities (if they were on the list)
     * @param hass Home Assistant instance
     */
    private processGroupEntities(hass: HomeAssistantExt): void {
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
     * Checks existing batteries for entity_id array attribute and unpacks them.
     * @param hass Home Assistant instance
     */
    private processUnpackEntities(hass: HomeAssistantExt): void {
        const toUnpack: string[] = [];

        Object.keys(this.batteries).forEach(entityId => {
            const entity = hass.states[entityId];
            if (entity && Array.isArray(entity.attributes?.entity_id)) {
                toUnpack.push(entityId);
            }
        });

        toUnpack.forEach(entityId => {
            delete this.batteries[entityId];
            const entityIds = hass.states[entityId].attributes.entity_id as string[];
            entityIds.forEach(childId => {
                if (!this.batteries[childId]) {
                    this.batteries[childId] = this.createBattery({ entity: childId });
                }
            });
        });
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
                if (filter.isValid(battery.accessor)) {
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
            isHidden ? battery.hideEntity() : battery.showEntity();
        });

        toBeRemoved.forEach(entityId => delete this.batteries[entityId]);
    }

    /**
     * Deduplicates battery_notes entities per device.
     * Prefers battery_plus (platform=battery_notes + state_class=measurement) over original battery entities.
     * Explicit entities (from config.entities) are never removed.
     */
    private processBatteryNotesDedup(hass: HomeAssistantExt): void {
        if (this.config.battery_notes_dedup === false) {
            return;
        }

        // Group battery entity IDs by device_id
        const deviceGroups: { [deviceId: string]: string[] } = {};
        const accessors: { [entityId: string]: EntityDataAccessor } = {};
        Object.keys(this.batteries).forEach(entityId => {
            const accessor = new EntityDataAccessor(hass, entityId);
            accessors[entityId] = accessor;
            const deviceId = accessor.entity?.device_id;
            if (!deviceId) return;
            if (!deviceGroups[deviceId]) deviceGroups[deviceId] = [];
            deviceGroups[deviceId].push(entityId);
        });

        const toRemove: string[] = [];

        Object.keys(deviceGroups).forEach(deviceId => {
            const entityIds = deviceGroups[deviceId];
            if (entityIds.length <= 1) return;

            // Check if any entity in this device group has device_class "battery"
            const hasBatteryEntity = entityIds.some(id =>
                accessors[id].attributes?.device_class === "battery"
            );
            if (!hasBatteryEntity) return;

            // Identify battery_plus entity: battery_notes platform + state_class measurement + device_class battery
            const batteryPlusId = entityIds.find(id => {
                const accessor = accessors[id];
                return accessor.entity?.platform === BATTERY_NOTES_PLATFORM
                    && accessor.attributes?.device_class === "battery"
                    && accessor.attributes?.state_class === "measurement";
            });

            if (batteryPlusId) {
                // Remove original (non-BN) battery entities, keep battery_plus
                entityIds.forEach(id => {
                    if (id === batteryPlusId) return;
                    if (this.explicitEntities.has(id)) return;

                    if (accessors[id].attributes?.device_class === "battery") {
                        toRemove.push(id);
                    }
                });
            }
        });

        toRemove.forEach(entityId => delete this.batteries[entityId]);
    }
}

export interface IBatteryCollection {
    [key: string]: IBatteryCollectionItem
}

export interface IBatteryCollectionItem extends BatteryStateEntity {
    entityId?: string;
}