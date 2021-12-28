import { createEntityElement, entityElements, getEntityConfig, getHassMock } from "../helpers";

test.each([
    [95, "mdi:battery"],
    [94, "mdi:battery-90"],
    [49, "mdi:battery-50"],
    [10, "mdi:battery-10"],
    [5, "mdi:battery-10"],
    [4, "mdi:battery-outline"],
    [0, "mdi:battery-outline"],
])("dynamic name", async (state: number, expectedIcon: string) => {
    const entity = await createEntityElement(getEntityConfig(), getHassMock(state));
    const accessors = entityElements(entity);
    
    expect(accessors.icon()).toBe(expectedIcon);
});