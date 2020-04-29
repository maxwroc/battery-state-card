import { IActionConfig, IBatteryEntity, SupportedActions } from "./types"
import { HomeAssistant } from "./ha-types"
import { log } from "./utils";

export interface IAction {
    (evt: Event): void
}

interface IActionData {
    config: IActionConfig
    card: Node;
    entity: IBatteryEntity
}

const nameToFuncMap: { [key in SupportedActions]: (data: IActionData) => void } = {

    "more-info": (data: IActionData) => {
        const evt = <any>new Event('hass-more-info', { composed: true });
        evt.detail = { entityId: data.entity.entity };
        data.card.dispatchEvent(evt);
    },

    "navigate": (data: IActionData) => {
        if (!data.config.navigation_path) {
            log("Missing 'navigation_path' for 'navigate' tap action");
            return;
        }

        window.history.pushState(null, "", data.config.navigation_path);
        const evt = <any>new Event("location-changed", { composed: true });
        evt.detail = { replace: false };
        window.dispatchEvent(evt);
    },

    "call-service": (data: IActionData) => {
        if (!data.config.service) {
            log("Missing 'service' for 'call-service' tap action");
            return;
        }

        const [domain, service] = data.config.service.split(".", 2);
        const serviceData = { ...data.config.service_data };
        ActionFactory.hass.callService(domain, service, serviceData);
    },

    "url": data => {
        if (!data.config.url_path) {
            log("Missing 'url_path' for 'url' tap action");
            return;
        }

        window.location.href = data.config.url_path;
    }
}

/**
 * Helper class for creating actions - tap/click handlers.
 */
export class ActionFactory {

    /**
     * Home assistant object.
     *
     * Updated whenever HA sets it on main card object.
     */
    static hass: HomeAssistant;

    /**
     * Returns action for given action data.
     *
     * @param data Action data object
     */
    static getAction(data: IActionData): IAction | null {
        if (!data.config || data.config.action == <any>"none") {
            return null;
        }

        return evt => {
            evt.stopPropagation();

            if (!(data.config.action in nameToFuncMap)) {
                log("Unknown tap action type: " + data.config.action);
                return;
            }

            nameToFuncMap[data.config.action](data);
        }
    }
}