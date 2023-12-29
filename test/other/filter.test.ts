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
        ["45", <FilterOperator>"=", "55", false],
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
    ])("matching functions return correct results", (state: string | undefined, operator: FilterOperator | undefined, value: string | number, expectedIsVlid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity("Entity name", "ok", { battery_level: state });

        const filter = new Filter({ name: "attributes.battery_level", operator, value });
        const isValid = filter.isValid(entity);

        expect(isValid).toBe(expectedIsVlid);
    })
});