import { BatteryStateEntity } from "../../src/custom-elements/battery-state-entity";
import { EntityElements, HomeAssistantMock } from "../helpers";

test("Name taken from friendly_name attribute", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.nameText).toBe("Motion sensor battery level");
});

test("Name taken from config override", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        name: "Static name"
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.nameText).toBe("Static name");
});