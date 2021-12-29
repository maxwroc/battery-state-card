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

