import { getIcon } from "../../../src/entity-fields/get-icon";

describe("Get icon", () => {
    test("charging and charging icon set in config", () => {
        let icon = getIcon({ entity: "", charging_state: { icon: "mdi:custom" } }, 20, true, undefined);
        expect(icon).toBe("mdi:custom");
    });
    
    test.each([
        [-2],
        [200],
        [NaN],
    ])("returns unknown state icon when invalid state passed", (invalidEntityState: number) => {
        let icon = getIcon({ entity: "" }, invalidEntityState, false, undefined);
        expect(icon).toBe("mdi:battery-unknown");
    });

    test.each([
        [0, false, "mdi:battery-outline"],
        [5, false, "mdi:battery-10"],
        [10, false, "mdi:battery-10"],
        [15, false, "mdi:battery-20"],
        [20, false, "mdi:battery-20"],
        [25, false, "mdi:battery-30"],
        [30, false, "mdi:battery-30"],
        [90, false, "mdi:battery-90"],
        [95, false, "mdi:battery"],
        [100, false, "mdi:battery"],
        [0, true, "mdi:battery-charging-outline"],
        [5, true, "mdi:battery-charging-10"],
        [10, true, "mdi:battery-charging-10"],
        [15, true, "mdi:battery-charging-20"],
        [20, true, "mdi:battery-charging-20"],
        [25, true, "mdi:battery-charging-30"],
        [30, true, "mdi:battery-charging-30"],
        [90, true, "mdi:battery-charging-90"],
        [95, true, "mdi:battery-charging-100"],
        [100, true, "mdi:battery-charging-100"],
    ])("returns correct state icon", (batteryLevel: number, isCharging: boolean, expectedIcon: string) => {
        let icon = getIcon({ entity: "" }, batteryLevel, isCharging, undefined);
        expect(icon).toBe(expectedIcon);
    });

    test("returns custom icon from config", () => {
        let icon = getIcon({ entity: "", icon: "mdi:custom" }, 20, false, undefined);
        expect(icon).toBe("mdi:custom");
    });
});