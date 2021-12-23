import { createEntityElement, entityElements, getEntityConfig, getHassMock, testCleanUp } from "../helpers";

describe("Name", () => {

    afterEach(testCleanUp);

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