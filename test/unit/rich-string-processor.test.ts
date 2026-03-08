import { BatteryStateEntity } from "../../src/custom-elements/battery-state-entity";
import { RichStringProcessor } from "../../src/rich-string-processor"
import { HomeAssistantMock } from "../helpers"

describe("RichStringProcessor", () => {

    test.each([
        [null, ""],
        [undefined, ""],
        ["", ""],
        ["false", "false"],
        ["0", "0"],
    ])("missing text", (input: any, expected: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", "50", {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, {});

        const result = proc.process(input);
        expect(result).toBe(expected);
    })

    test.each([
        ["Value {state}, {last_updated}", "Value 20.56, 2021-04-05 15:11:35"], // few placeholders
        ["Value {state}, {attributes.charging_state}", "Value 20.56, Charging"], // attribute value
        ["Value {state}, {sensor.kitchen_switch.state}", "Value 20.56, 55"], // external entity state
        ["Value {state}, {sensor.kitchen_switch.attributes.charging_state}", "Value 20.56, Fully charged"], // external entity attribute value
        ["Value {state}, {device_tracker.kitchen_switch.state}", "Value 20.56, 55", "device_tracker"], // external entity state
    ])("replaces placeholders", (text: string, expectedResult: string, otherEntityDomain = "sensor") => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", "20.56", { charging_state: "Charging" }, "sensor");
        const switchEntity = hassMock.addEntity("Kitchen switch", "55", { charging_state: "Fully charged" }, otherEntityDomain);

        motionEntity.setLastUpdated("2021-04-05 15:11:35");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });

    test.each([
        ["Rounded value {state|round()}", "Rounded value 21"], // rounding func - no param
        ["Rounded value {state|round(1)}", "Rounded value 20.6"], // rounding func - with param
    ])("round function", (text: string, expectedResult: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", "20.56", {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });

    test.each([
        ["{attributes.friendly_name|replace(motion,motion sensor)}", "Bedroom motion sensor"], // replacing part of the attribute value
    ])("replace function", (text: string, expectedResult: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", "20.56", {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });

    test("couple functions for the same placeholder", () => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", "Value 20.56%", {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process("{state|replace(Value ,)|replace(%,)|round()}");
        expect(result).toBe("21");
    });

    test("using custom data", () => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", "Value 20.56%", {}, "sensor");

        const entityData = {
            ...hassMock.hass.states[motionEntity.entity_id],
            "is_charging": "Charging",
        }

        const proc = new RichStringProcessor(hassMock.hass, entityData);

        const result = proc.process("{is_charging}");
        expect(result).toBe("Charging");
    });

    test.each([
        ["Value {state|multiply(2)}", "20.56", "Value 41.12"],
        ["Value {state|multiply(0.5)}", "20.56", "Value 10.28"],
        ["Value {state|multiply()}", "20.56", "Value 20.56"],  // param missing
    ])("multiply function", (text: string, state:string, expectedResult: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", state, {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });

    test.each([
        ["Value {state|add(2)}", "20.56", "Value 22.56"],
        ["Value {state|add(-21.5)|round(2)}", "20.56", "Value -0.94"],
        ["Value {state|add(0)}", "20.56", "Value 20.56"],
        ["Value {state|add()}", "20.56", "Value 20.56"],  // param missing
    ])("add function", (text: string, state:string, expectedResult: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", state, {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });

    test.each([
        ["{state|lessthan(2,0)|greaterthan(7,100)|between(1,8,50)}", "1", "0"],
        ["{state|lessthan(2,0)|greaterthan(7,100)|between(1,8,50)}", "2", "50"],
        ["{state|lessthan(2,0)|greaterthan(7,100)|between(1,8,50)}", "5", "50"],
        ["{state|lessthan(2,0)|greaterthan(7,100)|between(1,8,50)}", "7", "50"],
        ["{state|lessthan(2,0)|greaterthan(7,100)|between(1,8,50)}", "8", "100"],
        ["{state|lessthan(2,0)|greaterthan(7,100)|between(1,8,50)}", "70", "100"],
        // missing params
        ["{state|lessthan()|greaterthan(7,100)|between(1,8,50)}", "1", "1"],
        ["{state|lessthan(2,0)|greaterthan(7,100)|between()}", "5", "5"],
        ["{state|lessthan(2,0)|greaterthan()|between(1,8,50)}", "70", "70"],
    ])("greater, lessthan, between functions", (text: string, state:string, expectedResult: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", state, {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });

    test.each([
        ["{state|thresholds(22,88,200,450)}", "1", "0"],
        ["{state|thresholds(22,88,200,450)}", "22", "25"],
        ["{state|thresholds(22,88,200,450)}", "60", "25"],
        ["{state|thresholds(22,88,200,450)}", "90", "50"],
        ["{state|thresholds(22,88,200,450)}", "205", "75"],
        ["{state|thresholds(22,88,200,450)}", "449", "75"],
        ["{state|thresholds(22,88,200,450)}", "500", "100"],
        ["{state|thresholds(22,88,200)}", "90", "67"],
        ["{state|thresholds(22,88,200)}", "200", "100"],
    ])("threshold function", (text: string, state:string, expectedResult: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", state, {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });

    test.each([
        ["{state|abs()}", "-64", "64"],
        ["{state|abs()}", "64", "64"],
    ])("abs function", (text: string, state:string, expectedResult: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", state, {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });

    test.each([
        ["{state|equals(64,ok)}", "64", "ok"],
        ["{state|equals(65,err)}", "64", "64"],
        ["Not enough params {state|equals(64)}", "64", "Not enough params 64"],
    ])("equals function", (text: string, state:string, expectedResult: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", state, {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });

    test.each([
        ["{state|reltime()}", "2021-08-25T00:00:00.000Z", "<rt>2021-08-25T00:00:00.000Z</rt>"],
        ["Rel time: {state|reltime()}", "2021-08-25T00:00:00.000Z", "Rel time: <rt>2021-08-25T00:00:00.000Z</rt>"],
        ["Not date: {state|reltime()}", "this is not date", "Not date: this is not date"],
    ])("reltime function", (text: string, state:string, expectedResult: string) => {
        const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
        const motionEntity = hassMock.addEntity("Bedroom motion", state, {}, "sensor");
        const proc = new RichStringProcessor(hassMock.hass, hassMock.hass.states[motionEntity.entity_id]);

        const result = proc.process(text);
        expect(result).toBe(expectedResult);
    });
})