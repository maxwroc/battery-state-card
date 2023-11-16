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
        [-220, "red"],
        [-80, "red"],
        [-79.9999, "yellow"],
        [-65, "yellow"],
        [-50, "green"],
        [0, "green"],
        [100, "green"],
    ])("custom steps config", (batteryLevel: number, expectedColor: string) => {

        const colorsConfig: IColorSettings = {
            steps: [
                { value: -80, color: "red" },
                { value: -65, color: "yellow" },
                { value: 1000, color: "green" }
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
})