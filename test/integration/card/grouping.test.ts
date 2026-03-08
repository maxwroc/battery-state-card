import { expect } from '@esm-bundle/chai';
import { BatteryStateCard } from "../../../src/custom-elements/battery-state-card";
import { CardElements, HomeAssistantMock } from "../../helpers";

describe("Grouping", () => {
    const testCases = [
        [["10", "24", "25", "26", "50"], 25, "10 %|24 %", "25 %|26 %|50 %", "."],
        [["10.1", "24.2", "25.3", "26.4", "50.5"], 25, "10,1 %|24,2 %", "25,3 %|26,4 %|50,5 %", ","],
        [["10.1", "24.2", "25.3", "26.4", "50.5"], 25, "10.1 %|24.2 %", "25.3 %|26.4 %|50.5 %", "."],
    ];

    testCases.forEach(([entityStates, min, ungrouped, inGroup, decimalPoint]) => {
        it(`works with 'min' setting - ${decimalPoint === "," ? "comma" : "dot"} decimal`, async () => {
            const hass = new HomeAssistantMock<BatteryStateCard>();
            const entities = (entityStates as string[]).map((state, i) => {
                const batt = hass.addEntity(`Batt ${i + 1}`, state);
                return batt.entity_id;
            });
            const groupEntity = hass.addEntity("My group", "30", { entity_id: entities }, "group");

            hass.mockFunc("formatEntityState", (entityData: any) => `${entityData.state.replace(".", decimalPoint as string)} %`);

            const cardElem = hass.addCard("battery-state-card", {
                title: "Header",
                entities: [],
                //sort: "state",
                collapse: [
                    {
                        group_id: groupEntity.entity_id,
                        min: min as number
                    }
                ]
            });

            // waiting for card to be updated/rendered
            await cardElem.cardUpdated;

            const card = new CardElements(cardElem);

            const ungroupedStates = card.items.map(e => e.stateText).join("|");
            expect(ungroupedStates).to.equal(ungrouped);

            expect(card.groupsCount).to.equal(1);

            const groupStates = card.group(0).items.map(e => e.stateText).join("|");
            expect(groupStates).to.equal(inGroup);
        });
    });

    it("secondary info keywords", async () => {
        const entityStates = ["10", "24", "25", "26", "50"];
        const secondaryInfo = "Min {min}, Max {max}, Range {range}, Count {count}";
        const expectedSecondaryInfo = "Min 25, Max 50, Range 25-50, Count 3";

        const hass = new HomeAssistantMock<BatteryStateCard>();
        const entities = entityStates.map((state, i) => {
            const batt = hass.addEntity(`Batt ${i + 1}`, state);
            return batt.entity_id;
        });
        const groupEntity = hass.addEntity("My group", "30", { entity_id: entities }, "group");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Header",
            entities: [],
            //sort: "state",
            collapse: [
                {
                    group_id: groupEntity.entity_id,
                    min: 25,
                    secondary_info: secondaryInfo
                }
            ]
        });

        // waiting for card to be updated/rendered
        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        expect(card.groupsCount).to.equal(1);
        expect(card.group(0).secondaryInfoText).to.equal(expectedSecondaryInfo);
    });
});