import { BatteryStateCard } from "../../src/custom-elements/battery-state-card";
import { CardElements, HomeAssistantMock } from "../helpers";

describe("Entities correctly sorted", () => {
    test.each([
        ["state", ["50", "90", "40"], "40 %, 50 %, 90 %"],
        ["state", ["40.5", "40.9", "40", "40.4"], "40 %, 40,4 %, 40,5 %, 40,9 %"],
    ])("when various state values appear", async (sort: ISimplifiedArray<ISortOption>, entityStates: string[], expectedOrder: string) => {

        const hass = new HomeAssistantMock<BatteryStateCard>();
        const entities = entityStates.map((state, i) => {
            const batt = hass.addEntity(`Batt ${i + 1}`, state);
            return batt.entity_id;
        });

        hass.mockFunc("formatEntityState", (entityData: any) => `${entityData.state.replace(".", ",")} %`);

        const cardElem = hass.addCard("battery-state-card", {
            title: "Header",
            entities,
            sort
        });

        // waiting for card to be updated/rendered
        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        const result = card.items.map(e => e.stateText).join(", ");
        expect(result).toBe(expectedOrder);
    });

    test.each([
        ["state", ["50%", "90%", "40%"], "40 %, 50 %, 90 %"],
    ])("when HA state formatting returns various result formats", async (sort: ISimplifiedArray<ISortOption>, formattedStates: string[], expectedOrder: string) => {

        const hass = new HomeAssistantMock<BatteryStateCard>();
        const entities = formattedStates.map((state, i) => {
            const batt = hass.addEntity(`Batt ${i + 1}`, "10");
            return batt.entity_id;
        });

        let i = 0;
        hass.mockFunc("formatEntityState", (entityData: any) => formattedStates[i++]);

        const cardElem = hass.addCard("battery-state-card", {
            title: "Header",
            entities,
            sort
        });

        // waiting for card to be updated/rendered
        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        const result = card.items.map(e => e.stateText).join(", ");
        expect(result).toBe(expectedOrder);
    });

    test.each([
        ["state", ["good", "low", "empty", "full"], "Empty, Low, Good, Full"],
        ["state", ["good", "low", "unknown", "empty", "full"], "Unknown, Empty, Low, Good, Full"],
    ])("when state_map is used with display value", async (sort: ISimplifiedArray<ISortOption>, formattedStates: string[], expectedOrder: string) => {

        const hass = new HomeAssistantMock<BatteryStateCard>();
        const entities = formattedStates.map((state, i) => {
            const batt = hass.addEntity(`Batt ${i + 1}`, state);
            return batt.entity_id;
        });

        const cardElem = hass.addCard("battery-state-card", <any>{
            title: "Header",
            entities,
            sort,
            state_map: [
                {
                    from: "empty",
                    to: "0",
                    display: "Empty"
                },
                {
                    from: "low",
                    to: "1",
                    display: "Low"
                },
                {
                    from: "good",
                    to: "2",
                    display: "Good"
                },
                {
                    from: "full",
                    to: "3",
                    display: "Full"
                },
            ]
        });

        // waiting for card to be updated/rendered
        await cardElem.cardUpdated;

        const card = new CardElements(cardElem);

        const result = card.items.map(e => e.stateText).join(", ");
        expect(result).toBe(expectedOrder);
    });
});