import { Filter } from "../../src/filter";
import { HomeAssistantMock } from "../helpers";

describe("Filter", () => {

    test("unsupported operator", () => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "90", { battery_level: "45" });

        const filter = new Filter({ name: "attributes.battery_level", operator: <any>"unsupported" });
        const isValid = filter.isValid(entity);

        expect(isValid).toBe(false);
    })

    test.each([
        [""],
        [undefined],
    ])("filter name missing", (filterName: string | undefined) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "90", { battery_level: "45" });

        const filter = new Filter({ name: <any>filterName });
        const isValid = filter.isValid(entity);

        expect(isValid).toBe(false);
    })

    test.each([
        ["45", true],
        ["90", false],
    ])("filter based on state - state coming from custom source", (filterValue: string, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "90");

        const filter = new Filter({ name: "state", value: filterValue });
        const isValid = filter.isValid(entity, "45");

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
    ])("matches func returns correct results", (entityName: string, filterValue: string, expectedIsVlid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity(entityName, "90");

        const filter = new Filter({ name: "entity_id", value: filterValue });
        const isValid = filter.isValid(entity);

        expect(filter.is_permanent).toBeTruthy();
        expect(isValid).toBe(expectedIsVlid);
    })

    test.each([
        ["attributes.battery_level", { battery_level: "45" }, true, <FilterOperator>"exists"],
        ["attributes.battery_level", { battery_level: "45" }, true, undefined],
        ["attributes.battery_state", { battery_level: "45" }, false, <FilterOperator>"exists"],
        ["attributes.battery_level", { battery_level: "45" }, false, <FilterOperator>"not_exists"],
        ["attributes.battery_state", { battery_level: "45" }, true, <FilterOperator>"not_exists"],
    ])("exists/not_exists func returns correct results", (fileterName: string, attribs: IMap<string>, expectedIsVlid: boolean, operator: FilterOperator | undefined) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "90", attribs);

        const filter = new Filter({ name: fileterName, operator });
        const isValid = filter.isValid(entity);

        expect(filter.is_permanent).toBeTruthy();
        expect(isValid).toBe(expectedIsVlid);
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
    ])("matching functions return correct results", (state: string | undefined, operator: FilterOperator | undefined, value: string | number, expectedIsVlid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "ok", { battery_level: state });

        const filter = new Filter({ name: "attributes.battery_level", operator, value });
        const isValid = filter.isValid(entity);

        expect(isValid).toBe(expectedIsVlid);
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
    ])("non mixed types of values", (attributeValue: FilterValueType, operator: FilterOperator | undefined, value: FilterValueType, expectedIsVlid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "ok", { entity_attrib: attributeValue });

        const filter = new Filter({ name: "attributes.entity_attrib", operator, value });
        const isValid = filter.isValid(entity);

        expect(isValid).toBe(expectedIsVlid);
    })

    test.each([
        [{ state: "45", device: { name: "Device name" } }, "path.missing", "Device name", false],
        [{ state: "45", device: { name: "Device name" } }, "device.name", "Device name", true],
        [{ state: "45", device: { name: "Device name" } }, "device.name", "Device other name", false],
        [{ state: "45", device: { name: "Device name", manufacturer: { name: "Contoso" } } }, "device.manufacturer", "Contoso", false],
        [{ state: "45", device: { name: "Device name", manufacturer: { name: "Contoso" } } }, "device.manufacturer.name", "Contoso", true],
    ])("filter based on nested entity data", (entityData: any, filterName: string, filterValue: string, expectedIsValid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const filter = new Filter({ name: filterName, value: filterValue });
        const isValid = filter.isValid(entityData, "45");

        expect(isValid).toBe(expectedIsValid);
    })
});