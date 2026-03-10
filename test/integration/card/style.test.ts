import { expect } from '@esm-bundle/chai';
import { BatteryStateCard } from "../../../src/custom-elements/battery-state-card";
import { BatteryStateEntity } from "../../../src/custom-elements/battery-state-entity";
import { CardElements, HomeAssistantMock } from "../../helpers";

const getStyleContent = (elem: HTMLElement): string => {
    const styleTag = elem.shadowRoot?.querySelector("style");
    return styleTag?.textContent || "";
};

describe("Custom styles", () => {
    it("applies custom style to the card shadow DOM", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        hass.addEntity("Battery 1", "90");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            style: ".card-header { color: red; }",
            entities: ["battery_1"]
        });

        await cardElem.cardUpdated;
        await cardElem.updateComplete;

        expect(getStyleContent(cardElem)).to.contain(".card-header { color: red; }");
    });

    it("theme is applied via inline style attribute", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        hass.addEntity("Battery 1", "90");

        (<any>hass.hass).themes = {
            darkMode: false,
            themes: {
                "slate": {
                    "primary-color": "#2196F3"
                }
            }
        };

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            theme: "slate",
            entities: ["battery_1"]
        });

        await cardElem.cardUpdated;

        expect(cardElem.style.cssText).to.contain("--primary-color: #2196F3");
    });

    it("theme and custom style use separate mechanisms", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        hass.addEntity("Battery 1", "90");

        (<any>hass.hass).themes = {
            darkMode: false,
            themes: {
                "slate": {
                    "primary-color": "#2196F3"
                }
            }
        };

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            theme: "slate",
            style: ".card-content { background: #333; }",
            entities: ["battery_1"]
        });

        await cardElem.cardUpdated;
        await cardElem.updateComplete;

        // theme in inline style attribute
        expect(cardElem.style.cssText).to.contain("--primary-color: #2196F3");
        // custom style in shadow DOM style block
        expect(getStyleContent(cardElem)).to.contain(".card-content { background: #333; }");
    });

    it("no style block when style is not set", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        hass.addEntity("Battery 1", "90");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            entities: ["battery_1"]
        });

        await cardElem.cardUpdated;
        await cardElem.updateComplete;

        expect(cardElem.shadowRoot?.querySelector("style")).to.be.null;
    });

    it("applies custom style to entity element shadow DOM", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        hass.addEntity("Battery 1", "90");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            entities: [
                { entity: "battery_1", style: ".name { font-weight: bold; }" }
            ]
        });

        await cardElem.cardUpdated;
        await cardElem.updateComplete;

        const entityElem = cardElem.shadowRoot!.querySelectorAll<BatteryStateEntity>(".card-content > * > battery-state-entity")[0];
        expect(getStyleContent(entityElem)).to.contain(".name { font-weight: bold; }");
    });

    it("card-level style propagates to entity elements", async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        hass.addEntity("Battery 1", "90");
        hass.addEntity("Battery 2", "50");

        const cardElem = hass.addCard("battery-state-card", {
            title: "Test",
            style: ".state { color: blue; }",
            entities: ["battery_1", "battery_2"]
        });

        await cardElem.cardUpdated;
        await cardElem.updateComplete;

        const entities = cardElem.shadowRoot!.querySelectorAll<BatteryStateEntity>(".card-content > * > battery-state-entity");
        expect(getStyleContent(entities[0])).to.contain(".state { color: blue; }");
        expect(getStyleContent(entities[1])).to.contain(".state { color: blue; }");
    });

    it("no style block in entity when style is not set", async () => {
        const hass = new HomeAssistantMock<BatteryStateEntity>();
        hass.addEntity("Battery 1", "90");

        const cardElem = hass.addCard("battery-state-entity", {
            entity: "battery_1",
        });

        await cardElem.cardUpdated;
        await cardElem.updateComplete;

        expect(cardElem.shadowRoot?.querySelector("style")).to.be.null;
    });
});
