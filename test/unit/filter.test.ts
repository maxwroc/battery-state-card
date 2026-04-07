import { createFilter } from "../../src/filter";
import { HomeAssistantMock } from "../helpers";

describe("Filter", () => {

    test("unsupported operator", () => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "90", { battery_level: "45" });

        const filter = createFilter({ name: "attributes.battery_level", operator: <any>"unsupported" });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(false);
    })

    test.each([
        [""],
        [undefined],
    ])("filter name missing", (filterName: string | undefined) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "90", { battery_level: "45" });

        const filter = createFilter({ name: <any>filterName });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(false);
    })

    test.each([
        ["45", true],
        ["90", false],
    ])("filter based on computed.state", (filterValue: string, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "90");
        const accessor = hassMock.createAccessor(entity.entity_id);
        accessor.setComputed("state", "45");

        const filter = createFilter({ name: "computed.state", value: filterValue });
        const isValid = filter.isValid(accessor);

        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        ["Bedroom motion battery level", "*_battery_level", true],
        ["Bedroom motion battery level", "/_battery_level$/", true],
        ["Bedroom motion battery level", "*_battery_*", true],
        ["Bedroom motion battery level", "*_battery_", false],
        ["Bedroom motion", "*_battery_level", false],
        ["Bedroom motion", "/BEDroom_motion/", false],
        ["Bedroom motion", "/BEDroom_motion/i", true],
        ["sensor.bot_outside_power_battery", "sensor.*bot_*battery", true],
    ])("matches func returns correct results", (entityName: string, filterValue: string, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity(entityName, "90");

        const filter = createFilter({ name: "entity_id", value: filterValue });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(filter.is_permanent).toBeTruthy();
        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        ["attributes.battery_level", { battery_level: "45" }, true, <FilterOperator>"exists"],
        ["attributes.battery_level", { battery_level: "45" }, true, undefined],
        ["attributes.battery_state", { battery_level: "45" }, false, <FilterOperator>"exists"],
        ["attributes.battery_level", { battery_level: "45" }, false, <FilterOperator>"not_exists"],
        ["attributes.battery_state", { battery_level: "45" }, true, <FilterOperator>"not_exists"],
    ])("exists/not_exists func returns correct results", (filterName: string, attribs: IMap<string>, expectedIsValid: boolean, operator: FilterOperator | undefined) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "90", attribs);

        const filter = createFilter({ name: filterName, operator });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(filter.is_permanent).toBeTruthy();
        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        ["45", <FilterOperator>"matches", "45", true],
        ["45", <FilterOperator>"matches", "55", false],
        [undefined, <FilterOperator>"matches", "55", false],
        ["45", <FilterOperator>"=", "45", true],
        ["45", <FilterOperator>"=", "45", true],
        ["string test", <FilterOperator>"=", "string", false],
        ["string test", <FilterOperator>"=", "string test", true],
        ["45", <FilterOperator>">", "44", true],
        ["45", <FilterOperator>">", "45", false],
        ["45", <FilterOperator>">=", "45", true],
        ["45", <FilterOperator>">=", "44", true],
        ["45", <FilterOperator>">=", "46", false],
        ["45", <FilterOperator>"<", "45", false],
        ["45", <FilterOperator>"<", "46", true],
        ["45", <FilterOperator>"<=", "45", true],
        ["45", <FilterOperator>"<=", "44", false],
        ["45", <FilterOperator>"<=", "46", true],
        ["some longer text", <FilterOperator>"contains", "longer", true],
        ["some longer text", <FilterOperator>"contains", "loonger", false],
        // decimals
        ["45.0", <FilterOperator>"=", "45", true],
        ["45,0", <FilterOperator>"=", "45", true],
        ["44.1", <FilterOperator>">", "44", true],
        ["44,1", <FilterOperator>">", "44", true],
        ["44", <FilterOperator>"<", "44.1", true],
        ["44", <FilterOperator>"<", "44,1", true],
    ])("matching functions return correct results", (state: string | undefined, operator: FilterOperator | undefined, value: string | number, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "ok", { battery_level: state });

        const filter = createFilter({ name: "attributes.battery_level", operator, value });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        [["office_stuff", "battery"], <FilterOperator>"contains", "office_stuff", true],
        [["office_stuff", "battery"], <FilterOperator>"contains", "office", true],
        [["office_stuff", "battery"], <FilterOperator>"contains", "kitchen", false],
        [["office_stuff", "battery"], <FilterOperator>"contains", "battery", true],
        [[], <FilterOperator>"contains", "office_stuff", false],
    ])("contains with arrays", (attributeValue: string[], operator: FilterOperator, value: string, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "ok", { labels: attributeValue });

        const filter = createFilter({ name: "attributes.labels", operator, value });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        [44, <FilterOperator>"<", "44,1", true],
        [44, <FilterOperator>">", "44.1", false],
        [true, <FilterOperator>"=", "false", false],
        [true, <FilterOperator>"=", "true", false],
        [true, <FilterOperator>"=", true, true],
        [true, undefined, true, true],
        [false, undefined, true, false],
        [true, undefined, false, false],
        [true, undefined, null, false],
        [null, undefined, null, true],
    ])("non mixed types of values", (attributeValue: FilterValueType, operator: FilterOperator | undefined, value: FilterValueType, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "ok", { entity_attrib: attributeValue });

        const filter = createFilter({ name: "attributes.entity_attrib", operator, value });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        ["path.missing", "Device name", false],
        ["device.name", "Device name", true],
        ["device.name", "Device other name", false],
        ["device.manufacturer", "Contoso", true],
    ])("filter based on nested entity data", (filterName: string, filterValue: string, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();
        const entity = hassMock.addEntity("Entity name", "45");

        hassMock.hass.entities[entity.entity_id] = <any>{ entity_id: entity.entity_id, device_id: "dev_1" };
        hassMock.hass.devices["dev_1"] = <any>{ id: "dev_1", name: "Device name", manufacturer: "Contoso" };

        const filter = createFilter({ name: filterName, value: filterValue });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        ["45", <FilterOperator>"=", "45", false],
        ["45", <FilterOperator>"=", "55", true],
    ])("not negates the underlying filter", (state: string | undefined, operator: FilterOperator | undefined, value: string | number, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "ok", { battery_level: state });

        const filter = createFilter({ not: { name: "attributes.battery_level", operator, value } });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        ["Charging", "45", true],
        ["Charging", "55", false],
        ["45", "45", false],
        ["55", "55", false],
    ])("combining filters using and", (state: string, battery_level: string, expectedIsValid: boolean ) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", state, { battery_level });

        const filter = createFilter({
            and: [
                { name: "attributes.battery_level", operator: "<", value: "50" },
                { name: "state", operator: "=", value: "Charging" },
            ]
        });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        ["Charging", "45", true],
        ["Charging", "55", true],
        ["45", "45", true],
        ["55", "55", false],
    ])("combining filters using or", (state: string, battery_level: string, expectedIsValid: boolean ) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", state, { battery_level });

        const filter = createFilter({
            or: [
                { name: "attributes.battery_level", operator: "<", value: "50" },
                { name: "state", operator: "=", value: "Charging" },
            ]
        });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        [null, "test", false],
        [undefined, "test", false],
        ["test", null, false],
        ["test", undefined, false],
    ])("contains with null/undefined values", (attributeValue: any, searchValue: any, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "ok", { test_attr: attributeValue });

        const filter = createFilter({ name: "attributes.test_attr", operator: "contains", value: searchValue });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(expectedIsValid);
    })

    test.each([
        [null, "pattern"],
        [undefined, "pattern"],
    ])("matches with null/undefined values", (attributeValue: any, pattern: string) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "ok", { test_attr: attributeValue });

        const filter = createFilter({ name: "attributes.test_attr", operator: "matches", value: pattern });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(false);
    })

    test("createFilter with invalid filter spec - null", () => {
        expect(() => createFilter(<any>null)).toThrow("Invalid filter specification");
    })

    test("createFilter with invalid filter spec - non-object", () => {
        expect(() => createFilter(<any>"invalid")).toThrow("Invalid filter specification");
    })

    test("createFilter with empty and filter array", () => {
        expect(() => createFilter({ and: [] })).toThrow("Invalid 'and' filter specification");
    })

    test("createFilter with empty or filter array", () => {
        expect(() => createFilter({ or: [] })).toThrow("Invalid 'or' filter specification");
    })

    test("createFilter with empty not filter array", () => {
        expect(() => createFilter({ not: [] })).toThrow("Invalid 'not' filter specification");
    })

    test("is_permanent is false for state filters", () => {
        const filter = createFilter({ name: "state", value: "50" });

        expect(filter.is_permanent).toBe(false);
    })

    test("is_permanent is true for non-state filters", () => {
        const filter = createFilter({ name: "entity_id", value: "sensor.battery" });

        expect(filter.is_permanent).toBe(true);
    })

    test("is_permanent is false for computed.state filters", () => {
        const filter = createFilter({ name: "computed.state", value: "50" });

        expect(filter.is_permanent).toBe(false);
    })

    test("composite filter is_permanent is false if any child is not permanent", () => {
        const filter = createFilter({
            and: [
                { name: "state", value: "50" },
                { name: "entity_id", value: "sensor.battery" }
            ]
        });

        expect(filter.is_permanent).toBe(false);
    })

    describe("relative time comparison", () => {
        test("'>' returns true when timestamp is older than duration", () => {
            const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastUpdated(oldDate);

            const filter = createFilter({ name: "last_updated", operator: ">", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(true);
        });

        test("'>' returns false when timestamp is newer than duration", () => {
            const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastUpdated(recentDate);

            const filter = createFilter({ name: "last_updated", operator: ">", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(false);
        });

        test("'<' returns true when timestamp is newer than duration", () => {
            const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastUpdated(recentDate);

            const filter = createFilter({ name: "last_updated", operator: "<", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(true);
        });

        test("'<' returns false when timestamp is older than duration", () => {
            const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastUpdated(oldDate);

            const filter = createFilter({ name: "last_updated", operator: "<", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(false);
        });

        test("works with last_changed field", () => {
            const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastChanged(oldDate);

            const filter = createFilter({ name: "last_changed", operator: ">", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(true);
        });

        test("works with days unit", () => {
            const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastUpdated(oldDate);

            const filter = createFilter({ name: "last_updated", operator: ">", value: "7d" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(true);
        });

        test("returns false for empty timestamp", () => {
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");

            const filter = createFilter({ name: "last_updated", operator: ">", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(false);
        });

        test("falls back to numeric comparison for non-time values", () => {
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90", { battery_level: "45" });

            const filter = createFilter({ name: "attributes.battery_level", operator: ">", value: "30" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(true);
        });
    })

    describe("ensureNotArray - throws for array operands", () => {
        test("= operator throws when filter value is an array", () => {
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90", { battery_level: "45" });

            const filter = createFilter({ name: "attributes.battery_level", operator: "=", value: <any>["a", "b"] });
            expect(() => filter.isValid(hassMock.createAccessor(entity.entity_id))).toThrow("does not support array values");
        });

        test("> operator throws when filter value is an array", () => {
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90", { battery_level: "45" });

            const filter = createFilter({ name: "attributes.battery_level", operator: ">", value: <any>["1", "2"] });
            expect(() => filter.isValid(hassMock.createAccessor(entity.entity_id))).toThrow("does not support array values");
        });
    })

    describe(">= and <= with relative time", () => {
        test("'>=' returns true when timestamp is exactly at or beyond duration", () => {
            const oldDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastUpdated(oldDate);

            const filter = createFilter({ name: "last_updated", operator: ">=", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(true);
        });

        test("'>=' returns false when timestamp is newer than duration", () => {
            const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastUpdated(recentDate);

            const filter = createFilter({ name: "last_updated", operator: ">=", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(false);
        });

        test("'<=' returns true when timestamp is newer than duration", () => {
            const recentDate = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastUpdated(recentDate);

            const filter = createFilter({ name: "last_updated", operator: "<=", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(true);
        });

        test("'<=' returns false when timestamp is older than duration", () => {
            const oldDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
            const hassMock = new HomeAssistantMock();
            const entity = hassMock.addEntity("Entity name", "90");
            entity.setLastUpdated(oldDate);

            const filter = createFilter({ name: "last_updated", operator: "<=", value: "24h" });
            expect(filter.isValid(hassMock.createAccessor(entity.entity_id))).toBe(false);
        });
    })

    test("template value resolved from another entity state", () => {
        const hassMock = new HomeAssistantMock();

        hassMock.addEntity("Low battery threshold", "40", {}, "input_number");
        const entity = hassMock.addEntity("Entity name", "30");

        const filter = createFilter({ name: "state", value: "{input_number.low_battery_threshold}", operator: ">" });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(false); // 30 is not > 40
    })

    test("template value resolved from another entity - entity state is greater", () => {
        const hassMock = new HomeAssistantMock();

        hassMock.addEntity("Low battery threshold", "40", {}, "input_number");
        const entity = hassMock.addEntity("Entity name", "50");

        const filter = createFilter({ name: "state", value: "{input_number.low_battery_threshold}", operator: ">" });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(true); // 50 > 40
    })

    test("template value resolved from another entity attribute", () => {
        const hassMock = new HomeAssistantMock();

        hassMock.addEntity("Threshold sensor", "on", { threshold: "25" }, "sensor");
        const entity = hassMock.addEntity("Entity name", "20");

        const filter = createFilter({ name: "state", value: "{sensor.threshold_sensor.attributes.threshold}", operator: "<" });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(true); // 20 < 25
    })

    test("template value with equality check", () => {
        const hassMock = new HomeAssistantMock();

        hassMock.addEntity("Mode selector", "eco", {}, "input_select");
        const entity = hassMock.addEntity("Entity name", "eco");

        const filter = createFilter({ name: "state", value: "{input_select.mode_selector}" });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(true);
    })

    test("template value non-matching equality", () => {
        const hassMock = new HomeAssistantMock();

        hassMock.addEntity("Mode selector", "eco", {}, "input_select");
        const entity = hassMock.addEntity("Entity name", "normal");

        const filter = createFilter({ name: "state", value: "{input_select.mode_selector}" });
        const isValid = filter.isValid(hassMock.createAccessor(entity.entity_id));

        expect(isValid).toBe(false);
    })
});
