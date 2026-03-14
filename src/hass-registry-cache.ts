import { AreaRegistryEntry, DeviceRegistryEntry, EntityRegistryDisplayEntry, HomeAssistantExt } from "./type-extensions";

export const BATTERY_NOTES_PLATFORM = "battery_notes";

/**
 * Caches Home Assistant registry data (areas, devices, entity display entries)
 * individually by their IDs, and provides extended entity data including siblings.
 */
export class HassRegistryCache {

    private displays = new Map<string, EntityRegistryDisplayEntry>();
    private devices = new Map<string, DeviceRegistryEntry>();
    private areas = new Map<string, AreaRegistryEntry>();
    private entityExtendedData = new Map<string, IEntityRegistryCache>();

    /**
     * Returns cached extended data for the given entity, resolving and caching on first call.
     * When requiredFields is specified, only the requested fields are resolved (no full cache).
     */
    getExtendedData(hass: HomeAssistantExt, entityId: string, requiredFields?: RegistryDataField[]): IEntityRegistryCache {
        let cached = this.entityExtendedData.get(entityId);
        if (cached) {
            return cached;
        }

        const resolveAll = !requiredFields;
        const needDisplay = resolveAll || requiredFields.includes("display") || requiredFields.includes("device") || requiredFields.includes("area");
        const needDevice = resolveAll || requiredFields.includes("device") || requiredFields.includes("area");
        const needArea = resolveAll || requiredFields.includes("area");
        const needSiblings = resolveAll || requiredFields.includes("siblings");

        const display = needDisplay ? this.getDisplay(hass, entityId) : undefined;
        const device = needDevice && display?.device_id ? this.getDevice(hass, display.device_id) : undefined;
        const areaId = needArea ? (display?.area_id || device?.area_id) : undefined;
        const area = areaId ? this.getArea(hass, areaId) : undefined;
        const siblings = needSiblings ? this.resolveSiblings(hass, entityId, display?.device_id) : [];

        const result: IEntityRegistryCache = { display, device, area, siblings };

        // Only cache full resolutions to avoid incomplete data in cache
        if (resolveAll) {
            this.entityExtendedData.set(entityId, result);
        }

        return result;
    }

    /**
     * Returns cached display entry for the given entity ID.
     */
    getDisplay(hass: HomeAssistantExt, entityId: string): EntityRegistryDisplayEntry | undefined {
        let entry = this.displays.get(entityId);
        if (entry) {
            return entry;
        }

        entry = hass.entities?.[entityId];
        if (entry) {
            this.displays.set(entityId, entry);
        }

        return entry;
    }

    /**
     * Returns cached device entry for the given device ID.
     */
    getDevice(hass: HomeAssistantExt, deviceId: string): DeviceRegistryEntry | undefined {
        let entry = this.devices.get(deviceId);
        if (entry) {
            return entry;
        }

        entry = hass.devices?.[deviceId];
        if (entry) {
            this.devices.set(deviceId, entry);
        }

        return entry;
    }

    /**
     * Returns cached area entry for the given area ID.
     */
    getArea(hass: HomeAssistantExt, areaId: string): AreaRegistryEntry | undefined {
        let entry = this.areas.get(areaId);
        if (entry) {
            return entry;
        }

        entry = hass.areas?.[areaId];
        if (entry) {
            this.areas.set(areaId, entry);
        }

        return entry;
    }

    private resolveSiblings(hass: HomeAssistantExt, entityId: string, deviceId?: string): ISiblingEntity[] {
        if (!deviceId || !hass.entities) {
            return [];
        }

        return Object.values(hass.entities)
            .filter(e => e.device_id === deviceId && e.entity_id !== entityId)
            .map(e => {
                const state = hass.states[e.entity_id];
                return {
                    entity_id: e.entity_id,
                    device_class: state?.attributes?.device_class,
                    state_class: state?.attributes?.state_class,
                };
            });
    }

    /**
     * Resolves battery_notes attributes from sibling entities on the same device.
     * This is NOT cached as battery_notes data can change dynamically.
     */
    resolveBatteryNotesData(hass: HomeAssistantExt, siblings: ISiblingEntity[]): IMap<any> | undefined {
        if (!siblings || siblings.length === 0) {
            return undefined;
        }

        for (const sibling of siblings) {
            const display = this.getDisplay(hass, sibling.entity_id);
            if (display?.platform !== BATTERY_NOTES_PLATFORM) {
                continue;
            }

            const state = hass.states[sibling.entity_id];
            if (!state ||
                state.attributes?.device_class !== "battery" ||
                state.attributes?.battery_quantity === undefined) {
                continue;
            }

            return state.attributes;
        }

        return undefined;
    }
}

export const hassRegistryCache = new HassRegistryCache();
