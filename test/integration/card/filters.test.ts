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

it("Explicit battery entity keeps its own state (no state substitution)", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    // Original entity has state "50", battery_notes entity has state "80"
    const batteryEntity = hass.addEntity("BN original battery", "50", { device_class: "battery" }, "sensor");
    const batteryNotesEntity = hass.addEntity("BN battery notes entity", "80", { device_class: "battery", state_class: "measurement", battery_quantity: 1 }, "sensor");

    hass.hass.entities = <any>{
        [batteryEntity.entity_id]: { entity_id: batteryEntity.entity_id, device_id: "device_bn1" },
        [batteryNotesEntity.entity_id]: { entity_id: batteryNotesEntity.entity_id, device_id: "device_bn1", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: batteryEntity.entity_id }],
        filter: {},
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    expect(card.itemsCount).to.equal(1);
    // Explicit entity keeps its own state (no state substitution anymore)
    expect(card.item(0).stateText).to.equal("50 %");
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

it("Non-measurement battery_notes sibling does not affect original entity state", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const batteryEntity = hass.addEntity("BN no state class original", "50", { device_class: "battery" }, "sensor");
    // battery_notes entity without state_class: "measurement"
    const batteryNotesEntity = hass.addEntity("BN no state class notes", "80", { device_class: "battery", battery_quantity: 1 }, "sensor");

    hass.hass.entities = <any>{
        [batteryEntity.entity_id]: { entity_id: batteryEntity.entity_id, device_id: "device_bn5" },
        [batteryNotesEntity.entity_id]: { entity_id: batteryNotesEntity.entity_id, device_id: "device_bn5", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: batteryEntity.entity_id }],
        filter: {},
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    expect(card.itemsCount).to.equal(1);
    // Original entity keeps its state
    expect(card.item(0).stateText).to.equal("50 %");
});

it("Non-battery entity is not affected by battery_notes sibling", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    // Original entity is not device_class "battery"
    const voltageEntity = hass.addEntity("BN voltage sensor", "3.2", { device_class: "voltage" }, "sensor");
    const batteryNotesEntity = hass.addEntity("BN voltage device notes", "80", { device_class: "battery", state_class: "measurement", battery_quantity: 1 }, "sensor");

    hass.hass.entities = <any>{
        [voltageEntity.entity_id]: { entity_id: voltageEntity.entity_id, device_id: "device_bn6" },
        [batteryNotesEntity.entity_id]: { entity_id: batteryNotesEntity.entity_id, device_id: "device_bn6", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: voltageEntity.entity_id }],
        filter: {},
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    expect(card.itemsCount).to.equal(1);
    // Voltage entity should keep its own state
    expect(card.item(0).stateText).to.equal("3.2 %");
});

it("Dedup: include filter shows battery_plus instead of original when both match", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    // Both entities have device_class "battery" so both match the include filter
    const originalEntity = hass.addEntity("BN dedup original", "50", { device_class: "battery" }, "sensor");
    const batteryPlusEntity = hass.addEntity("BN dedup battery plus", "80", { device_class: "battery", state_class: "measurement", battery_quantity: 1 }, "sensor");

    hass.hass.entities = <any>{
        [originalEntity.entity_id]: { entity_id: originalEntity.entity_id, device_id: "device_dedup1" },
        [batteryPlusEntity.entity_id]: { entity_id: batteryPlusEntity.entity_id, device_id: "device_dedup1", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        filter: {
            include: [{ name: "attributes.device_class", value: "battery" }],
        },
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    // Only battery_plus entity should remain (original removed by dedup)
    expect(card.itemsCount).to.equal(1);
    expect(card.item(0).stateText).to.equal("80 %");
});

it("Dedup: explicit entity is protected from dedup removal", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const originalEntity = hass.addEntity("BN explicit original", "50", { device_class: "battery" }, "sensor");
    const batteryPlusEntity = hass.addEntity("BN explicit battery plus", "80", { device_class: "battery", state_class: "measurement", battery_quantity: 1 }, "sensor");

    hass.hass.entities = <any>{
        [originalEntity.entity_id]: { entity_id: originalEntity.entity_id, device_id: "device_dedup2" },
        [batteryPlusEntity.entity_id]: { entity_id: batteryPlusEntity.entity_id, device_id: "device_dedup2", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: originalEntity.entity_id }],
        filter: {
            include: [{ name: "attributes.device_class", value: "battery" }],
        },
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    // Both should be shown: explicit entity is protected, battery_plus matched filter
    expect(card.itemsCount).to.equal(2);
});

it("Dedup: battery_notes_dedup false keeps duplicates", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const originalEntity = hass.addEntity("BN nodedup original", "50", { device_class: "battery" }, "sensor");
    const batteryPlusEntity = hass.addEntity("BN nodedup battery plus", "80", { device_class: "battery", state_class: "measurement", battery_quantity: 1 }, "sensor");

    hass.hass.entities = <any>{
        [originalEntity.entity_id]: { entity_id: originalEntity.entity_id, device_id: "device_dedup3" },
        [batteryPlusEntity.entity_id]: { entity_id: batteryPlusEntity.entity_id, device_id: "device_dedup3", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        battery_notes_dedup: false,
        filter: {
            include: [{ name: "attributes.device_class", value: "battery" }],
        },
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    // Both entities should remain when dedup is disabled
    expect(card.itemsCount).to.equal(2);
});

it("Dedup: non-battery entities on same device are untouched", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    const voltageEntity = hass.addEntity("BN dedup voltage", "3.2", { device_class: "voltage" }, "sensor");
    const batteryPlusEntity = hass.addEntity("BN dedup voltage device plus", "80", { device_class: "battery", state_class: "measurement", battery_quantity: 1 }, "sensor");

    hass.hass.entities = <any>{
        [voltageEntity.entity_id]: { entity_id: voltageEntity.entity_id, device_id: "device_dedup4" },
        [batteryPlusEntity.entity_id]: { entity_id: batteryPlusEntity.entity_id, device_id: "device_dedup4", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: voltageEntity.entity_id }],
        filter: {
            include: [{ name: "attributes.device_class", value: "battery" }],
        },
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    // Voltage entity (explicit, non-battery) + battery_plus (from filter) — both kept
    expect(card.itemsCount).to.equal(2);
});

it("Dedup: user-specified battery_plus entity is respected by filter", async () => {
    const hass = new HomeAssistantMock<BatteryStateCard>();
    // User explicitly adds the battery_plus entity
    const batteryPlusEntity = hass.addEntity("BN user plus entity", "80", { device_class: "battery", state_class: "measurement", battery_quantity: 1 }, "sensor");

    hass.hass.entities = <any>{
        [batteryPlusEntity.entity_id]: { entity_id: batteryPlusEntity.entity_id, device_id: "device_dedup6", platform: "battery_notes" },
    };

    const cardElem = hass.addCard("battery-state-card", <any>{
        entities: [{ entity: batteryPlusEntity.entity_id }],
        filter: {},
    });

    await cardElem.cardUpdated;

    const card = new CardElements(cardElem);
    expect(card.itemsCount).to.equal(1);
    expect(card.item(0).stateText).to.equal("80 %");
});