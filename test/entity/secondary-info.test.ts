import { createEntityElement, entityElements, getEntityConfig, getHassMock, testCleanUp } from "../helpers";

describe("Icon", () => {

    afterEach(testCleanUp);
    
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

    test("static name", async () => {
        const config = getEntityConfig();
        config.icon = "mdi:custom-icon";

        const entity = await createEntityElement(config, getHassMock());
        const accessors = entityElements(entity);
        
        expect(accessors.icon()).toBe("mdi:custom-icon");
    });

    test("Name taken from friendly_name attribute", async () => {
        const entity = await createEntityElement(getEntityConfig(), getHassMock(100, { friendly_name: "My battery" }));
        const accessors = entityElements(entity);

        expect(accessors.name()).toBe("My battery");
    });

    test("Name taken from config override", async () => {
        const entity = await createEntityElement(
            getEntityConfig({ name: "Name override" }), 
            getHassMock(100, { friendly_name: "My battery" }));
        const accessors = entityElements(entity);

        expect(accessors.name()).toBe("Name override");
    });
})