import { createEntityElement, entityElements, getEntityConfig, getHassMock, testCleanUp } from "../helpers"

describe("secondary info", () => {

    afterEach(testCleanUp);

    test("custom text", async () => {
        const entity = await createEntityElement(getEntityConfig({ secondary_info: "my info text" }), getHassMock());
        const accessors = entityElements(entity);

        expect(accessors.secondaryInfo()).toBe("my info text");
    })
})