import { HomeAssistantExt, EntityRegistryEntry } from "./type-extensions";
import { getValueFromObject } from "./utils";

export const BATTERY_NOTES_PLATFORM = "battery_notes";

const validEntityDomains = [
    "automation",
    "binary_sensor",
    "button",
    "calendar",
    "camera",
    "climate",
    "device_tracker",
    "group",
    "input_boolean",
    "input_datetime",
    "input_number",
    "input_select",
    "input_text",
    "light",
    "media_player",
    "number",
    "person",
    "remote",
    "scene",
    "script",
    "select",
    "sensor",
    "switch",
    "update",
    "weather",
    "zone",
];

/**
 * Lazy-resolving data accessor for entity data.
 * Single source of truth for filters, rendering, and debug output.
 *
 * Resolution paths:
 * - <domain>.<id>.* → hass.states[domain.id] (cross-entity lookup)
 * - entity.*    → hass.entities[entityId]
 * - device.*    → hass.devices[deviceId]
 * - area.*      → hass.areas[areaId] (chain: entity → device → area)
 * - computed.*  → computed data store (state, charging, battery_notes)
 * - *           → hass.states[entityId] (fallback: attributes, state, etc.)
 */
export class EntityDataAccessor {

    private _computed: IMap<any> = {};

    constructor(
        private hass: HomeAssistantExt,
        private entityId: string,
    ) {}

    /** HA state object for this entity */
    get state() { return this.hass.states[this.entityId]; }

    /** State attributes shortcut */
    get attributes() { return this.state?.attributes; }

    /** Entity registry entry */
    get entity(): EntityRegistryEntry | undefined { return this.hass.entities?.[this.entityId]; }

    /** Device registry entry (resolved via entity.device_id) */
    get device() {
        return this.entity?.device_id
            ? this.hass.devices?.[this.entity.device_id]
            : undefined;
    }

    /** Area registry entry (resolved via entity.area_id or device.area_id) */
    get area() {
        const id = this.entity?.area_id || this.device?.area_id;
        return id ? this.hass.areas?.[id] : undefined;
    }

    /** Computed/derived data (state, charging, battery_notes) */
    get computed(): IMap<any> { return this._computed; }

    /** Store computed/derived data under the "computed" namespace */
    setComputed(key: string, value: any): void {
        this._computed[key] = value;
    }

    /** Resolve a dotted path to its value from the right source */
    resolve(path: string): any {
        // Cross-entity lookup (e.g., sensor.some_entity.attributes.brightness)
        const chunks = path.split(".");
        if (validEntityDomains.includes(chunks[0])) {
            const otherEntityId = chunks[0] + "." + chunks[1];
            const stateObj = this.hass.states[otherEntityId];
            if (!stateObj) {
                return undefined;
            }
            const remainingPath = chunks.slice(2).join(".");
            // When no sub-path is given (e.g. "input_number.threshold"), return
            // the entity's state value rather than the full state object.
            return remainingPath
                ? getValueFromObject(stateObj, remainingPath)
                : stateObj.state;
        }

        if (path.startsWith("entity.")) {
            return this.entity ? getValueFromObject(this.entity, path.substring(7)) : undefined;
        }
        if (path.startsWith("device.")) {
            return this.device ? getValueFromObject(this.device, path.substring(7)) : undefined;
        }
        if (path.startsWith("area.")) {
            return this.area ? getValueFromObject(this.area, path.substring(5)) : undefined;
        }
        if (path.startsWith("computed.")) {
            return getValueFromObject(this._computed, path.substring(9));
        }
        // Fall back to hass state, then computed data
        if (this.state) {
            const stateResult = getValueFromObject(this.state, path);
            if (stateResult !== undefined) {
                return stateResult;
            }
        }
        return getValueFromObject(this._computed, path);
    }

    /** Serialize all data for debug output */
    toDebugJSON(): string {
        return JSON.stringify({
            ...this.state,
            entity: this.entity,
            device: this.device,
            area: this.area,
            computed: this._computed,
        }, null, 2);
    }
}

/**
 * Resolves sibling entities on the same device.
 */
export function resolveSiblings(hass: HomeAssistantExt, entityId: string, deviceId?: string): ISiblingEntity[] {
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


