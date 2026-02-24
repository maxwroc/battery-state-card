import { extendEntityData, getValueFromObject, safeGetArray, safeGetConfigArrayOfObjects, isNumber, toNumber } from "../../src/utils";

describe("Utils", () => {

    describe("extendEntityData", () => {
        test("returns entityData when hass is null", () => {
            const entityData = { state: "50" };
            const result = extendEntityData(<any>null, "sensor.battery", entityData);

            expect(result).toBe(entityData);
        });

        test("returns entityData when hass is undefined", () => {
            const entityData = { state: "50" };
            const result = extendEntityData(<any>undefined, "sensor.battery", entityData);

            expect(result).toBe(entityData);
        });

        test("returns entityData when entity not in hass.entities", () => {
            const hass = {
                entities: {}
            };
            const entityData = { state: "50" };
            const result = extendEntityData(<any>hass, "sensor.battery", entityData);

            expect(result).toBe(entityData);
            expect(result.display).toBeUndefined();
        });

        test("adds display when entity exists in hass.entities", () => {
            const displayEntry = { entity_id: "sensor.battery", name: "Battery" };
            const hass = {
                entities: {
                    "sensor.battery": displayEntry
                }
            };
            const entityData = { state: "50" };
            const result = extendEntityData(<any>hass, "sensor.battery", entityData);

            expect(result.display).toBe(displayEntry);
        });

        test("adds device when device_id exists", () => {
            const deviceEntry = { id: "device1", name: "My Device" };
            const displayEntry = { entity_id: "sensor.battery", name: "Battery", device_id: "device1" };
            const hass = {
                entities: {
                    "sensor.battery": displayEntry
                },
                devices: {
                    "device1": deviceEntry
                }
            };
            const entityData = { state: "50" };
            const result = extendEntityData(<any>hass, "sensor.battery", entityData);

            expect(result.device).toBe(deviceEntry);
        });

        test("device is undefined when device_id is missing", () => {
            const displayEntry = { entity_id: "sensor.battery", name: "Battery" };
            const hass = {
                entities: {
                    "sensor.battery": displayEntry
                },
                devices: {
                    "device1": { id: "device1", name: "My Device" }
                }
            };
            const entityData = { state: "50" };
            const result = extendEntityData(<any>hass, "sensor.battery", entityData);

            expect(result.device).toBeUndefined();
        });

        test("device is undefined when hass.devices is missing", () => {
            const displayEntry = { entity_id: "sensor.battery", name: "Battery", device_id: "device1" };
            const hass = {
                entities: {
                    "sensor.battery": displayEntry
                }
            };
            const entityData = { state: "50" };
            const result = extendEntityData(<any>hass, "sensor.battery", entityData);

            expect(result.device).toBeUndefined();
        });

        test("adds area when area_id exists in display entry", () => {
            const areaEntry = { area_id: "area1", name: "Living Room" };
            const displayEntry = { entity_id: "sensor.battery", name: "Battery", area_id: "area1" };
            const hass = {
                entities: {
                    "sensor.battery": displayEntry
                },
                areas: {
                    "area1": areaEntry
                }
            };
            const entityData = { state: "50" };
            const result = extendEntityData(<any>hass, "sensor.battery", entityData);

            expect(result.area).toBe(areaEntry);
        });

        test("adds area when area_id exists in device", () => {
            const areaEntry = { area_id: "area1", name: "Living Room" };
            const deviceEntry = { id: "device1", name: "My Device", area_id: "area1" };
            const displayEntry = { entity_id: "sensor.battery", name: "Battery", device_id: "device1" };
            const hass = {
                entities: {
                    "sensor.battery": displayEntry
                },
                devices: {
                    "device1": deviceEntry
                },
                areas: {
                    "area1": areaEntry
                }
            };
            const entityData = { state: "50" };
            const result = extendEntityData(<any>hass, "sensor.battery", entityData);

            expect(result.area).toBe(areaEntry);
        });

        test("area is undefined when hass.areas is missing", () => {
            const displayEntry = { entity_id: "sensor.battery", name: "Battery", area_id: "area1" };
            const hass = {
                entities: {
                    "sensor.battery": displayEntry
                }
            };
            const entityData = { state: "50" };
            const result = extendEntityData(<any>hass, "sensor.battery", entityData);

            expect(result.area).toBeUndefined();
        });
    });

    describe("getValueFromObject", () => {
        test("returns value for nested path", () => {
            const obj = {
                device: {
                    manufacturer: {
                        name: "Contoso"
                    }
                }
            };
            const result = getValueFromObject(obj, "device.manufacturer.name");

            expect(result).toBe("Contoso");
        });

        test("returns undefined for missing path", () => {
            const obj = { device: { name: "Device" } };
            const result = getValueFromObject(obj, "device.missing.path");

            expect(result).toBeUndefined();
        });

        test("returns JSON string for object values", () => {
            const obj = {
                device: {
                    info: {
                        firmware: "1.0",
                        model: "X100"
                    }
                }
            };
            const result = getValueFromObject(obj, "device.info");

            expect(result).toBe('{"firmware":"1.0","model":"X100"}');
        });
    });

    describe("safeGetArray", () => {
        test("returns array when given array", () => {
            const result = safeGetArray(["a", "b", "c"]);

            expect(result).toEqual(["a", "b", "c"]);
        });

        test("returns single element array when given string", () => {
            const result = safeGetArray("test");

            expect(result).toEqual(["test"]);
        });

        test("returns empty array when given undefined", () => {
            const result = safeGetArray(undefined);

            expect(result).toEqual([]);
        });
    });

    describe("safeGetConfigArrayOfObjects", () => {
        test("converts string array to object array", () => {
            const result = safeGetConfigArrayOfObjects(<any>["name", "state"], "by");

            expect(result).toEqual([{ by: "name" }, { by: "state" }]);
        });

        test("converts single string to object array", () => {
            const result = safeGetConfigArrayOfObjects(<any>"name", "by");

            expect(result).toEqual([{ by: "name" }]);
        });

        test("returns copy of object array", () => {
            const input = [{ by: "name", desc: true }];
            const result = safeGetConfigArrayOfObjects(input, "by");

            expect(result).toEqual(input);
            expect(result).not.toBe(input);
            expect(result[0]).not.toBe(input[0]);
        });
    });

    describe("isNumber", () => {
        test.each([
            ["123", true],
            ["45.5", true],
            ["45,5", true],
            ["", false],
            [undefined, false],
            [null, false],
            [true, false],
            [false, false],
            ["abc", false],
            [123, true],
            [45.5, true],
        ])("isNumber(%p) returns %p", (value: any, expected: boolean) => {
            expect(isNumber(value)).toBe(expected);
        });
    });

    describe("toNumber", () => {
        test.each([
            ["123", 123],
            ["45.5", 45.5],
            ["45,5", 45.5],
            [123, 123],
            [45.5, 45.5],
        ])("toNumber(%p) returns %p", (value: any, expected: number) => {
            expect(toNumber(value)).toBe(expected);
        });
    });
});
