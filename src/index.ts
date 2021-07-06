import { LitElement, TemplateResult } from "lit-element";
import { HomeAssistant } from "./ha-types";
import { IBatteryStateCardConfig } from "./types";
import * as views from "./views";
import styles from "./styles";
import { ActionFactory } from "./action";
import { BatteryProvider } from "./battery-provider";
import { processStyles, throttledCall } from "./utils";

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
    private config: IBatteryStateCardConfig = <any>{};

    /**
     * Whether we should render it as an entity - not a card.
     */
    private simpleView: boolean = false;

    /**
     * Battery provider for battery view models.
     */
    private batteryProvider: BatteryProvider = <any>null;

    /**
     * Custom styles comming from config.
     */
    private cssStyles: string = "";

    /**
     * Triggers rendering in a safe way
     *
     * @description Overtriggering UI update can cause rendering issues (see #111)
     */
    private triggerRender = throttledCall(() => this.requestUpdate(), 100);

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
        if (!config.entities &&
            !config.entity &&
            !config.filter?.include &&
            !Array.isArray(config.collapse)) {
            throw new Error("You need to define entities, filter.include or collapse.group");
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

        // rendering in case we won't get state update
        this.triggerRender();
    }

    /**
     * Called when HA state changes (very often).
     */
    set hass(hass: HomeAssistant) {

        ActionFactory.hass = hass;

        const updated = this.batteryProvider.update(hass);
        if (updated) {
            this.triggerRender();
        }
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

        let renderedViews: TemplateResult[] = [];

        viewData.batteries.forEach(b => !b.is_hidden && renderedViews.push(views.battery(b)));

        viewData.groups.forEach(g => {
            const renderedBatteries: TemplateResult[] = [];
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
            renderedViews,
        );
    }

    /**
     * Called just after the update is finished (including rendering)
     */
    updated() {
        if (!this.config?.style || this.cssStyles == this.config.style) {
            return;
        }

        this.cssStyles = this.config.style;

        let styleElem = this.shadowRoot!.querySelector("style");
        if (!styleElem) {
            styleElem = document.createElement("style");
            styleElem.type = 'text/css'
            this.shadowRoot!.appendChild(styleElem);
        }

        // prefixing all selectors
        styleElem.innerHTML = processStyles("ha-card", this.cssStyles);
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