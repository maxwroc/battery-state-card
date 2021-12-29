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