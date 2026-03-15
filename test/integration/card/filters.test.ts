import { expect } from '@esm-bundle/chai';
import { BatteryStateCard } from "../../../src/custom-elements/battery-state-card";
import { CardElements, HomeAssistantMock } from "../../helpers";

it("Include filter via entity_id", async () => {

    const hass = new HomeAssistantMock<BatteryStateCard>();
    hass.addEntity("Bedroom motion battery level", "90");
    hass.addEntity("Temp sensor battery level", "50");

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

    expect(card.itemsCount).to.equal(2);
});

it("Include via entity_id and exclude via state - empty result", async () => {

    const hass = new HomeAssistantMock<BatteryStateCard>();
    hass.addEntity("Bedroom motion battery level", "90");
    hass.addEntity("Temp sensor battery level", "50");

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

    expect(card.itemsCount).to.equal(0);
    // we expect to not have any content
    expect(cardElem.shadowRoot!.childElementCount).to.equal(0);
});


const hiddenStateTests = [
    [false, undefined, 1],
    [true, undefined, 0],
    [false, true, 1],
    [true, true, 0],
    [false, false, 1],
    [true, false, 1],
];

hiddenStateTests.forEach(([isHidden, respectVisibilitySetting, numOfRenderedEntities]) => {
    it(`Entity filtered based on hidden state - hidden:${isHidden}, respect:${respectVisibilitySetting}`, async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const entity = hass.addEntity("Bedroom motion battery level", "90");
        entity.setProperty("entity", { entity_id: "", hidden: isHidden as boolean });

        const cardElem = hass.addCard("battery-state-card", <any>{
            title: "Header",
            filter: {
                include: [
                    {
                        name: "entity_id",
                        value: "*_battery_level"
                    }
                ],
                exclude: [],
            },
            entities: [],
            respect_visibility_setting: respectVisibilitySetting,
        });

        // waiting for card to be updated/rendered
        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        expect(card.itemsCount).to.equal(numOfRenderedEntities);
    });
});

it("'filters' works as alias for 'filter' at card level", async () => {

    const hass = new HomeAssistantMock<BatteryStateCard>();
    hass.addEntity("Bedroom motion battery level", "90");
    hass.addEntity("Temp sensor battery level", "50");

    const cardElem = hass.addCard("battery-state-card", <any>{
        title: "Header",
        filters: {
            include: [
                {
                    name: "entity_id",
                    value: "*_battery_level"
                }
            ],
        },
        entities: []
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);

    expect(card.itemsCount).to.equal(2);
});

it("Hidden entity with battery_notes sibling is shown", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const batteryEntity = hass.addEntity("BN visible battery", "80", { device_class: "battery" }, "sensor");
    const batteryNotesEntity = hass.addEntity("BN visible battery notes", "80", { device_class: "battery", battery_quantity: 1 }, "sensor");

    // Set up entity registry with device linkage
    hass.hass.entities = <any>{
        [batteryEntity.entity_id]: { entity_id: batteryEntity.entity_id, device_id: "device_bn1", hidden: true },
        [batteryNotesEntity.entity_id]: { entity_id: batteryNotesEntity.entity_id, device_id: "device_bn1", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: batteryEntity.entity_id }],
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    expect(card.itemsCount).to.equal(1);
});

it("Hidden entity without battery_notes sibling stays hidden", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const batteryEntity = hass.addEntity("BN hidden no sibling battery", "80", { device_class: "battery" }, "sensor");

    // Entity is hidden but no battery_notes sibling exists
    hass.hass.entities = <any>{
        [batteryEntity.entity_id]: { entity_id: batteryEntity.entity_id, device_id: "device_bn2", hidden: true },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: batteryEntity.entity_id }],
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    expect(card.itemsCount).to.equal(0);
});

it("Hidden entity stays hidden when battery_notes sibling is also hidden", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const batteryEntity = hass.addEntity("BN both hidden battery", "80", { device_class: "battery" }, "sensor");
    const batteryNotesEntity = hass.addEntity("BN both hidden battery notes", "80", { device_class: "battery", battery_quantity: 1 }, "sensor");

    // Both entities are hidden
    hass.hass.entities = <any>{
        [batteryEntity.entity_id]: { entity_id: batteryEntity.entity_id, device_id: "device_bn3", hidden: true },
        [batteryNotesEntity.entity_id]: { entity_id: batteryNotesEntity.entity_id, device_id: "device_bn3", platform: "battery_notes", hidden: true },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: batteryEntity.entity_id }],
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    expect(card.itemsCount).to.equal(0);
});

it("Hidden entity stays hidden when battery_notes_enabled is false", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const batteryEntity = hass.addEntity("BN disabled battery", "80", { device_class: "battery" }, "sensor");
    const batteryNotesEntity = hass.addEntity("BN disabled battery notes", "80", { device_class: "battery", battery_quantity: 1 }, "sensor");

    hass.hass.entities = <any>{
        [batteryEntity.entity_id]: { entity_id: batteryEntity.entity_id, device_id: "device_bn4", hidden: true },
        [batteryNotesEntity.entity_id]: { entity_id: batteryNotesEntity.entity_id, device_id: "device_bn4", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: batteryEntity.entity_id }],
        battery_notes_enabled: false,
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    expect(card.itemsCount).to.equal(0);
});