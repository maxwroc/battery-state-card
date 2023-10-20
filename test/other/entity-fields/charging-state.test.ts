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

    test("is true when charging state is in the external entity state", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Sensor", "80", { is_charging: "true" })
        const isCharging = getChargingState(
            { entity: entity.entity_id, charging_state: { attribute: [ { name: "status", value: "charging" }, { name: "is_charging", value: "true" } ] } }, 
            entity.state, 
            hassMock.hass); 

        expect(isCharging).toBe(true);
    })

});