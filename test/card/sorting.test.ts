import { BatteryStateCard } from "../../src/custom-elements/battery-state-card";
import { CardElements, HomeAssistantMock } from "../helpers";


describe("Sorting", () => {
    test.each([
        ["state", ["50", "90", "40"], "40 %, 50 %, 90 %"],
        ["state", ["40.5", "40.9", "40", "40.4"], "40 %, 40,4 %, 40,5 %, 40,9 %"],
    ])("Items correctly sorted", async (sort: ISimplifiedArray<ISortOption>, entityStates: string[], expectedOrder: string) => {

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
});