import { BatteryStateEntity } from "../../src/custom-elements/battery-state-entity";
import { EntityElements, HomeAssistantMock } from "../helpers";

test.each([
    [95, "mdi:battery"],
    [94, "mdi:battery-90"],
    [49, "mdi:battery-50"],
    [10, "mdi:battery-10"],
    [5, "mdi:battery-10"],
    [4, "mdi:battery-outline"],
    [0, "mdi:battery-outline"],
])("Dynamic battery icon", async (state: number, expectedIcon: string) => {

    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", state.toString());
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.iconName).toBe(expectedIcon);
});

test("Static icon", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        icon: "mdi:static"
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.iconName).toBe("mdi:static");
});

// ################# Charging state #################

test.each([
    [95, "mdi:battery-charging-100"],
    [94, "mdi:battery-charging-90"],
    [49, "mdi:battery-charging-50"],
    [10, "mdi:battery-charging-10"],
    [5, "mdi:battery-charging-10"],
    [4, "mdi:battery-charging-outline"],
    [0, "mdi:battery-charging-outline"],
])("Dynamic charging icon", async (state: number, expectedIcon: string) => {

    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", state.toString(), { is_charging: "true" });
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        charging_state: {
            attribute: {
                name: "is_charging",
                value: "true"
            }
        }
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.iconName).toBe(expectedIcon);
});

test("Static charging icon", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80", { is_charging: "true" });
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        charging_state: {
            icon: "mdi:static-charging-icon",
            attribute: {
                name: "is_charging",
                value: "true"
            }
        }
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.iconName).toBe("mdi:static-charging-icon");
});

test("Charging state taken from object set as attribute", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80", { valetudo_state: { "id": 8, "name": "Charging" } });
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        charging_state: {
            icon: "mdi:static-charging-icon",
            attribute: {
                name: "valetudo_state.name",
                value: "Charging"
            }
        }
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.iconName).toBe("mdi:static-charging-icon");
});