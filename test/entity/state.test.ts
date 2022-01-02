import { BatteryStateEntity } from "../../src/custom-elements/battery-state-entity";
import { EntityElements, HomeAssistantMock } from "../helpers";


test("State updates", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
    });
    
    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);
    
    expect(entity.state).toBe("80 %");

    sensor.setState("50");

    await cardElem.cardUpdated;

    expect(entity.state).toBe("50 %");
});

test.each([
    [80.451, 2, "80.45 %"],
    [80.456, 2, "80.46 %"],
    [80.456, 0, "80 %"],
    [80.456, undefined, "80.456 %"]
])("State updates", async (state: number, round: number | undefined, expectedState: string) => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", state.toString());
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        round: round
    });
    
    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);
    
    expect(entity.state).toBe(expectedState);
});

test("State with custom unit", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        unit: "lqi"
    });
    
    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);
    
    expect(entity.state).toBe("80 lqi");
});

test("State with string value", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "Charging");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
    });
    
    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);
    
    expect(entity.state).toBe("Charging");
});

test.each([
    ["High", "Good"],
    ["Low", "Low"]
])("State map with string values as target", async (state: string, expectedState: string) => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", state);
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        state_map: [
            { from: "High", to: "Good" },
            { from: "Low", to: "Low" }
        ]
    });
    
    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);
    
    expect(entity.state).toBe(expectedState);
});