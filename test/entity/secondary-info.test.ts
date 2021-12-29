import { BatteryStateEntity } from "../../src/custom-elements/battery-state-entity";
import { EntityElements, HomeAssistantMock } from "../helpers";

test("Secondary info custom text", async () => {
    
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        secondary_info: "my info text"
    });
    
    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.secondaryInfo).toBe("my info text");
});