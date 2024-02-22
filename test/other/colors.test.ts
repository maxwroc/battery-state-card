import { getColorForBatteryLevel } from "../../src/colors"

describe("Colors", () => {

    test.each([
        [0, "var(--label-badge-red)"],
        [20, "var(--label-badge-red)"],
        [21, "var(--label-badge-yellow)"],
        [55, "var(--label-badge-yellow)"],
        [56, "var(--label-badge-green)"],
        [100, "var(--label-badge-green)"],
    ])("default steps", (batteryLevel: number, expectedColor: string) => {
        const result = getColorForBatteryLevel({ entity: "", colors: undefined }, batteryLevel, false);

        expect(result).toBe(expectedColor);
    })
    
    test.each([
        [-5],
        [120],
    ])("default color retuned when level outisde of range, steps have no values and gradient turned on", (batteryLevel: number) => {
        const result = getColorForBatteryLevel({ entity: "", colors: { gradient: true, steps: [ { color: "#ff0000" }, { color: "#00ff00" } ] } }, batteryLevel, false);

        expect(result).toBe("inherit");
    })

    test.each([
        [0, "red"],
        [10, "red"],
        [11, "yellow"],
        [40, "yellow"],
        [41, "green"],
        [60, "green"],
        [100, "green"],
    ])("custom steps config", (batteryLevel: number, expectedColor: string) => {

        const colorsConfig: IColorSettings = {
            steps: [
                { value: 10, color: "red" },
                { value: 40, color: "yellow" },
                { value: 100, color: "green" }
            ]
        }
        const result = getColorForBatteryLevel({ entity: "", colors: colorsConfig }, batteryLevel, false);

        expect(result).toBe(expectedColor);
    })

    test.each([
        [0, "#ff0000"],
        [25, "#ff7f00"],
        [50, "#ffff00"],
        [75, "#7fff00"],
        [100, "#00ff00"],
    ])("gradient simple color list", (batteryLevel: number, expectedColor: string) => {
        const result = getColorForBatteryLevel({ entity: "", colors: { steps: ["#ff0000", "#ffff00", "#00ff00"], gradient: true } }, batteryLevel, false);

        expect(result).toBe(expectedColor);
    })

    test.each([
        [0, "#ff0000"],
        [10, "#ff0000"],
        [20, "#ff0000"], // color shouldn't change up to this point
        [35, "#ff7f00"], // middle point
        [50, "#ffff00"],
        [60, "#bfff00"], // middle point
        [90, "#00ff00"], // color shouldn't change from this point
        [95, "#00ff00"],
        [100, "#00ff00"],
    ])("gradient with step values", (batteryLevel: number, expectedColor: string) => {
        const config = <IBatteryEntityConfig>{
            entity: "",
            colors: {
                steps: [
                    { value: 20, color: "#ff0000" },
                    { value: 50, color: "#ffff00" },
                    { value: 90, color: "#00ff00"},
                ],
                gradient: true
            }
        }

        const result = getColorForBatteryLevel(config, batteryLevel, false);

        expect(result).toBe(expectedColor);
    })

    test("diabling colors", () => {
        const config = <IBatteryEntityConfig>{
            entity: "",
            colors: {
                steps: []
            }
        }

        const result = getColorForBatteryLevel(config, 80, false);

        expect(result).toBe("inherit");
    })

    test.each([
        // gradient, non-percent
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, true, -20, "#ff0000"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, true, 0, "#ff0000"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, true, 75, "#ff7f00"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, true, 150, "#ffff00"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, true, 200, "#7fff00"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, true, 250, "#00ff00"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, true, 260, "#00ff00"],
        // gradient, non-percent, negative step values
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, true, -200, "#ff0000"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, true, -150, "#ff0000"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, true, -125, "#ff7f00"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, true, -100, "#ffff00"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, true, -75, "#7fff00"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, true, -50, "#00ff00"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, true, 0, "#00ff00"],
        // steps, non-percent
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, false, -20, "#ff0000"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, false, 0, "#ff0000"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, false, 75, "#ffff00"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, false, 150, "#ffff00"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, false, 200, "#00ff00"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, false, 250, "#00ff00"],
        [[{color: "#ff0000", value: 0}, {color: "#ffff00", value: 150}, {color: "#00ff00", value: 250}], true, false, 260, "#00ff00"],
        // steps, non-percent, negative step values
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, false, -200, "#ff0000"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, false, -150, "#ff0000"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, false, -125, "#ffff00"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, false, -100, "#ffff00"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, false, -75, "#00ff00"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, false, -50, "#00ff00"],
        [[{color: "#ff0000", value: -150}, {color: "#ffff00", value: -100}, {color: "#00ff00", value: -50}], true, false, 0, "#00ff00"],
    ])("non percentage state values and gradient", (steps: IColorSteps[], non_percent_values: boolean | undefined, gradient: boolean | undefined, value: number, expectedResult: string) => {
        const config = <IBatteryEntityConfig>{
            entity: "",
            colors: {
                steps,
                non_percent_values,
                gradient
            }
        }

        const result = getColorForBatteryLevel(config, value, false);

        expect(result).toBe(expectedResult);
    })
})