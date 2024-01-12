import { getSecondaryInfo } from "../../../src/entity-fields/get-secondary-info"
import { HomeAssistantMock } from "../../helpers"

describe("Secondary info", () => {

    test("Unsupported entity domain", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Motion sensor kitchen", "50", {}, "water");
        const secondaryInfoConfig = "{" + entity.entity_id + "}";
        const result = getSecondaryInfo({ entity: "any", secondary_info: secondaryInfoConfig }, hassMock.hass, false);

        expect(result).toBe("{water.motion_sensor_kitchen}");
    })

    test("Other entity state (number)", () => { 
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Motion sensor kitchen", "50", {}, "sensor");
        const secondaryInfoConfig = "{" + entity.entity_id + ".state}";
        const result = getSecondaryInfo({ entity: "any", secondary_info: secondaryInfoConfig }, hassMock.hass, false);

        expect(result).toBe("50");
    })

    test("Attribute 'last_changed'", () => { 
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Motion sensor kitchen", "50", {}, "sensor");
        entity.setLastChanged("2022-02-07");
        const secondaryInfoConfig = "{last_changed}";
        const result = getSecondaryInfo({ entity: entity.entity_id, secondary_info: secondaryInfoConfig }, hassMock.hass, false);

        expect(result).toBe("<rt>2022-02-07</rt>");
    })

    test("Secondary info config not set'", () => { 
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Motion sensor kitchen", "50", {}, "sensor");
        entity.setLastChanged("2022-02-07");
        const secondaryInfoConfig = "{last_changed}";
        const result = getSecondaryInfo({ entity: entity.entity_id }, hassMock.hass, false);

        expect(result).toBeNull();
    })
})