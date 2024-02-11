import { BatteryStateCard } from "../../src/custom-elements/battery-state-card";
import { CardElements, HomeAssistantMock } from "../helpers";

describe("Grouping", () => {
    test.each([
        [["10", "24", "25", "26", "50"], 25, "10 %|24 %", "25 %|26 %|50 %"],
        [["10.1", "24.2", "25.3", "26.4", "50.5"], 25, "10,1 %|24,2 %", "25,3 %|26,4 %|50,5 %", ","],
        [["10.1", "24.2", "25.3", "26.4", "50.5"], 25, "10.1 %|24.2 %", "25.3 %|26.4 %|50.5 %", "."],
    ])("works with 'min' setting", async (entityStates: string[], min: number, ungrouped: string, inGroup: string, decimalPoint = ".") => {

        const hass = new HomeAssistantMock<BatteryStateCard>();
        const entities = entityStates.map((state, i) => {
            const batt = hass.addEntity(`Batt ${i + 1}`, state);
            return batt.entity_id;
        });
        const groupEntity = hass.addEntity("My group", "30", { entity_id: entities }, "group");

        hass.mockFunc("formatEntityState", (entityData: any) => `${entityData.state.replace(".", decimalPoint)} %`);

        const cardElem = hass.addCard("battery-state-card", {
            title: "Header",
            entities: [],
            //sort: "state",
            collapse: [
                {
                    group_id: groupEntity.entity_id,
                    min
                }
            ]
        });

        // waiting for card to be updated/rendered
        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        const ungroupedStates = card.items.map(e => e.stateText).join("|");
        expect(ungroupedStates).toBe(ungrouped);

        expect(card.groupsCount).toBe(1);

        const groupStates = card.group(0).items.map(e => e.stateText).join("|");
        expect(groupStates).toBe(inGroup);
    });

    test.each([
        [["10", "24", "25", "26", "50"], "Min {min}, Max {max}, Range {range}, Count {count}", "Min 25, Max 50, Range 25-50, Count 3"],
    ])("secondary info keywords", async (entityStates: string[], secondaryInfo: string, expectedSecondaryInfo: string) => {

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

        expect(card.groupsCount).toBe(1);
        expect(card.group(0).secondaryInfoText).toBe(expectedSecondaryInfo);
    });
});