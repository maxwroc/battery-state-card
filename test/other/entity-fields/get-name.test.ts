import { getName } from "../../../src/entity-fields/get-name";
import { HomeAssistantMock } from "../../helpers";

describe("Get name", () => {
    test("returns name from the config", () => {
        const hassMock = new HomeAssistantMock(true);
        let name = getName({ entity: "test", name: "Entity name" }, hassMock.hass)

        expect(name).toBe("Entity name");
    });

    test("returns entity id when name and hass is missing", () => {
        let name = getName({ entity: "sensor.my_entity_id" }, undefined)

        expect(name).toBe("sensor.my_entity_id");
    });

    test("returns name from friendly_name attribute of the entity", () => {
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("My entity", "45", { friendly_name: "My entity name" });

        let name = getName({ entity: "my_entity" }, hassMock.hass);

        expect(name).toBe("My entity name");
    });

    test("returns entity id when entity not found in hass", () => {
        const hassMock = new HomeAssistantMock(true);
        let name = getName({ entity: "my_entity_missing" }, hassMock.hass);

        expect(name).toBe("my_entity_missing");
    });

    test("returns entity id when entity doesn't have a friendly_name attribute", () => {
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("My entity", "45", { friendly_name: undefined });

        let name = getName({ entity: "my_entity" }, hassMock.hass);

        expect(name).toBe("my_entity");
    });

    test.each(
        [
            ["Kitchen temperature battery", { from: "battery", to: "bat" }, "Kitchen temperature bat"],
            ["Kitchen temperature battery", { from: "/\\s[^\\s]+ery/", to: "" }, "Kitchen temperature"],
            ["Kitchen temperature battery", [{ from: "battery", to: "bat." }, {from: "temperature", to: "temp."}], "Kitchen temp. bat."],
        ]
    )("returns renamed entity name", (entityName: string, renameRules: IConvert | IConvert[], expectedResult: string) => {
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("My entity", "45", { friendly_name: entityName });

        let name = getName({ entity: "my_entity", bulk_rename: renameRules }, hassMock.hass);

        expect(name).toBe(expectedResult);
    });

    test.each(
        [
            ["Kitchen Battery", { from: "/ Battery/", to: "" }, "Kitchen"],
            ["Kitchen Battery", { from: "/ battery/i", to: "" }, "Kitchen"],
            ["Kitchen battery temperature battery", [{ from: "/\\sbattery/ig", to: "" }], "Kitchen temperature"],
        ]
    )("regex", (entityName: string, renameRules: IConvert | IConvert[], expectedResult: string) => {
        const hassMock = new HomeAssistantMock(true);
        hassMock.addEntity("My entity", "45", { friendly_name: entityName });

        let name = getName({ entity: "my_entity", bulk_rename: renameRules }, hassMock.hass);

        expect(name).toBe(expectedResult);
    });
});