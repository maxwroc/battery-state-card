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
    // default sort by state applies: Entity 2 (50%) comes before Entity 1 (90%)
    expect(card.item(0).nameText).to.equal("Entity 2");
    expect(card.item(1).nameText).to.equal("Entity 1");
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

describe("Unpack", () => {
    it("Sensor entity with unpack: true unpacks entity_id attribute into separate batteries", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const batt1 = hass.addEntity("Battery 1", "90");
        const batt2 = hass.addEntity("Battery 2", "50");
        const batt3 = hass.addEntity("Battery 3", "30");

        // sensor entity containing multiple entity_ids in its attributes
        const sensorGroup = hass.addEntity("Sensor group", "3", {
            entity_id: [batt1.entity_id, batt2.entity_id, batt3.entity_id]
        }, "sensor");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            entities: [
                {
                    entity: sensorGroup.entity_id,
                    unpack: true,
                }
            ]
        });

        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        expect(card.itemsCount).to.equal(3);
        // default sort by state applies
        expect(card.item(0).stateText).to.equal("30 %");
        expect(card.item(1).stateText).to.equal("50 %");
        expect(card.item(2).stateText).to.equal("90 %");
    });

    it("Sensor entity without unpack is not unpacked", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const batt1 = hass.addEntity("Battery 1", "90");
        const batt2 = hass.addEntity("Battery 2", "50");

        // sensor entity containing multiple entity_ids but without unpack
        const sensorGroup = hass.addEntity("Sensor group", "3", {
            entity_id: [batt1.entity_id, batt2.entity_id]
        }, "sensor");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            entities: [
                {
                    entity: sensorGroup.entity_id,
                }
            ]
        });

        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        // should show the sensor entity itself, not the unpacked children
        expect(card.itemsCount).to.equal(1);
        expect(card.item(0).stateText).to.equal("3 %");
    });

    it("Group domain entities are still unpacked without unpack flag", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const batt1 = hass.addEntity("Battery 1", "90");
        const batt2 = hass.addEntity("Battery 2", "50");

        const groupEntity = hass.addEntity("My group", "on", {
            entity_id: [batt1.entity_id, batt2.entity_id]
        }, "group");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            entities: [groupEntity.entity_id]
        });

        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        expect(card.itemsCount).to.equal(2);
    });

    it("Sensor entity with unpack: true but no entity_id attribute is handled gracefully", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();

        // sensor entity without entity_id in attributes
        const sensorEntity = hass.addEntity("Sensor entity", "42", {}, "sensor");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            entities: [
                {
                    entity: sensorEntity.entity_id,
                    unpack: true,
                }
            ]
        });

        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        // no entity_id attribute means nothing to unpack - no batteries created
        expect(card.itemsCount).to.equal(0);
    });

    it("Card-level unpack: true unpacks all entities with entity_id array attribute", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const batt1 = hass.addEntity("Battery 1", "90");
        const batt2 = hass.addEntity("Battery 2", "50");
        const batt3 = hass.addEntity("Battery 3", "30");

        // sensor entity containing multiple entity_ids in its attributes
        const sensorGroup = hass.addEntity("Sensor group", "3", {
            entity_id: [batt1.entity_id, batt2.entity_id, batt3.entity_id]
        }, "sensor");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            unpack: true,
            entities: [sensorGroup.entity_id]
        });

        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        expect(card.itemsCount).to.equal(3);
        // default sort by state applies
        expect(card.item(0).stateText).to.equal("30 %");
        expect(card.item(1).stateText).to.equal("50 %");
        expect(card.item(2).stateText).to.equal("90 %");
    });

    it("Card-level unpack: true does not affect entities without entity_id array", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const batt1 = hass.addEntity("Battery 1", "90");
        const batt2 = hass.addEntity("Battery 2", "50");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            unpack: true,
            entities: [batt1.entity_id, batt2.entity_id]
        });

        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        // regular entities should remain as-is
        expect(card.itemsCount).to.equal(2);
        // default sort by state applies
        expect(card.item(0).stateText).to.equal("50 %");
        expect(card.item(1).stateText).to.equal("90 %");
    });

    it("Card-level unpack: true works with mixed regular and group-like entities", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const batt1 = hass.addEntity("Battery 1", "90");
        const batt2 = hass.addEntity("Battery 2", "50");
        const batt3 = hass.addEntity("Battery 3", "30");

        // one regular entity and one sensor with entity_id array
        const sensorGroup = hass.addEntity("Sensor group", "2", {
            entity_id: [batt2.entity_id, batt3.entity_id]
        }, "sensor");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            unpack: true,
            entities: [batt1.entity_id, sensorGroup.entity_id]
        });

        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        // batt1 stays, sensorGroup is replaced by batt2 + batt3
        expect(card.itemsCount).to.equal(3);
    });

    it("Without card-level unpack, sensor entities with entity_id array are not unpacked", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const batt1 = hass.addEntity("Battery 1", "90");
        const batt2 = hass.addEntity("Battery 2", "50");

        const sensorGroup = hass.addEntity("Sensor group", "3", {
            entity_id: [batt1.entity_id, batt2.entity_id]
        }, "sensor");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            entities: [sensorGroup.entity_id]
        });

        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        // should show the sensor entity itself, not unpacked
        expect(card.itemsCount).to.equal(1);
        expect(card.item(0).stateText).to.equal("3 %");
    });
});