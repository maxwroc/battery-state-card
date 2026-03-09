import { expect } from '@esm-bundle/chai';
import { BatteryStateEntity } from "../../../src/custom-elements/battery-state-entity";
import { EntityElements, HomeAssistantMock } from "../../helpers";

it("State updates", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.stateText).to.equal("80 %");

    sensor.setState("50");

    await cardElem.cardUpdated;

    expect(entity.stateText).to.equal("50 %");
});

const stateRoundingTests = [
    [80.451, 2, "80.45 %"],
    [80.456, 2, "80.46 %"],
    [80.456, 0, "80 %"],
    [80.456, undefined, "80.456 %"]
];

stateRoundingTests.forEach(([state, round, expectedState]) => {
    it(`State rounding - ${state} with round=${round}`, async () => {
        const hass = new HomeAssistantMock<BatteryStateEntity>();
        const sensor = hass.addEntity("Motion sensor battery level", (state as number).toString());
        const cardElem = hass.addCard("battery-state-entity", {
            entity: sensor.entity_id,
            round: round as number | undefined
        });

        await cardElem.cardUpdated;

        const entity = new EntityElements(cardElem);

        expect(entity.stateText).to.equal(expectedState);
    });
});

it("State with custom unit", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        unit: "lqi"
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.stateText).to.equal("80 lqi");
});

it("State with string value", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "Charging");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.stateText).to.equal("Charging");
});

const stateMapTests = [
    ["High", "Good"],
    ["Low", "Low"]
];

stateMapTests.forEach(([state, expectedState]) => {
    it(`State map with string values as target - ${state}`, async () => {
        const hass = new HomeAssistantMock<BatteryStateEntity>();
        const sensor = hass.addEntity("Motion sensor battery level", state as string);
        const cardElem = hass.addCard("battery-state-entity", {
            entity: sensor.entity_id,
            state_map: [
                { from: "High", to: "Good" },
                { from: "Low", to: "Low" }
            ]
        });

        await cardElem.cardUpdated;

        const entity = new EntityElements(cardElem);

        expect(entity.stateText).to.equal(expectedState);
    });
});

const statePriorityTests = [
    ["Charging", "80", undefined, "80 %"], // value taken from battery_level attribute
    ["Charging", undefined, "55", "55 %"], // value taken from battery attribute
    ["44", "OneThird", undefined, "44 %"], // value taken from the entity state
];

statePriorityTests.forEach(([entityState, batteryLevelAttrib, batteryAttrib, expectedState]) => {
    it(`State value priority - ${entityState}, batteryLevel:${batteryLevelAttrib}, battery:${batteryAttrib}`, async () => {
        const hass = new HomeAssistantMock<BatteryStateEntity>();
        const sensor = hass.addEntity("Motion sensor battery level", entityState as string);
        sensor.setAttributes({ battery_level: batteryLevelAttrib as string | undefined, battery: batteryAttrib as string | undefined });
        const cardElem = hass.addCard("battery-state-entity", {
            entity: sensor.entity_id,
        });

        await cardElem.cardUpdated;

        const entity = new EntityElements(cardElem);

        expect(entity.stateText).to.equal(expectedState);
    });
});