import { HomeAssistant } from "custom-card-helpers";
import { BatteryStateEntity } from "../src/custom-elements/battery-state-entity";


export const getHassMock = (state = 89, attributes: IEntityAttributes = <any>{}): HomeAssistant => <any>{
    states: {
        "sensor.remote_battery_level": {
            state: state,
            attributes: {
                friendly_name: "Battery entity",
                ...attributes
            }
        }
    },
    localize: jest.fn((key: string) => `[${key}]`)
};

export const getEntityConfig = (overrides: IBatteryEntityConfigOverrides = <any>{}) => {
    return <IBatteryEntityConfig>{
        entity: "sensor.remote_battery_level",
        ...<any>overrides
    }
}


export const entityElements = (card: BatteryStateEntity) => {
    return {
        icon: () => card.shadowRoot?.querySelector("ha-icon")?.getAttribute("icon"),
        name: () => card.shadowRoot?.querySelector(".name")?.textContent?.trim(),
        secondaryInfo: () => card.shadowRoot?.querySelector(".secondary")?.textContent?.trim(),
    }
}



export const createEntityElement = async (config: IBatteryEntityConfig, hass: HomeAssistant) => {
    const myCard = <BatteryStateEntity>document.createElement("battery-state-entity");

    myCard.setConfig(config);
    myCard.hass = hass;

    document.body.appendChild(myCard);

    await myCard.cardUpdated;

    return myCard;
}

/**
 * Removing all existing elements
 */
export const testCleanUp = () => {
    ["battery-state-card", "battery-state-entity"].forEach(cardTagName => Array
        .from(document.body.getElementsByTagName(cardTagName))
        .forEach(elem => elem.remove()));
}

afterEach(testCleanUp);

interface IEntityAttributes {
    friendly_name?: string;
    [key: string]: any;
}

interface IBatteryEntityConfigOverrides extends Omit<IBatteryEntityConfig, "entity"> {
    entity?: string;
}