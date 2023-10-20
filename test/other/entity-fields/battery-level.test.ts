import { getBatteryLevel } from "../../../src/entity-fields/battery-level";
import { HomeAssistantMock } from "../../helpers";

describe("Battery level", () => {

    test("is equal value_override setting when it is provided", () => {
        const hassMock = new HomeAssistantMock(true);
        const level = getBatteryLevel({ entity: "any", value_override: "45" }, hassMock.hass); 

        expect(level).toBe("45");
    });

    test("is 'Unknown' when entity not found and no localized string", () => {
        const hassMock = new HomeAssistantMock(true);
        hassMock.hass.localize = () => <string><unknown>null;
        const level = getBatteryLevel({ entity: "any" }, hassMock.hass); 

        expect(level).toBe("Unknown");
    });

    test("is 'Unknown' localized string when entity not found", () => {
        const hassMock = new HomeAssistantMock(true);
        const level = getBatteryLevel({ entity: "any" }, hassMock.hass); 

        expect(level).toBe("[state.default.unknown]");
    });

    test("is taken from attribute but attribute is missing", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_state: "45" });

        const level = getBatteryLevel({ entity: "mocked_entity", attribute: "battery_state_missing" }, hassMock.hass);
        
        expect(level).toBe("[state.default.unknown]");
    });

    test("is taken from attribute", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_state: "45" });

        const level = getBatteryLevel({ entity: "mocked_entity", attribute: "battery_state" }, hassMock.hass);
        
        expect(level).toBe("45");
    });

    test("is taken from attribute - value includes percentage", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_state: "45%" });

        const level = getBatteryLevel({ entity: "mocked_entity", attribute: "battery_state" }, hassMock.hass);
        
        expect(level).toBe("45");
    });

    test("is taken from state - value includes percentage", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "45%");

        const level = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe("45");
    });

    test("is taken from dafault locations - attribute: battery_level", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery_level: "45%" });

        const level = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe("45");
    });

    test("is taken from dafault locations - attribute: battery", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK", { battery: "45%" });

        const level = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe("45");
    });

    test("is taken from dafault locations - state", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "45");

        const level = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe("45");
    });

    test("is taken from dafault locations - numeric value cannot be found", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "OK");

        const level = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe("OK");
    });

    test("multiplier applied", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "0.9");

        const level = getBatteryLevel({ entity: "mocked_entity", multiplier: 100 }, hassMock.hass);
        
        expect(level).toBe("90");
    });

    test.each([
        ["20.458", 2, "20.46"],
        ["20.458", 0, "20"],
    ])
    ("round applied", (entityState: string, round: number, expectedResult: string) => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", entityState);

        const level = getBatteryLevel({ entity: "mocked_entity", round }, hassMock.hass);
        
        expect(level).toBe(expectedResult);
    });

    test("first letter is capitalized", () => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", "ok");

        const level = getBatteryLevel({ entity: "mocked_entity" }, hassMock.hass);
        
        expect(level).toBe("Ok");
    });

    test.each([
        ["ok", "100"],
        ["empty", "0"],
        ["20", "20"],
    ])
    ("state map applied", (entityState: string, expectedResult: string) => {
        
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("Mocked entity", entityState);

        const level = getBatteryLevel({ entity: "mocked_entity", state_map: [ { from: "ok", to: "100" }, { from: "empty", to: "0" } ] }, hassMock.hass);
        
        expect(level).toBe(expectedResult);
    });
});