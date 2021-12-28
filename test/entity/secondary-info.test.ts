import { createEntityElement, entityElements, getEntityConfig, getHassMock } from "./helpers";

test("Secondary info custom text", async () => {
    const entity = await createEntityElement(
        getEntityConfig({ secondary_info: "my info text" }), 
        getHassMock());
    const accessors = entityElements(entity);

    expect(accessors.secondaryInfo()).toBe("my info text");
});