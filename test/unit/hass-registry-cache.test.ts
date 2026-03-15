import { HassRegistryCache } from "../../src/hass-registry-cache";

describe("HassRegistryCache", () => {

    describe("getEntity", () => {
        test("returns undefined when entity not in hass.entities", () => {
            const cache = new HassRegistryCache();
            const hass = { entities: {} };
            const result = cache.getEntity(<any>hass, "sensor.battery");

            expect(result).toBeUndefined();
        });

        test("returns entity entry and caches it", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery" };
            const hass = {
                entities: { "sensor.battery": entityEntry }
            };

            const result1 = cache.getEntity(<any>hass, "sensor.battery");
            expect(result1).toBe(entityEntry);

            // second call should return cached value even if hass changes
            const result2 = cache.getEntity(<any>{ entities: {} }, "sensor.battery");
            expect(result2).toBe(entityEntry);
        });
    });

    describe("getDevice", () => {
        test("returns undefined when device not in hass.devices", () => {
            const cache = new HassRegistryCache();
            const result = cache.getDevice(<any>{ devices: {} }, "device1");

            expect(result).toBeUndefined();
        });

        test("returns device entry and caches it", () => {
            const cache = new HassRegistryCache();
            const deviceEntry = { id: "device1", name: "My Device" };
            const hass = { devices: { "device1": deviceEntry } };

            const result1 = cache.getDevice(<any>hass, "device1");
            expect(result1).toBe(deviceEntry);

            const result2 = cache.getDevice(<any>{ devices: {} }, "device1");
            expect(result2).toBe(deviceEntry);
        });
    });

    describe("getArea", () => {
        test("returns undefined when area not in hass.areas", () => {
            const cache = new HassRegistryCache();
            const result = cache.getArea(<any>{ areas: {} }, "area1");

            expect(result).toBeUndefined();
        });

        test("returns area entry and caches it", () => {
            const cache = new HassRegistryCache();
            const areaEntry = { area_id: "area1", name: "Living Room" };
            const hass = { areas: { "area1": areaEntry } };

            const result1 = cache.getArea(<any>hass, "area1");
            expect(result1).toBe(areaEntry);

            const result2 = cache.getArea(<any>{ areas: {} }, "area1");
            expect(result2).toBe(areaEntry);
        });
    });

    describe("getExtendedData", () => {
        test("returns empty siblings when entity has no device", () => {
            const cache = new HassRegistryCache();
            const hass = { entities: {}, states: {} };
            const result = cache.getExtendedData(<any>hass, "sensor.battery");

            expect(result.entity).toBeUndefined();
            expect(result.device).toBeUndefined();
            expect(result.area).toBeUndefined();
            expect(result.siblings).toEqual([]);
        });

        test("resolves entity, device and area", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery", device_id: "device1", area_id: "area1" };
            const deviceEntry = { id: "device1", name: "My Device" };
            const areaEntry = { area_id: "area1", name: "Living Room" };
            const hass = {
                entities: { "sensor.battery": entityEntry },
                devices: { "device1": deviceEntry },
                areas: { "area1": areaEntry },
                states: {},
            };

            const result = cache.getExtendedData(<any>hass, "sensor.battery");

            expect(result.entity).toBe(entityEntry);
            expect(result.device).toBe(deviceEntry);
            expect(result.area).toBe(areaEntry);
        });

        test("resolves area from device when not on entity entry", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery", device_id: "device1" };
            const deviceEntry = { id: "device1", name: "My Device", area_id: "area1" };
            const areaEntry = { area_id: "area1", name: "Living Room" };
            const hass = {
                entities: { "sensor.battery": entityEntry },
                devices: { "device1": deviceEntry },
                areas: { "area1": areaEntry },
                states: {},
            };

            const result = cache.getExtendedData(<any>hass, "sensor.battery");

            expect(result.area).toBe(areaEntry);
        });

        test("device is undefined when device_id is missing", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery" };
            const hass = {
                entities: { "sensor.battery": entityEntry },
                devices: { "device1": { id: "device1", name: "My Device" } },
                states: {},
            };

            const result = cache.getExtendedData(<any>hass, "sensor.battery");

            expect(result.device).toBeUndefined();
        });

        test("resolves siblings on the same device", () => {
            const cache = new HassRegistryCache();
            const hass = {
                entities: {
                    "sensor.battery": { entity_id: "sensor.battery", device_id: "device1" },
                    "sensor.enum": { entity_id: "sensor.enum", device_id: "device1" },
                    "binary_sensor.plug": { entity_id: "binary_sensor.plug", device_id: "device1" },
                    "sensor.other": { entity_id: "sensor.other", device_id: "device2" },
                },
                states: {
                    "sensor.enum": { state: "charging", attributes: { device_class: "enum" } },
                    "binary_sensor.plug": { state: "on", attributes: { device_class: "plug" } },
                },
                devices: {},
                areas: {},
            };

            const result = cache.getExtendedData(<any>hass, "sensor.battery");

            expect(result.siblings).toHaveLength(2);
            expect(result.siblings.map(s => s.entity_id)).toEqual(["sensor.enum", "binary_sensor.plug"]);
            expect(result.siblings[0].device_class).toBe("enum");
            expect(result.siblings[1].device_class).toBe("plug");
        });

        test("caches result on subsequent calls", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery" };
            const hass = {
                entities: { "sensor.battery": entityEntry },
                states: {},
            };

            const result1 = cache.getExtendedData(<any>hass, "sensor.battery");
            const result2 = cache.getExtendedData(<any>hass, "sensor.battery");

            expect(result1).toBe(result2);
        });

        test("area is undefined when hass.areas is missing", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery", area_id: "area1" };
            const hass = {
                entities: { "sensor.battery": entityEntry },
                states: {},
            };

            const result = cache.getExtendedData(<any>hass, "sensor.battery");

            expect(result.area).toBeUndefined();
        });

        test("resolves only entity when requiredFields is ['entity']", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery", device_id: "device1", area_id: "area1" };
            const hass = {
                entities: { "sensor.battery": entityEntry },
                devices: { "device1": { id: "device1", name: "My Device" } },
                areas: { "area1": { area_id: "area1", name: "Living Room" } },
                states: {},
            };

            const result = cache.getExtendedData(<any>hass, "sensor.battery", ["entity"]);

            expect(result.entity).toBe(entityEntry);
            expect(result.device).toBeUndefined();
            expect(result.area).toBeUndefined();
            expect(result.siblings).toEqual([]);
        });

        test("resolves entity and device when requiredFields is ['device']", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery", device_id: "device1" };
            const deviceEntry = { id: "device1", name: "My Device" };
            const hass = {
                entities: { "sensor.battery": entityEntry },
                devices: { "device1": deviceEntry },
                areas: { "area1": { area_id: "area1", name: "Living Room" } },
                states: {},
            };

            const result = cache.getExtendedData(<any>hass, "sensor.battery", ["device"]);

            expect(result.entity).toBe(entityEntry);
            expect(result.device).toBe(deviceEntry);
            expect(result.area).toBeUndefined();
            expect(result.siblings).toEqual([]);
        });

        test("resolves entity, device, and area when requiredFields is ['area']", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery", device_id: "device1" };
            const deviceEntry = { id: "device1", name: "My Device", area_id: "area1" };
            const areaEntry = { area_id: "area1", name: "Living Room" };
            const hass = {
                entities: { "sensor.battery": entityEntry },
                devices: { "device1": deviceEntry },
                areas: { "area1": areaEntry },
                states: {},
            };

            const result = cache.getExtendedData(<any>hass, "sensor.battery", ["area"]);

            expect(result.entity).toBe(entityEntry);
            expect(result.device).toBe(deviceEntry);
            expect(result.area).toBe(areaEntry);
            expect(result.siblings).toEqual([]);
        });

        test("partial resolution does not cache in entityExtendedData", () => {
            const cache = new HassRegistryCache();
            const entityEntry = { entity_id: "sensor.battery", name: "Battery", device_id: "device1" };
            const deviceEntry = { id: "device1", name: "My Device" };
            const hass = {
                entities: {
                    "sensor.battery": entityEntry,
                    "sensor.sibling": { entity_id: "sensor.sibling", device_id: "device1" },
                },
                devices: { "device1": deviceEntry },
                states: {
                    "sensor.sibling": { state: "on", attributes: { device_class: "enum" } },
                },
            };

            // partial call - only entity
            const partial = cache.getExtendedData(<any>hass, "sensor.battery", ["entity"]);
            expect(partial.siblings).toEqual([]);

            // full call - should resolve everything (not return stale partial)
            const full = cache.getExtendedData(<any>hass, "sensor.battery");
            expect(full.siblings).toHaveLength(1);
            expect(full.device).toBe(deviceEntry);
        });
    });

    describe("resolveBatteryNotesData", () => {
        test("returns undefined when siblings is empty", () => {
            const cache = new HassRegistryCache();
            const hass = { entities: {}, states: {} };
            const result = cache.resolveBatteryNotesData(<any>hass, []);

            expect(result).toBeUndefined();
        });

        test("returns undefined when siblings is undefined", () => {
            const cache = new HassRegistryCache();
            const hass = { entities: {}, states: {} };
            const result = cache.resolveBatteryNotesData(<any>hass, <any>undefined);

            expect(result).toBeUndefined();
        });

        test("returns attributes when battery_notes sibling found", () => {
            const cache = new HassRegistryCache();
            const batteryNotesAttrs = { device_class: "battery", battery_quantity: 2, battery_type: "CR2032" };
            const hass = {
                entities: {
                    "sensor.notes": { entity_id: "sensor.notes", platform: "battery_notes" },
                },
                states: {
                    "sensor.notes": { state: "80", attributes: batteryNotesAttrs },
                },
            };

            const siblings: ISiblingEntity[] = [
                { entity_id: "sensor.notes", device_class: "battery" },
            ];

            const result = cache.resolveBatteryNotesData(<any>hass, siblings);
            expect(result).toBe(batteryNotesAttrs);
        });

        test("returns undefined when sibling is not battery_notes platform", () => {
            const cache = new HassRegistryCache();
            const hass = {
                entities: {
                    "sensor.other": { entity_id: "sensor.other", platform: "some_other" },
                },
                states: {
                    "sensor.other": { state: "80", attributes: { device_class: "battery", battery_quantity: 1 } },
                },
            };

            const siblings: ISiblingEntity[] = [
                { entity_id: "sensor.other", device_class: "battery" },
            ];

            const result = cache.resolveBatteryNotesData(<any>hass, siblings);
            expect(result).toBeUndefined();
        });

        test("returns undefined when battery_notes entity has no state", () => {
            const cache = new HassRegistryCache();
            const hass = {
                entities: {
                    "sensor.notes": { entity_id: "sensor.notes", platform: "battery_notes" },
                },
                states: {},
            };

            const siblings: ISiblingEntity[] = [
                { entity_id: "sensor.notes", device_class: "battery" },
            ];

            const result = cache.resolveBatteryNotesData(<any>hass, siblings);
            expect(result).toBeUndefined();
        });

        test("returns undefined when battery_notes entity has wrong device_class", () => {
            const cache = new HassRegistryCache();
            const hass = {
                entities: {
                    "sensor.notes": { entity_id: "sensor.notes", platform: "battery_notes" },
                },
                states: {
                    "sensor.notes": { state: "80", attributes: { device_class: "energy", battery_quantity: 1 } },
                },
            };

            const siblings: ISiblingEntity[] = [
                { entity_id: "sensor.notes", device_class: "battery" },
            ];

            const result = cache.resolveBatteryNotesData(<any>hass, siblings);
            expect(result).toBeUndefined();
        });

        test("returns undefined when battery_notes entity has no battery_quantity", () => {
            const cache = new HassRegistryCache();
            const hass = {
                entities: {
                    "sensor.notes": { entity_id: "sensor.notes", platform: "battery_notes" },
                },
                states: {
                    "sensor.notes": { state: "80", attributes: { device_class: "battery" } },
                },
            };

            const siblings: ISiblingEntity[] = [
                { entity_id: "sensor.notes", device_class: "battery" },
            ];

            const result = cache.resolveBatteryNotesData(<any>hass, siblings);
            expect(result).toBeUndefined();
        });

        test("skips non-battery_notes siblings and finds the correct one", () => {
            const cache = new HassRegistryCache();
            const batteryNotesAttrs = { device_class: "battery", battery_quantity: 1, battery_type: "AA" };
            const hass = {
                entities: {
                    "sensor.other": { entity_id: "sensor.other", platform: "zwave" },
                    "sensor.notes": { entity_id: "sensor.notes", platform: "battery_notes" },
                },
                states: {
                    "sensor.other": { state: "on", attributes: { device_class: "plug" } },
                    "sensor.notes": { state: "80", attributes: batteryNotesAttrs },
                },
            };

            const siblings: ISiblingEntity[] = [
                { entity_id: "sensor.other", device_class: "plug" },
                { entity_id: "sensor.notes", device_class: "battery" },
            ];

            const result = cache.resolveBatteryNotesData(<any>hass, siblings);
            expect(result).toBe(batteryNotesAttrs);
        });
    });
});
