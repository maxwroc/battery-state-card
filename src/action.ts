import { HomeAssistant } from "custom-card-helpers";
import { log } from "./utils";

const nameToFuncMap: { [key in SupportedActions]: (data: IActionData, hass: HomeAssistant) => void } = {

    "more-info": (data) => {
        const evt = <any>new Event('hass-more-info', { composed: true });
        evt.detail = { entityId: data.entityId };
        data.card.dispatchEvent(evt);
    },

    "navigate": (data) => {
        if (!data.config.navigation_path) {
            log("Missing 'navigation_path' for 'navigate' tap action");
            return;
        }

        window.history.pushState(null, "", data.config.navigation_path);
        const evt = <any>new Event("location-changed", { composed: true });
        evt.detail = { replace: false };
        window.dispatchEvent(evt);
    },

    "call-service": (data, hass) => {
        if (!data.config.service) {
            log("Missing 'service' for 'call-service' tap action");
            return;
        }

        const [domain, service] = data.config.service.split(".", 2);
        const serviceData = { ...data.config.service_data };
        hass.callService(domain, service, serviceData);
    },

    "url": data => {
        if (!data.config.url_path) {
            log("Missing 'url_path' for 'url' tap action");
            return;
        }

        window.location.href = data.config.url_path;
    }
}

export const handleAction = (data: IActionData, hass: HomeAssistant): void => {
    if (!data.config || data.config.action == <any>"none") {
        return;
    }

    if (!(data.config.action in nameToFuncMap)) {
        log("Unknown tap action type: " + data.config.action);
        return;
    }

    nameToFuncMap[data.config.action](data, hass);
}