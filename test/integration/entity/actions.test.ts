import { expect } from '@esm-bundle/chai';
import { BatteryStateEntity } from "../../../src/custom-elements/battery-state-entity";
import { HomeAssistantMock } from "../../helpers";

it("tap_action processes KString in navigation_path", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Battery Sensor", "50", { device_id: "device123" }, "sensor");

    let firedEvent: any = null;

    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        tap_action: {
            action: "navigate",
            navigation_path: "/config/devices/device/{attributes.device_id}"
        }
    });

    await cardElem.cardUpdated;

    // Listen for the hass-action event
    cardElem.addEventListener("hass-action", (e: any) => {
        firedEvent = e;
    });

    // Simulate a click
    cardElem.click();

    expect(firedEvent).to.not.be.null;
    expect(firedEvent.detail.action).to.equal("tap");
    expect(firedEvent.detail.config.tap_action.navigation_path).to.equal("/config/devices/device/device123");
});

it("tap_action processes KString in service_data with nested values", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Battery Sensor", "25", { device_name: "Bedroom Sensor" }, "sensor");

    let firedEvent: any = null;

    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        tap_action: {
            action: "call-service",
            service: "notify.mobile_app",
            service_data: {
                message: "Low battery: {state}%",
                title: "Alert for {attributes.device_name}",
                data: {
                    entity_id: "{entity_id}",
                    battery_level: "{state}"
                }
            }
        }
    });

    await cardElem.cardUpdated;

    // Listen for the hass-action event
    cardElem.addEventListener("hass-action", (e: any) => {
        firedEvent = e;
    });

    // Simulate a click
    cardElem.click();

    expect(firedEvent).to.not.be.null;
    expect(firedEvent.detail.config.tap_action.service_data.message).to.equal("Low battery: 25%");
    expect(firedEvent.detail.config.tap_action.service_data.title).to.equal("Alert for Bedroom Sensor");
    expect(firedEvent.detail.config.tap_action.service_data.data.entity_id).to.equal(sensor.entity_id);
    expect(firedEvent.detail.config.tap_action.service_data.data.battery_level).to.equal("25");
});

it("tap_action processes KString with external entity reference", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Battery Sensor", "50", {}, "sensor");
    const deviceTracker = hass.addEntity("Phone Location", "home", {}, "device_tracker");

    let firedEvent: any = null;

    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        tap_action: {
            action: "navigate",
            navigation_path: "/map/{device_tracker.phone_location.state}"
        }
    });

    await cardElem.cardUpdated;

    // Listen for the hass-action event
    cardElem.addEventListener("hass-action", (e: any) => {
        firedEvent = e;
    });

    // Simulate a click
    cardElem.click();

    expect(firedEvent).to.not.be.null;
    expect(firedEvent.detail.config.tap_action.navigation_path).to.equal("/map/home");
});

it("tap_action processes KString with processing functions", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Battery Sensor", "50.789", {}, "sensor");

    let firedEvent: any = null;

    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        tap_action: {
            action: "call-service",
            service: "notify.notify",
            service_data: {
                message: "Battery: {state|round(0)}%",
                title: "Doubled: {state|multiply(2)|round(1)}"
            }
        }
    });

    await cardElem.cardUpdated;

    // Listen for the hass-action event
    cardElem.addEventListener("hass-action", (e: any) => {
        firedEvent = e;
    });

    // Simulate a click
    cardElem.click();

    expect(firedEvent).to.not.be.null;
    expect(firedEvent.detail.config.tap_action.service_data.message).to.equal("Battery: 51%");
    expect(firedEvent.detail.config.tap_action.service_data.title).to.equal("Doubled: 101.6");
});

it("tap_action with 'more-info' string action works correctly", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Battery Sensor", "50", {}, "sensor");

    let firedEvent: any = null;

    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        tap_action: "more-info"
    });

    await cardElem.cardUpdated;

    // Listen for the hass-action event
    cardElem.addEventListener("hass-action", (e: any) => {
        firedEvent = e;
    });

    // Simulate a click
    cardElem.click();

    expect(firedEvent).to.not.be.null;
    // safeGetConfigObject converts string to object { action: "more-info" }
    expect(firedEvent.detail.config.tap_action).to.deep.equal({ action: "more-info" });
});

it("tap_action processes url_path with KString", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Battery Sensor", "50", { device_model: "XYZ-2000" }, "sensor");

    let firedEvent: any = null;

    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id,
        tap_action: {
            action: "url",
            url_path: "https://example.com/manual/{attributes.device_model}"
        }
    });

    await cardElem.cardUpdated;

    // Listen for the hass-action event
    cardElem.addEventListener("hass-action", (e: any) => {
        firedEvent = e;
    });

    // Simulate a click
    cardElem.click();

    expect(firedEvent).to.not.be.null;
    expect(firedEvent.detail.config.tap_action.url_path).to.equal("https://example.com/manual/XYZ-2000");
});

it("entity with no tap_action (default more-info) should not break", async () => {
    const hass = new HomeAssistantMock<BatteryStateEntity>();
    const sensor = hass.addEntity("Battery Sensor", "50", { device_id: "abc123" }, "sensor");

    let firedEvent: any = null;

    const cardElem = hass.addCard("battery-state-entity", {
        entity: sensor.entity_id
        // No tap_action specified, should default to "more-info"
    });

    await cardElem.cardUpdated;

    // Listen for the hass-action event
    cardElem.addEventListener("hass-action", (e: any) => {
        firedEvent = e;
    });

    // Simulate a click
    cardElem.click();

    expect(firedEvent).to.not.be.null;
    expect(firedEvent.detail.action).to.equal("tap");
    // safeGetConfigObject converts string to object { action: "more-info" }
    expect(firedEvent.detail.config.tap_action).to.deep.equal({ action: "more-info" });
});
