import { BatteryStateCard } from "../../src/custom-elements/battery-state-card";
import { CardElements, HomeAssistantMock } from "../helpers";

test("Include filter via entity_id", async () => {

    const hass = new HomeAssistantMock<BatteryStateCard>();
    const motionSensor = hass.addEntity("Bedroom motion battery level", "90");
    const tempSensor = hass.addEntity("Temp sensor battery level", "50");

    const cardElem = hass.addCard("battery-state-card", {
        title: "Header",
        filter: {
            include: [
                {
                    name: "entity_id",
                    value: "*_battery_level"
                }
            ],
            exclude: []
        },
        entities: []
    });

    // waiting for card to be updated/rendered
    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);

    expect(card.itemsCount).toBe(2);
});

test("Include via entity_id and exclude via state - empty result", async () => {

    const hass = new HomeAssistantMock<BatteryStateCard>();
    const motionSensor = hass.addEntity("Bedroom motion battery level", "90");
    const tempSensor = hass.addEntity("Temp sensor battery level", "50");

    const cardElem = hass.addCard("battery-state-card", {
        title: "Header",
        filter: {
            include: [
                {
                    name: "entity_id",
                    value: "*_battery_level"
                }
            ],
            exclude: [
                {
                    name: "state",
                    value: 40,
                    operator: ">"
                }
            ]
        },
        entities: []
    });

    // waiting for card to be updated/rendered
    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    
    expect(card.itemsCount).toBe(0);
    // we expect to not have any content
    expect(cardElem.shadowRoot!.childElementCount).toBe(0);
});