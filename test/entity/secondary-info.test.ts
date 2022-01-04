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

test("Secondary info charging text", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80", { is_charging: "true" });
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        secondary_info: "{charging}",
        charging_state: {
            secondary_info_text: "Charging now",
            attribute: {
                name: "is_charging",
                value: "true"
            }
        }
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);
    expect(entity.secondaryInfo).toBe("Charging now");
});

test("Secondary info other entity attribute value", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const flowerBattery = hass.addEntity("Flower sensor battery level", "80", {});
    const flowerEntity = hass.addEntity("Flower needs", "needs water", { sun_level: "good" }, "sensor");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: flowerBattery.entity_id,
        secondary_info: "Sun level is {sensor.flower_needs.attributes.sun_level}",
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);
    expect(entity.secondaryInfo).toBe("Sun level is good");
});