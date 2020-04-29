import { HomeAssistant } from "./ha-types";
import { IBatteryStateCardConfig, IBatteryEntity } from "./types";
import { LitElement } from "./lit-element";
import { log } from "./utils";
import BatteryViewModel from "./battery-vm";
import * as views from "./views";
import styles from "./styles";
import { ActionFactory } from "./action";

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
     * Properties defined here are used by Polymer to detect
     * changes and update card UI.
     */
    static get properties() {
        return {
            batteries: Array,
            config: Object
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
        if (!config.entities && !config.entity) {
            throw new Error("You need to define entities");
        }

        // check for changes
        const rawConfig = JSON.stringify(config);
        if (this.rawConfig === rawConfig) {
            // no changes so stop processing
            return;
        }

        this.rawConfig = rawConfig;

        this.config = config;
        this.simpleView = !!config.entity;

        let entities = config.entity
            ? [config]
            : config.entities!.map((entity: string | IBatteryEntity) => {
                // check if it is just the id string
                if (typeof (entity) === "string") {
                    entity = <IBatteryEntity>{ entity: entity };
                }

                return entity;
            });

        this.batteries = entities.map(entity =>
            new BatteryViewModel(
                entity,
                this.config,
                ActionFactory.getAction({
                    card: <any>this,
                    config: entity.tap_action || this.config.tap_action || <any>null,
                    entity: entity
                })
            )
        );
    }

    /**
     * Called when HA state changes (very often).
     */
    set hass(hass: HomeAssistant) {

        ActionFactory.hass = hass;

        let updated = false;
        this.batteries.forEach((battery, index) => {
            battery.update(hass);
            updated = updated || battery.updated;
        });

        if (updated) {
            switch (this.config.sort_by_level) {
                case "asc":
                    this.batteries.sort((a, b) => this.sort(a.level, b.level));
                    break;
                case "desc":
                    this.batteries.sort((a, b) => this.sort(b.level, a.level));
                    break;
                default:
                    if (this.config.sort_by_level) {
                        log("Unknown sort option. Allowed values: 'asc', 'desc'");
                    }
            }

            // trigger the update
            this.batteries = [...this.batteries];
        }
    }

    /**
     * Renders the card. Called when update detected.
     */
    render() {
        // check if we should render it without card container
        if (this.simpleView) {
            return views.battery(this.batteries[0]);
        }

        const batteryViews = this.batteries.map(battery => views.battery(battery));

        return views.card(
            this.config.name,
            this.config.collapse ? [ views.collapsableWrapper(batteryViews, this.config.collapse) ] : batteryViews
        );
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
            size = this.config.collapse + 1;
        }

        // +1 to account header
        return size + 1;
    }

    /**
     * Sorting function for battery levels which can have "Unknown" state.
     * @param a First value
     * @param b Second value
     */
    private sort(a: string, b: string): number {
        let aNum = Number(a);
        let bNum = Number(b);
        aNum = isNaN(aNum) ? -1 : aNum;
        bNum = isNaN(bNum) ? -1 : bNum;
        return aNum - bNum;
    }
}

// Registering card
customElements.define("battery-state-card", <any>BatteryStateCard);