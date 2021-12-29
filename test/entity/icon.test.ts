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
])("dynamic icon", async (state: number, expectedIcon: string) => {

    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Motion sensor battery level", state.toString());
    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id
    });
    
    await cardElem.cardUpdated;

    const entity = new EntityElements(cardElem);
    
    expect(entity.icon).toBe(expectedIcon);
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

    expect(entity.icon).toBe("mdi:static");
})

