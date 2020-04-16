import { LitElement, property, customElement, html, css } from "lit-element"
import { HomeAssistant } from "./ha-types";
import { CardConfig } from "./types";

@customElement("battery-state-card")
class BatteryStateCard extends LitElement {

    @property() public hass?: HomeAssistant;
    @property() public config?: CardConfig;

    constructor() {
        super();
    }

    render() {
        return html`
          <wired-card elevation="2">
            ${this.config.entities.map(ent => {
            const stateObj = this.hass.states[ent];
            return stateObj
                ? html`
                    <div class="state">
                      ${stateObj.attributes.friendly_name}
                      <wired-toggle
                        .checked="${stateObj.state === "on"}"
                        @change="${ev => this._toggle(stateObj)}"
                      ></wired-toggle>
                    </div>
                  `
                : html`
                    <div class="not-found">Entity ${ent} not found.</div>
                  `;
        })}
          </wired-card>
        `;
    }

    setConfig(config) {
        if (!config.entities) {
            throw new Error("You need to define entities");
        }

        this.config = config;
    }

    // The height of your card. Home Assistant uses this to automatically
    // distribute all cards over the available columns.
    getCardSize() {
        return this.config.entities.length + 1;
    }

    _toggle(state) {
        this.hass.callService("homeassistant", "toggle", {
            entity_id: state.entity_id
        });
    }

    static get styles() {
        return css`
          :host {
            font-family: "Gloria Hallelujah", cursive;
          }
          wired-card {
            background-color: white;
            padding: 16px;
            display: block;
            font-size: 18px;
          }
          .state {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            align-items: center;
          }
          .not-found {
            background-color: yellow;
            font-family: sans-serif;
            font-size: 14px;
            padding: 8px;
          }
          wired-toggle {
            margin-left: 8px;
          }
        `;
    }
}