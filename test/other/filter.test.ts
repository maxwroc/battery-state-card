import { Filter } from "../../src/filter";
import { HomeAssistantMock } from "../helpers";

describe("Filter", () => {
    test.each([
        ["Bedroom motion battery level", "*_battery_level", true],
        ["Bedroom motion battery level", "/_battery_level$/", true],
        ["Bedroom motion battery level", "*_battery_*", true],
        ["Bedroom motion battery level", "*_battery_", false],
        ["Bedroom motion", "*_battery_level", false],
        ["Bedroom motion", "/BEDroom_motion/", false],
        ["Bedroom motion", "/BEDroom_motion/i", true],
    ])("returns correct validity status (matches func)", (entityName: string, filterValue: string, expectedIsVlid: boolean) => {
        const hassMock = new HomeAssistantMock();

        const entity = hassMock.addEntity(entityName, "90");

        const filter = new Filter({ name: "entity_id", value: filterValue });
        const isValid = filter.isValid(entity);

        expect(filter.is_permanent).toBeTruthy();
        expect(isValid).toBe(expectedIsVlid);
    })
});