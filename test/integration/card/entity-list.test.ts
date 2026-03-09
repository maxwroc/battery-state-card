import { expect } from '@esm-bundle/chai';
import { BatteryStateCard } from "../../../src/custom-elements/battery-state-card";
import { CardElements, HomeAssistantMock } from "../../helpers";

it("Entities as strings/ids", async () => {

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

    expect(card.header).to.equal("Header");
    expect(card.itemsCount).to.equal(2);
});

it("Entities as objects with custom settings", async () => {
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

    expect(card.itemsCount).to.equal(2);
    expect(card.item(0).nameText).to.equal("Entity 1");
    expect(card.item(1).nameText).to.equal("Entity 2");
});

it("Missing entity", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const motionSensor = hass.addEntity("Bedroom motion battery level", "90");

    const cardElem = hass.addCard("battery-state-card", {
        title: "Header",
        entities: [ // array of entity IDs
            {
                entity: motionSensor.entity_id + "_missing",
            },
        ]
    });

    // waiting for card to be updated/rendered
    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);

    expect(card.itemsCount).to.equal(1);
    expect(card.item(0).isAlert).to.be.true;
    expect(card.item(0).alertType).to.equal("warning");
    expect(card.item(0).alertTitle).to.equal("[ui.panel.lovelace.warning.entity_not_found, entity, bedroom_motion_battery_level_missing]");
});