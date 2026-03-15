import { handleAction } from "../../src/handle-action";
import { HomeAssistantMock } from "../helpers";
import { BatteryStateEntity } from "../../src/custom-elements/battery-state-entity";

describe("handleAction", () => {

    describe("KString processing in action config", () => {

        test("processes navigation_path with entity attributes", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", { device_id: "abc123" }, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "navigate",
                        navigation_path: "/config/devices/device/{attributes.device_id}"
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.navigation_path).toBe("/config/devices/device/abc123");
        });

        test("processes navigation_path with entity state", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", {}, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "navigate",
                        navigation_path: "/lovelace/battery-{state}"
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.navigation_path).toBe("/lovelace/battery-50");
        });

        test("processes url_path with KString", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", { device_name: "MyDevice" }, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "url",
                        url_path: "https://example.com/device/{attributes.device_name}"
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.url_path).toBe("https://example.com/device/MyDevice");
        });

        test("processes service name with KString", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "on", {}, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "call-service",
                        service: "light.turn_{state}"
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.service).toBe("light.turn_on");
        });

        test("processes service_data with KString in nested values", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", { device_id: "abc123" }, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "call-service",
                        service: "notify.notify",
                        service_data: {
                            message: "Battery level is {state}%",
                            title: "Device {attributes.device_id}",
                            data: {
                                device: "{attributes.device_id}"
                            }
                        }
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.service_data.message).toBe("Battery level is 50%");
            expect(firedEvent.detail.config.tap_action.service_data.title).toBe("Device abc123");
            expect(firedEvent.detail.config.tap_action.service_data.data.device).toBe("abc123");
        });

        test("processes data field with KString", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "25", {}, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "call-service",
                        service: "script.battery_alert",
                        data: {
                            battery_level: "{state}"
                        }
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.data.battery_level).toBe("25");
        });

        test("processes target field with KString", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", { target_entity: "light.bedroom" }, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "call-service",
                        service: "light.turn_on",
                        target: {
                            entity_id: "{attributes.target_entity}"
                        }
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.target.entity_id).toBe("light.bedroom");
        });

        test("processes array values in service_data", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", {}, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "call-service",
                        service: "script.run",
                        service_data: {
                            values: ["Battery: {state}%", "Entity: {entity_id}"]
                        }
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.service_data.values[0]).toBe("Battery: 50%");
            expect(firedEvent.detail.config.tap_action.service_data.values[1]).toBe("Entity: " + sensor.entity_id);
        });

        test("processes hold_action with KString", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", { device_id: "xyz789" }, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    hold_action: {
                        action: "navigate",
                        navigation_path: "/device/{attributes.device_id}"
                    }
                },
                "hold",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.hold_action.navigation_path).toBe("/device/xyz789");
        });

        test("processes double_tap_action with KString", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", { device_id: "xyz789" }, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    double_tap_action: {
                        action: "navigate",
                        navigation_path: "/info/{attributes.device_id}"
                    }
                },
                "double_tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.double_tap_action.navigation_path).toBe("/info/xyz789");
        });

        test("does not process when hass is not provided", () => {
            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: "sensor.battery",
                    tap_action: {
                        action: "navigate",
                        navigation_path: "/device/{attributes.device_id}"
                    }
                },
                "tap"
                // No hass parameter
            );

            expect(firedEvent).not.toBeNull();
            // Should keep the original KString pattern
            expect(firedEvent.detail.config.tap_action.navigation_path).toBe("/device/{attributes.device_id}");
        });

        test("handles string action config without processing", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", {}, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: "more-info" // String action, not an object
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            // String actions stay as strings since processActionProperties only processes objects
            expect(firedEvent.detail.config.tap_action).toBe("more-info");
        });

        test("processes KString with external entity reference", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50", { device_id: "abc123" }, "sensor");
            const otherSensor = hassMock.addEntity("Other Sensor", "active", {}, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "navigate",
                        navigation_path: "/status/{sensor.other_sensor.state}"
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.navigation_path).toBe("/status/active");
        });

        test("processes KString with processing functions", () => {
            const hassMock = new HomeAssistantMock<BatteryStateEntity>(true);
            const sensor = hassMock.addEntity("Battery Sensor", "50.789", {}, "sensor");
            const entityData = hassMock.hass.states[sensor.entity_id];

            const node = document.createElement("div");
            let firedEvent: any = null;
            node.addEventListener("hass-action", (e) => {
                firedEvent = e;
            });

            handleAction(
                node,
                {
                    entity: sensor.entity_id,
                    tap_action: {
                        action: "call-service",
                        service: "notify.notify",
                        service_data: {
                            message: "Battery is at {state|round(1)}%"
                        }
                    }
                },
                "tap",
                hassMock.hass,
                entityData
            );

            expect(firedEvent).not.toBeNull();
            expect(firedEvent.detail.config.tap_action.service_data.message).toBe("Battery is at 50.8%");
        });
    });
});
