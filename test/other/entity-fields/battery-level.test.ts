import { getBatteryLevel } from "../../../src/entity-fields/battery-level";
import { HomeAssistantMock } from "../../helpers";

describe("Battery level", () => {

    test("is equal value_override setting when it is provided", () => {
        const hassMock = new HomeAssistantMock(true);
        const { state, level } = getBatteryLevel({ entity: "any", value_override: "45" }, hassMock.hass); 

        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is 'Unknown' when entity not found and no localized string", () => {
        const hassMock = new HomeAssistantMock(true);
        hassMock.hass.localize = () => <string><unknown>null;
        const { state, level } = getBatteryLevel({ entity: "any" }, hassMock.hass); 

        expect(level).toBeUndefined()
        expect(state).toBe("Unknown");
    });

    test("is 'Unknown' localized string when entity not found", () => {
        const hassMock = new HomeAssistantMock(true);
        const { state, level } = getBatteryLevel({ entity: "any" }, hassMock.hass); 

        expect(level).toBeUndefined()
        expect(state).toBe("[state.default.unknown]");
    });

    test("is taken from attribute but attribute is missing", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_state: "45" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", attribute: "battery_state_missing" }, hassMock.hass);
        
        expect(level).toBeUndefined()
        expect(state).toBe("[state.default.unknown]");
    });

    test("is taken from attribute", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_state: "45" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", attribute: "battery_state" }, hassMock.hass);
        
        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from attribute - value includes percentage", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_state: "45%" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", attribute: "battery_state" }, hassMock.hass);
        
        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from state - value includes percentage", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "45%");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from dafault locations - attribute: battery_level", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_level: "45%" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from dafault locations - attribute: battery", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery: "45%" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from dafault locations - non battery entity", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_level: "45%" });

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", non_battery_entity: true }, hassMock.hass);
        
        expect(level).toBeUndefined();
        expect(state).toBe("OK");
    });

    test("is taken from dafault locations - state", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "45");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe(45);
        expect(state).toBe("45");
    });

    test("is taken from dafault locations - numeric value cannot be found", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBeUndefined();
        expect(state).toBe("OK");
    });

    test("multiplier applied", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "0.9");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", multiplier: 100 }, hassMock.hass);
        
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

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", round }, hassMock.hass);
        
        expect(state).toBe(expectedResult);
    });

    test("first letter is capitalized", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "ok");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBeUndefined();
        expect(state).toBe("Ok");
    });

    test.each([
        ["ok", "100", 100, undefined],
        ["empty", "0", 0, undefined],
        ["20", "20", 20, undefined],
        ["charge", "Empty", 0, "Empty"],
        ["charge", "StateFromOtherEntity", 0, "{sensor.other_entity.state}"],
    ])
    ("state map applied", (entityState: string, expectedState: string, expectedLevel: number | undefined, display?: string) => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", entityState);
        hassMock.addEntity("Other entity", "StateFromOtherEntity", undefined, "sensor");

        const { state, level } = getBatteryLevel({ entity: "mocked_entity", state_map: [ { from: "ok", to: "100" }, { from: "empty", to: "0" }, { from: "charge", to: "0", display } ] }, hassMock.hass);
        
        expect(level).toBe(expectedLevel);
        expect(state).toBe(expectedState);
    });

    test.each([
        [undefined, "45", "dbm", { state: "[45]", level: 45, unit_override: String.fromCharCode(160) + "[dbm]" }], // test default when the setting is not set in the config
        [true, "45", "dbm", { state: "[45]", level: 45, unit_override: String.fromCharCode(160) + "[dbm]" }], // test when the setting is explicitly true
        [false, "45", "dbm", { state: "45", level: 45, unit_override: undefined }], // test when the setting is turned off
        [true, "45", "dbm", { state: "56", level: 56, unit_override: undefined }, [ { from: "45", to: "56" } ]], // test when the state was changed by state_map
        [true, "45", "dbm", { state: "33", level: 45, unit_override: undefined }, [ { from: "45", to: "45", display: "33" } ]], // test when the display value was changed by state_map
    ])
    ("default HA formatting ", (defaultStateFormatting: boolean | undefined, entityState: string, unitOfMeasurement: string, expected: { state: string, level: number, unit_override?: string }, stateMap: IConvert[] | undefined = undefined) => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", entityState);
        hassMock.mockFunc("formatEntityState", (entityData: any) => `[${entityData.state}] [${unitOfMeasurement}]`);

        const { state, level, unit_override } = getBatteryLevel({ entity: "mocked_entity", default_state_formatting: defaultStateFormatting, state_map: stateMap }, hassMock.hass);
        
        expect(level).toBe(expected.level);
        expect(state).toBe(expected.state);
        expect(unit_override).toBe(expected.unit_override);
    });
});