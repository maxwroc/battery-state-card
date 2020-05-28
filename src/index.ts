import { HomeAssistant } from "./ha-types";
import { IBatteryStateCardConfig, ICollapsingGroups } from "./types";
import { LitElement } from "./lit-element";
import BatteryViewModel from "./battery-vm";
import * as views from "./views";
import styles from "./styles";
import { ActionFactory } from "./action";
import { BatteryProvider } from "./battery-provider";
import { log } from "./utils";
import { getRenderedGroups } from "./grouping";

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
     * Battery objects to track.
     */
    public batteries: BatteryViewModel[] = [];

    /**
     * Battery provider for battery view models.
     */
    private batteryProvider: BatteryProvider = <any>null;

    /**
     * Properties defined here are used by Polymer to detect
     * changes and update card UI.
     */
    static get properties() {
        return {
            batteries: Array
        };
    }

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
        this.batteries = this.batteryProvider.getBatteries()
    }

    /**
     * Called when HA state changes (very often).
     */
    set hass(hass: HomeAssistant) {

        ActionFactory.hass = hass;

        // to improve perf we release the task/thread
        setTimeout(() => this.batteries = this.batteryProvider.getBatteries(hass), 0);
    }

    /**
     * Renders the card. Called when update detected.
     */
    render() {
        // check if we should render it without card container
        if (this.simpleView) {
            return views.battery(this.batteries[0]);
        }

        const batteries = this.batteries.filter(battery => !battery.is_hidden);

        // filer cards (entity-filter) can produce empty collection
        if (batteries.length == 0) {
            // don't render anything
            return views.empty();
        }

        return views.card(
            this.config.name || this.config.title,
            this.getBatteryViews(batteries)
        );
    }

    getBatteryViews(batteries: BatteryViewModel[]): any[] {
        if (!this.config.collapse) {
            // collapsing is off so we return flat list
            return batteries.map(battery => views.battery(battery));
        }

        return getRenderedGroups(this.config.collapse, batteries);
    }

    /**
     * Gets the height of your card.
     *
     * Home Assistant uses this to automatically distribute all cards over
     * the available columns. One is equal 50px.
     */
    getCardSize() {
        let size = this.batteries.length;

        if (this.config.collapse) {
            // +1 to account the expand button
            size = typeof(this.config.collapse) == "number" ? this.config.collapse + 1 : size + 1;
        }

        // +1 to account header
        return size + 1;
    }
}

// Registering card
customElements.define("battery-state-card", <any>BatteryStateCard);