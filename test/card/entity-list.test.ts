import { BatteryStateCard } from "../../src/custom-elements/battery-state-card";
import { CardElements, HomeAssistantMock } from "../helpers";

test("Entities as strings/ids", async () => {

    const hass = new HomeAssistantMock<BatteryStateCard>();
    const motionSensor = hass.addEntity("Bedroom motion battery level", "90");
    const tempSensor = hass.addEntity("Temp sensor battery level", "50");

    const cardElem = hass.addCard("battery-state-card", {
        title: "Header",
        entities: [ // array of entity IDs
            motionSensor.entity_id,
            tempSensor.entity_id,
        ]
    });

    // waiting for card to be updated/rendered
    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);

    expect(card.header).toBe("Header");
    expect(card.itemsCount).toBe(2);
});

test("Entities as objects with custom settings", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const motionSensor = hass.addEntity("Bedroom motion battery level", "90");
    const tempSensor = hass.addEntity("Temp sensor battery level", "50");

    const cardElem = hass.addCard("battery-state-card", {
        title: "Header",
        entities: [ // array of entity IDs
            {
                entity: motionSensor.entity_id,
                name: "Entity 1"
            },
            {
                entity: tempSensor.entity_id,
                name: "Entity 2"
            }
        ]
    });

    // waiting for card to be updated/rendered
    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);

    expect(card.itemsCount).toBe(2);
    expect(card.item(0).nameText).toBe("Entity 1");
    expect(card.item(1).nameText).toBe("Entity 2");
});