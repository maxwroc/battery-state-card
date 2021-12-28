import { createEntityElement, entityElements, getEntityConfig, getHassMock, testCleanUp } from "../helpers"

describe("secondary info", () => {

    beforeEach(() => console.log("beforeEach"));

    afterEach(() => console.log("afterEach"));

    beforeAll(() => console.log("beforeAll"));
    afterAll(() => console.log("afterAll"));

    test("custom text", async () => {
        console.log("test start");
        expect(2).toBe(2);
        console.log("test end");
    });
})