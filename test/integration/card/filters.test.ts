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
        entity.setProperty("display", { entity_id: "", hidden: isHidden as boolean });

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