import { getChargingState } from "../../../src/entity-fields/charging-state";
import { HomeAssistantMock } from "../../helpers";

describe("Charging state", () => {

    test("is false when there is no charging configuration", () => {
        const hassMock = new HomeAssistantMock(true);
        const isCharging = getChargingState({ entity: "any" }, "90", hassMock.hass);

        expect(isCharging).toBe(false);
    })

    test("is true when charging state is in attribute", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "80", { is_charging: "true" })
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { attribute: [ { name: "is_charging", value: "true" } ] } },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(true);
    })

    test("is false when charging state is in attribute but attrib value is false", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "80", { is_charging: "true" })
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { attribute: [ { name: "is_charging", value: "false" } ] } },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(false);
    })

    test("is true when charging state is in attribute (more than one attribute in configuration)", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "80", { is_charging: "true" })
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { attribute: [ { name: "status", value: "charging" }, { name: "is_charging", value: "true" } ] } },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(true);
    })

    test("is false when charging state is in attribute (and attribute is missing)", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "80")
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { attribute: [ { name: "status", value: "charging" }, { name: "is_charging", value: "true" } ] } },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(false);
    })

    test.each([
        ["charging", true],
        ["charging", false, "MissingEntity"],
        ["discharging", false]
    ])("charging state is in the external entity state", (chargingEntityState: string, expected: boolean, missingEntitySuffix = "") => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "80")
        const entityChargingState = hassMock.addEntity("Charging sensor", chargingEntityState)
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { entity_id: entityChargingState.entity_id + missingEntitySuffix, state: "charging" } },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(expected);
    })

    test.each([
        ["charging", true],
        ["full", true],
        ["full", false, " missing"],
    ])("default charging state", (chargingEntityState: string, expected: boolean, missingEntitySuffix = "") => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor battery level", "80", { is_charging: "true" })
        const entityChargingState = hassMock.addEntity("Sensor battery state" + missingEntitySuffix, chargingEntityState)
        const isCharging = getChargingState(
            { entity: entity.entity_id },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(expected);
    })

    test("returns false when entity is not found in hass", () => {
        const hassMock = new HomeAssistantMock(true);
        const isCharging = getChargingState(
            { entity: "sensor.missing_entity", charging_state: { state: "charging" } },
            "80",
            hassMock.hass);

        expect(isCharging).toBe(false);
    })

    test("is true when attribute exists without specified value", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "80", { is_charging: "any_value" })
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { attribute: { name: "is_charging", value: "any_value" } } },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(true);
    })

    test("is true when state matches any of the specified states", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "charging")
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { state: ["charging", "full", "connected"] } },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(true);
    })

    test("is false when state doesn't match any of the specified states", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "discharging")
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { state: ["charging", "full", "connected"] } },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(false);
    })

    test("is true when charging_state config exists but no state array is specified and state is truthy", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "some_state")
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: {} },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(true);
    })

    test("is false when charging_state config exists but no state array is specified and state is falsy", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "")
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: {} },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(false);
    })

    test("is true when attribute is in nested path", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "80", {
            device: {
                charging: {
                    status: "active"
                }
            }
        })
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { attribute: { name: "device.charging.status", value: "active" } } },
            entity.state,
            hassMock.hass);

        expect(isCharging).toBe(true);
    })

});
