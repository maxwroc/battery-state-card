import { HomeAssistant } from "custom-card-helpers";
import { BatteryStateEntity } from "../../src/custom-elements/battery-state-entity";
import { entityElements, getEntityConfig, getHassMock } from "../helpers";

describe("battery-state-entity basic", () => {

    const cardTagName = "battery-state-entity";

    afterEach(() => 
        Array
            .from(document.body.getElementsByTagName(cardTagName))
            .forEach(elem => elem.remove())
    );
    
    test.each([
        [95, "mdi:battery"],
        [94, "mdi:battery-90"],
        [49, "mdi:battery-50"],
        [10, "mdi:battery-10"],
        [5, "mdi:battery-10"],
        [4, "mdi:battery-outline"],
        [0, "mdi:battery-outline"],
    ])("Validate icon", async (state: number, expectedIcon: string) => {
        const entity = await createCard(getEntityConfig(), getHassMock(state));
        const accessors = entityElements(entity);
        
        expect(accessors.icon()).toBe(expectedIcon);
    });

    test("Validate name", async () => {
        const entity = await createCard(getEntityConfig(), getHassMock(100, { friendly_name: "My battery" }));
        const accessors = entityElements(entity);

        expect(accessors.name()).toBe("My battery");
    });

    test("Validate name config override", async () => {
        const entity = await createCard(
            getEntityConfig({ name: "Name override" }), 
            getHassMock(100, { friendly_name: "My battery" }));
        const accessors = entityElements(entity);

        expect(accessors.name()).toBe("Name override");
    });

    const createCard = async (config: IBatteryEntityConfig, hass: HomeAssistant) => {
        const myCard = <BatteryStateEntity>document.createElement(cardTagName);

        myCard.setConfig(config);
        myCard.hass = hass;

        document.body.appendChild(myCard);

        await myCard.cardUpdated;

        return myCard;
    }
})
