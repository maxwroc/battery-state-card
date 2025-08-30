import { getBatteryLevel } from "../../../src/entity-fields/battery-level";
import { HomeAssistantMock } from "../../helpers";

describe("Battery level", () => {

    test("is equal value_override setting when it is provided", () => {
        const hassMock = new HomeAssistantMock(true);
        const { state, level, unit } = getBatteryLevel({ entity: "any", value_override: "45" }, hassMock.hass, {});

        expect(level).toBe(45);
        expect(state).toBe("45");
        expect(unit).toBe("%");
    });

    test("doen't throw exception when attributes are not set on entity", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Mocked entity", "45", { battery_state: "45" });
        entity.setAttributes(null);

        const { state, level, unit } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(45);
        expect(state).toBe("45");
        expect(unit).toBe("%")
    });

    test("is 'Unknown' when entity not found and no localized string", () => {
        const hassMock = new HomeAssistantMock(true);
        hassMock.hass.localize = () => <string><unknown>null;
        const { state, level, unit } = getBatteryLevel({ entity: "any" }, hassMock.hass, undefined);

        expect(level).toBeUndefined();
        expect(state).toBe("Unknown");
        expect(unit).toBeUndefined();
    });

    test("is 'Unknown' localized string when entity not found", () => {
        const hassMock = new HomeAssistantMock(true);
        const { state, level, unit } = getBatteryLevel({ entity: "any" }, hassMock.hass, undefined);

        expect(level).toBeUndefined();
        expect(state).toBe("[state.default.unknown]");
        expect(unit).toBeUndefined();
    });

    test("is taken from attribute but attribute is missing", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_state: "45" });

        const { state, level, unit } = getBatteryLevel({ entity: "mocked_entity", attribute: "battery_state_missing" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBeUndefined();
        expect(state).toBe("[state.default.unknown]");
        expect(unit).toBeUndefined();
    });

    test("is taken from attribute", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_state: "45" });

        const { state, level, unit } = getBatteryLevel({ entity: "mocked_entity", attribute: "battery_state" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(45);
        expect(state).toBe("45");
        expect(unit).toBe("%");
    });

    test("is taken from attribute - value includes percentage", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_state: "45%" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", attribute: "battery_state" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from state - value includes percentage", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "45%");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from dafault locations - attribute: battery_level", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_level: "45%" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from dafault locations - attribute: battery", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery: "45%" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from dafault locations - non battery entity", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_level: "45%" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", non_battery_entity: true }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBeUndefined();
        expect(state).toBe("OK");
    });

    test("is taken from dafault locations - state", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "45");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from dafault locations - numeric value cannot be found", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBeUndefined();
        expect(state).toBe("OK");
    });

    test("multiplier applied", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "0.9");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", multiplier: 100 }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(90);
        expect(state).toBe("90");
    });

    test.each([
        ["20.458", 2, "20.46"],
        ["20.458", 0, "20"],
    ])
    ("round applied", (entityState: string, round: number, expectedResult: string) => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", entityState);

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", round }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(state).toBe(expectedResult);
    });

    test("first letter is capitalized", () => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "ok");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBeUndefined();
        expect(state).toBe("Ok");
    });

    test.each([
        ["ok", "100", 100, "%", undefined],
        ["empty", "0", 0, "%", undefined],
        ["20", "20", 20, "%", undefined],
        ["charge", "Empty", 0, undefined, "Empty"],
        ["charge", "StateFromOtherEntity", 0, undefined, "{sensor.other_entity.state}"],
    ])
    ("state map applied", (entityState: string, expectedState: string, expectedLevel: number | undefined, expectedUnit: string | undefined, display?: string) => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", entityState);
        hassMock.addEntity("Other entity", "StateFromOtherEntity", undefined, "sensor");

        const { state, level, unit } = getBatteryLevel({ entity: "mocked_entity", state_map: [ { from: "ok", to: "100" }, { from: "empty", to: "0" }, { from: "charge", to: "0", display } ] }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(expectedLevel);
        expect(state).toBe(expectedState);
        expect(unit).toBe(expectedUnit);
    });

    test.each([
        [undefined, "45", "dbm", { state: "45", level: 45, unit: "[dbm]" }], // test default when the setting is not set in the config
        [true, "45", "dbm", { state: "45", level: 45, unit: "[dbm]" }], // test when the setting is explicitly true
        [false, "45", "dbm", { state: "45", level: 45, unit: "%" }], // test when the setting is turned off
        [true, "45", "dbm", { state: "56", level: 56, unit: "%" }, [ { from: "45", to: "56" } ]], // test when the state was changed by state_map
        [true, "45", "dbm", { state: "Low", level: 45, unit: undefined }, [ { from: "45", to: "45", display: "Low" } ]], // test when the display value was changed by state_map
        [true, "45.4", "dbm", { state: "45,4", level: 45.4, unit: "[dbm]" }, undefined, ","], // test when default HA formatting returns state with comma as decimal point
    ])
    ("default HA formatting", (defaultStateFormatting: boolean | undefined, entityState: string, unitOfMeasurement: string, expected: { state: string, level: number, unit?: string }, stateMap: IConvert[] | undefined = undefined, decimalPoint: string = ".") => {

        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", entityState);
        hassMock.mockFunc("formatEntityState", (entityData: any) => `${entityData.state.replace(".", decimalPoint)} [${unitOfMeasurement}]`);

        const { state, level, unit } = getBatteryLevel({ entity: "mocked_entity", default_state_formatting: defaultStateFormatting, state_map: stateMap }, hassMock.hass, hassMock.hass.states["mocked_entity"]);

        expect(level).toBe(expected.level);
        expect(state).toBe(expected.state);
        expect(unit).toBe(expected.unit);
    });

    test.each([
        ["OK", undefined, undefined, undefined],
        ["45", undefined, undefined, "%"],
        ["45", "dBm", undefined, "dBm"],
        ["45", "dBm", "rpm", "rpm"],
    ])("unit is correct", (entityState: string, entityUnitOfMeasurement: string | undefined, configOverride: string | undefined, expectedUnit: string | undefined) => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Mocked entity", entityState, { unit_of_measurement: entityUnitOfMeasurement });

        const { unit } = getBatteryLevel({ entity: entity.entity_id, default_state_formatting: false, unit: configOverride }, hassMock.hass, hassMock.hass.states[entity.entity_id]);

        expect(unit).toBe(expectedUnit);
    })

    test.each([
        ["OK", undefined, undefined, undefined],
        ["45", undefined, undefined, "%"],
        ["45", "dBm", undefined, "dBm"],
        ["45", "dBm", "rpm", "rpm"],
    ])("unit is correct when value_override is used", (entityState: string, entityUnitOfMeasurement: string | undefined, configOverride: string | undefined, expectedUnit: string | undefined) => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Mocked entity", entityState, { unit_of_measurement: entityUnitOfMeasurement });

        const { unit } = getBatteryLevel({ entity: entity.entity_id, default_state_formatting: false, unit: configOverride, value_override: "{state}" }, hassMock.hass, hassMock.hass.states[entity.entity_id]);

        expect(unit).toBe(expectedUnit);
    })

    test.each([
        ["45", {}, "45"],
        [46, {}, "46"],
        ["ok", { battery_level: "47" }, "47"],
        ["ok", { battery_level: 48 }, "48"],
        ["ok", { battery: "49" }, "49"],
        ["ok", { battery: 50 }, "50"],
    ])("state value coming from default places", (entityState: string | number, entityAttributes: IMap<string | number>, expectedState: string) => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Mocked entity", <any>entityState, entityAttributes);

        const { state } = getBatteryLevel({ entity: entity.entity_id, default_state_formatting: false, unit: undefined}, hassMock.hass, hassMock.hass.states[entity.entity_id]);

        expect(state).toBe(expectedState);
    })

    test("number in the attribute value", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Mocked entity", "OK", { custom_attribute: 2 });

        const { state } = getBatteryLevel({ entity: entity.entity_id, attribute: "custom_attribute"}, hassMock.hass, hassMock.hass.states[entity.entity_id]);

        expect(state).toBe("2");
    })

    test.each([
        ["55 %", { state: "55", level: 55, unit: "%" }],
        ["66%", { state: "66", level: 66, unit: "%" }],
        ["-77lqi", { state: "-77", level: -77, unit: "lqi" }],
        ["-88.8lqi", { state: "-88.8", level: -88.8, unit: "lqi" }],
        ["99", { state: "99", level: 99, unit: "%" }],
    ])
    ("default HA formatting - various formatted states", (formattedResult: string, expected: { state: string, level: number, unit?: string }) => {

        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Mocked entity", "45");
        hassMock.mockFunc("formatEntityState", () => formattedResult);

        const { state, level, unit } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass, hassMock.hass.states[entity.entity_id]);

        expect(level).toBe(expected.level);
        expect(state).toBe(expected.state);
        expect(unit).toBe(expected.unit);
    });
});