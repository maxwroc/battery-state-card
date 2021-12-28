import { createEntityElement, entityElements, getEntityConfig, getHassMock } from "./helpers";

test("Static name", async () => {
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