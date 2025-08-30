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
    expect(entity.secondaryInfoText).toBe("my info text");
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
    expect(entity.secondaryInfoText).toBe("Charging now");
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
    expect(entity.secondaryInfoText).toBe("Sun level is good");
});

test("Secondary info date value - renders relative time element", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const flowerBattery = hass.addEntity("Flower sensor battery level", "80", {});

    let dateStringSerialized = JSON.stringify(new Date(2022, 1, 24, 23, 45, 55));
    const dateString = dateStringSerialized.substring(1, dateStringSerialized.length - 1); // removing quotes
    flowerBattery.setLastUpdated(dateString);

    const cardElem = hass.addCard("battery-state-entity", {
        entity: flowerBattery.entity_id,
        secondary_info: "{last_updated}",
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);
    const relTimeElem = <HTMLElement>entity.secondaryInfo?.firstElementChild;
    expect(relTimeElem.tagName).toBe("HA-RELATIVE-TIME");
    expect(JSON.stringify((<any>relTimeElem).datetime)).toBe(dateStringSerialized);
});

// test("Secondary info date value - renders relative time element with text", async () => {
//     const hass = new HomeAssistantMock<BatteryStateEntity>();
//     const flowerBattery = hass.addEntity("Flower sensor battery level", "80", {});

//     const date = new Date(2022, 1, 24, 23, 45, 55);
//     let dateString = JSON.stringify(date);
//     dateString = dateString.substring(1, dateString.length - 1); // removing quotes
//     flowerBattery.setLastUpdated(dateString);

//     const cardElem = hass.addCard("battery-state-entity", {
//         entity: flowerBattery.entity_id,
//         secondary_info: "Last updated: {last_updated}",
//     });

//     await cardElem.cardUpdated;

//     const entity = new EntityElements(cardElem);
//     const relTimeElem = <HTMLElement>entity.secondaryInfo?.firstElementChild;
//     expect(relTimeElem.tagName).toBe("HA-RELATIVE-TIME");
//     expect((<any>relTimeElem).datetime).toBe(date);
// });