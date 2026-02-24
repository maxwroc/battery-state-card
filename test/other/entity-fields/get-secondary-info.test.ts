import { getSecondaryInfo } from "../../../src/entity-fields/get-secondary-info"
import { HomeAssistantMock } from "../../helpers"

describe("Secondary info", () => {

    test("Unsupported entity domain", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Motion sensor kitchen", "50", {}, "water");
        const secondaryInfoConfig = "{" + entity.entity_id + "}";
        const result = getSecondaryInfo({ entity: "any", secondary_info: secondaryInfoConfig }, hassMock.hass, {});

        expect(result).toBe("");
    })

    test("Other entity state (number)", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Motion sensor kitchen", "50", {}, "sensor");
        const secondaryInfoConfig = "{" + entity.entity_id + ".state}";
        const result = getSecondaryInfo({ entity: "any", secondary_info: secondaryInfoConfig }, hassMock.hass, {});

        expect(result).toBe("50");
    })

    test("Attribute 'last_changed'", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Motion sensor kitchen", "50", {}, "sensor");
        entity.setLastChanged("2022-02-07");
        const secondaryInfoConfig = "{last_changed}";
        const result = getSecondaryInfo({ entity: entity.entity_id, secondary_info: secondaryInfoConfig }, hassMock.hass, hassMock.hass.states[entity.entity_id]);

        expect(result).toBe("<rt>2022-02-07</rt>");
    })

    test("Secondary info config not set", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Motion sensor kitchen", "50", {}, "sensor");
        entity.setLastChanged("2022-02-07");
        const result = getSecondaryInfo({ entity: entity.entity_id }, hassMock.hass, {});

        expect(result).toBeNull();
    })

    test("Secondary info charging text", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Motion sensor kitchen", "50", {}, "sensor");

        const entityData = {
            ...hassMock.hass.states[entity.entity_id],
            "charging": "Charging"
        }
        const result = getSecondaryInfo({ entity: entity.entity_id, secondary_info: "{charging}" }, hassMock.hass, entityData);

        expect(result).toBe("Charging");
    })

    test("Text with number should not be treated as date (e.g. 'Bedroom 2')", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Bedroom 2", "50", {}, "sensor");
        const result = getSecondaryInfo({ entity: entity.entity_id, secondary_info: "Bedroom 2" }, hassMock.hass, hassMock.hass.states[entity.entity_id]);

        expect(result).toBe("Bedroom 2");
        expect(result).not.toContain("<rt>");
    })

    test("Actual dates should still be detected and wrapped", () => {
        const hassMock = new HomeAssistantMock(true);
        const entity = hassMock.addEntity("Test sensor", "50", {}, "sensor");
        
        // Test ISO date format
        const result1 = getSecondaryInfo({ entity: entity.entity_id, secondary_info: "2023-12-25" }, hassMock.hass, hassMock.hass.states[entity.entity_id]);
        expect(result1).toBe("<rt>2023-12-25</rt>");
        
        // Test datetime format (ISO 8601)
        const result2 = getSecondaryInfo({ entity: entity.entity_id, secondary_info: "2023-12-25T10:30:00" }, hassMock.hass, hassMock.hass.states[entity.entity_id]);
        expect(result2).toBe("<rt>2023-12-25T10:30:00</rt>");
        
        // Test full datetime with timezone
        const result3 = getSecondaryInfo({ entity: entity.entity_id, secondary_info: "2023-12-25T10:30:00Z" }, hassMock.hass, hassMock.hass.states[entity.entity_id]);
        expect(result3).toBe("<rt>2023-12-25T10:30:00Z</rt>");
    })
})