import { testCleanUp } from "../helpers";

describe("Secondary", () => {

    afterEach(testCleanUp)

    test("fsf", () => {
        expect(2).toBe(2);
    })
});