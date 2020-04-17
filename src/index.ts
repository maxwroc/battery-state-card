import { HomeAssistant } from "./ha-types";
import { IBatteryStateCardConfig, IBatteryEntity, IBatteryViewData } from "./types";
import { LitElement } from "./lit-element";
import * as views from "./views";
import styles from "./styles";

let zzz = 0;

class BatteryStateCard extends LitElement {

    public config: IBatteryStateCardConfig;

    public states: number[];

    public displayNames: string[];

    public simpleView: boolean;

    public entities: IBatteryEntity[];

    static get properties() {
        return {
            states: [],
            displayNames: [],
            config: <IBatteryStateCardConfig>{}
        };
    }

    static get styles() {
        return styles;
    }

    setConfig(config) {
        if (!config.entities && !config.entity) {
            throw new Error("You need to define entities");
        }

        console.log(config);

        this.config = config;

        this.states = [];
        this.displayNames = [];

        this.entities = config.entity ? [config.entity] : <IBatteryEntity[]>config.entities;
        this.simpleView = !!config.entity;
        console.log(this.simpleView);
    }

    set hass(hass: HomeAssistant) {
        this.entities.forEach((entity, index) => {
            // make sure we have proper entity objects
            if (typeof (entity) === "string") {
                entity = { entity: entity };
            }

            const viewData = this.getViewData(entity, hass);
            this.states[index] = viewData.level;
            this.displayNames[index] = viewData.name;
        });
    }

    render() {
        console.log("render");

        if (this.simpleView) {
            return views.battery(this.states[0], this.displayNames[0])
        }

        return views.card(
            this.config.name || "Battery levels",
            this.states.map((state, index) =>
                views.battery(state, this.displayNames[index]))
        );
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return this.config.entities.length + 1;
    }

    private getViewData(batteryEntity: IBatteryEntity, hass: HomeAssistant): IBatteryViewData {
        const entityData = hass.states[batteryEntity.entity];
        if (!entityData) {
            return null;
        }

        const result = <IBatteryViewData>{
            name: batteryEntity.name || entityData.attributes.friendly_name,
            level: 0
        };

        if (batteryEntity.attribute) {
            result.level = entityData.attributes[batteryEntity.attribute]
        }
        else {
            const candidates: number[] = [
                entityData.attributes.battery_level,
                entityData.attributes.battery,
                entityData.state,
                0
            ];

            result.level = candidates.find(n => n !== null && !isNaN(n));
        }

        if (batteryEntity.multiplier) {
            result.level *= batteryEntity.multiplier;
        }

        return result;
    }
}

customElements.define("battery-state-card", <any>BatteryStateCard);