import { expect } from '@esm-bundle/chai';
import { BatteryStateEntity } from "../../../src/custom-elements/battery-state-entity";
import { EntityElements, HomeAssistantMock } from "../../helpers";

const dynamicBatteryIconTests = [
    [95, "mdi:battery"],
    [94, "mdi:battery-90"],
    [49, "mdi:battery-50"],
    [10, "mdi:battery-10"],
    [5, "mdi:battery-10"],
    [4, "mdi:battery-outline"],
    [0, "mdi:battery-outline"],
];

dynamicBatteryIconTests.forEach(([state, expectedIcon]) => {
    it(`Dynamic battery icon - state ${state}`, async () => {
        const hass = new HomeAssistantMock<BatteryStateEntity>();
        const sensor = hass.addEntity("Motion sensor battery level", (state as number).toString());
        const cardElem = hass.addCard("battery-state-entity", {
            entity: sensor.entity_id
        });

        await cardElem.cardUpdated;

        const entity = new EntityElements(cardElem);

        expect(entity.iconName).to.equal(expectedIcon);
    });
});

it("Static icon", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        icon: "mdi:static"
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.iconName).to.equal("mdi:static");
});

// ################# Charging state #################

const dynamicChargingIconTests = [
    [95, "mdi:battery-charging-100"],
    [94, "mdi:battery-charging-90"],
    [49, "mdi:battery-charging-50"],
    [10, "mdi:battery-charging-10"],
    [5, "mdi:battery-charging-10"],
    [4, "mdi:battery-charging-outline"],
    [0, "mdi:battery-charging-outline"],
];

dynamicChargingIconTests.forEach(([state, expectedIcon]) => {
    it(`Dynamic charging icon - state ${state}`, async () => {
        const hass = new HomeAssistantMock<BatteryStateEntity>();
        const sensor = hass.addEntity("Motion sensor battery level", (state as number).toString(), { is_charging: "true" });
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

        expect(entity.iconName).to.equal(expectedIcon);
    });
});

it("Static charging icon", async () => {
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

    expect(entity.iconName).to.equal("mdi:static-charging-icon");
});

it("Charging state taken from object set as attribute", async () => {
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

    expect(entity.iconName).to.equal("mdi:static-charging-icon");
});

// ################# Default entity icon #################

it("Default entity icon", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        icon: null
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    // When icon is null, ha-state-icon element should be used
    expect(entity.iconName).to.equal("__ha-state-icon__");
});

it("Default entity icon - fallback to battery when entity has no icon", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        icon: null
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    // When icon is null, ha-state-icon element should be used (even if it falls back to default)
    expect(entity.iconName).to.equal("__ha-state-icon__");
});

it("Default entity icon - custom icon takes precedence", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        icon: "mdi:custom-icon"
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    // Custom icon should take precedence
    expect(entity.iconName).to.equal("mdi:custom-icon");
});