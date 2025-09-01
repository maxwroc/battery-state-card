import { BatteryStateEntity } from "../../src/custom-elements/battery-state-entity";
import { EntityElements, HomeAssistantMock } from "../helpers";

test("State updates", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.stateText).toBe("80 %");

    sensor.setState("50");

    await cardElem.cardUpdated;

    expect(entity.stateText).toBe("50 %");
});

test.each([
    [80.451, 2, "80.45 %"],
    [80.456, 2, "80.46 %"],
    [80.456, 0, "80 %"],
    [80.456, undefined, "80.456 %"]
])("State rounding", async (state: number, round: number | undefined, expectedState: string) => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", state.toString());
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        round: round
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.stateText).toBe(expectedState);
});

test("State with custom unit", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "80");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        unit: "lqi"
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.stateText).toBe("80 lqi");
});

test("State with string value", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", "Charging");
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.stateText).toBe("Charging");
});

test.each([
    ["High", "Good"],
    ["Low", "Low"]
])("State map with string values as target", async (state: string, expectedState: string) => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", state);
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        state_map: [
            { from: "High", to: "Good" },
            { from: "Low", to: "Low" }
        ]
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.stateText).toBe(expectedState);
});

test.each([
    ["Charging", "80", undefined, "80 %"], // value taken from battery_level attribute
    ["Charging", undefined, "55", "55 %"], // value taken from battery attribute
    ["44", "OneThird", undefined, "44 %"], // value taken from the entity state
])("State value priority", async (entityState: string, batteryLevelAttrib?: string, batteryAttrib?: string, expectedState?: string) => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", entityState);
    sensor.setAttributes({ battery_level: batteryLevelAttrib, battery: batteryAttrib })
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
    });

    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);

    expect(entity.stateText).toBe(expectedState);
});