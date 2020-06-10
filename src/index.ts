import { HomeAssistant } from "./ha-types";
import { IBatteryStateCardConfig } from "./types";
import { LitElement, LitHtml } from "./lit-element";
import * as views from "./views";
import styles from "./styles";
import { ActionFactory } from "./action";
import { BatteryProvider } from "./battery-provider";

/**
 * Card main class.
 */
class BatteryStateCard extends LitElement {

    /**
     * Raw config used to check if there were changes.
     */
    private rawConfig: string = "";

    /**
     * Card configuration.
     */
    public config: IBatteryStateCardConfig = <any>{};

    /**
     * Whether we should render it as an entity - not a card.
     */
    public simpleView: boolean = false;

    /**
     * Battery provider for battery view models.
     */
    private batteryProvider: BatteryProvider = <any>null;

    /**
     * CSS for the card
     */
    static get styles() {
        return styles;
    }

    /**
     * Called by HA on init or when configuration is updated.
     *
     * @param config Card configuration
     */
    setConfig(config: IBatteryStateCardConfig) {
        if (!config.entities && !config.entity && !config.filter?.include) {
            throw new Error("You need to define entities or filter.include");
        }

        // check for changes
        const rawConfig = JSON.stringify(config);
        if (this.rawConfig === rawConfig) {
            // no changes so stop processing
            return;
        }

        this.rawConfig = rawConfig;

        // config is readonly and we want to apply default values so we need to recreate it
        this.config = JSON.parse(rawConfig);

        this.simpleView = !!this.config.entity;

        this.batteryProvider = new BatteryProvider(this.config, this);

        // always render initial state, even though we don't have values yet
        this.requestUpdate();
    }

    /**
     * Called when HA state changes (very often).
     */
    set hass(hass: HomeAssistant) {

        ActionFactory.hass = hass;

        // to improve perf we release the task/thread
        setTimeout(() => {
            const updated = this.batteryProvider.update(hass);
            if (updated) {
                // trigger rendering
                this.requestUpdate();
            }
        }, 0);
    }

    /**
     * Renders the card. Called when update detected.
     */
    render() {

        const viewData = this.batteryProvider.getBatteries();

        // check if we should render it without card container
        if (this.simpleView) {
            return views.battery(viewData.batteries[0]);
        }

        let renderedViews: LitHtml[] = [];

        viewData.batteries.forEach(b => !b.is_hidden && renderedViews.push(views.battery(b)));

        viewData.groups.forEach(g => {
            const renderedBatteries: LitHtml[] = [];
            g.batteries.forEach(b => !b.is_hidden && renderedBatteries.push(views.battery(b)));
            if (renderedBatteries.length) {
                renderedViews.push(views.collapsableWrapper(renderedBatteries, g));
            }
        });

        if (renderedViews.length == 0) {
            return views.empty();
        }

        return views.card(
            this.config.name || this.config.title,
            renderedViews
        );
    }

    /**
     * Gets the height of your card.
     *
     * Home Assistant uses this to automatically distribute all cards over
     * the available columns. One is equal 50px.
     */
    getCardSize() {
        let size = this.config.entities?.length || 1;

        if (this.config.collapse) {
            if (typeof this.config.collapse == "number") {
                // +1 to account the expand button
                return this.config.collapse + 1;
            }
            else {
                return this.config.collapse.length + 1;
            }
        }

        // +1 to account header
        return size + 1;
    }
}

// Registering card
customElements.define("battery-state-card", <any>BatteryStateCard);