import { css } from "lit";
import { property } from "lit/decorators.js"
import { safeGetConfigObject } from "../utils";
import { batteryHtml, debugOutput } from "./battery-state-entity.views";
import { LovelaceCard } from "./lovelace-card";
import sharedStyles from "./shared.css"
import entityStyles from "./battery-state-entity.css";
import { handleAction } from "../action";
import { getColorForBatteryLevel } from "../colors";
import { getSecondaryInfo } from "../entity-fields/get-secondary-info";
import { getChargingState } from "../entity-fields/charging-state";
import { getBatteryLevel } from "../entity-fields/battery-level";
import { getName } from "../entity-fields/get-name";
import { getIcon } from "../entity-fields/get-icon";
import { DeviceRegistryEntry } from "../type-extensions";

/**
 * Battery entity element
 */
export class BatteryStateEntity extends LovelaceCard<IBatteryEntityConfig> {

    /**
     * Name
     */
    @property({ attribute: false })
    public name: string;

    /**
     * Secondary information displayed undreneath the name
     */
    @property({ attribute: false })
    public secondaryInfo: string;

    /**
     * Entity state / battery level
     */
    @property({ attribute: false })
    public state: string;

    /**
     * Unit
     */
    @property({ attribute: false })
    public unit: string | undefined;

    /**
     * Entity icon
     */
    @property({ attribute: false })
    public icon: string;

    /**
     * Entity icon color
     */
    @property({ attribute: false })
    public iconColor: string;

    /**
     * Tap action
     */
    @property({ attribute: false })
    public action: IAction | undefined;

    /**
     * Raw entity data
     */
    public entityData: IMap<any> = {};

    /**
     * Numeric representation of the state
     */
    public stateNumeric: number | undefined;

    /**
     * Entity CSS styles
     */
    public static get styles() {
        return css(<any>[sharedStyles + entityStyles]);
    }

    async internalUpdate() {
        this.entityData = <any>{
            ...this.hass?.states[this.config.entity]
        };

        if (this.config.extend_entity_data !== false) {
            this.extendEntityData();
        }

        if (this.config.debug === true || this.config.debug === this.config.entity) {
            this.alert = {
                title: `Debug: ${this.config.entity}`,
                content: debugOutput(JSON.stringify(this.entityData, null, 2)),
            }
        }

        var { state, level, unit} = getBatteryLevel(this.config, this.hass, this.entityData);
        this.state = state;
        this.unit = unit;
        this.stateNumeric = level;

        const isCharging = getChargingState(this.config, this.state, this.hass);
        this.entityData["charging"] = isCharging ? (this.config.charging_state?.secondary_info_text || "Charging") : "" // todo: think about i18n

        this.name = getName(this.config, this.hass, this.entityData);
        this.secondaryInfo = getSecondaryInfo(this.config, this.hass, this.entityData);
        this.icon = getIcon(this.config, level, isCharging, this.hass);
        this.iconColor = getColorForBatteryLevel(this.config, level, isCharging);
    }

    connectedCallback() {
        super.connectedCallback();
        // enable action if configured
        this.setupAction(true);
    }

    disconnectedCallback() {
        super.disconnectedCallback();
        // disabling action if exists
        this.setupAction(false);
    }

    internalRender() {
        return batteryHtml(this);
    }

    onError(): void {
    }

    /**
     * Adding or removing action
     * @param enable Whether to enable/add the tap action
     */
    private setupAction(enable: boolean = true) {
        if (enable && !this.error && !this.alert) {
            let tapAction = this.config.tap_action || "more-info";
            if (tapAction != "none" && !this.action) {
                this.action = evt => {
                    evt.stopPropagation();
                    handleAction({
                        card: this,
                        config: safeGetConfigObject(tapAction, "action"),
                        entityId: this.config.entity,
                    }, this.hass!);
                }

                this.addEventListener("click", this.action);
                this.classList.add("clickable");
            }
        }
        else {
            if (this.action) {
                this.classList.remove("clickable");
                this.removeEventListener("click", this.action);
                this.action = undefined;
            }
        }
    }

    /**
     * Adds display, device and area objects to entityData
     */
    private extendEntityData(): void {

        if (!this.hass) {
            return;
        }

        const entityDisplayEntry = this.hass.entities && this.hass.entities[this.config.entity];

        if (entityDisplayEntry) {
            this.entityData["display"] = entityDisplayEntry;
            this.entityData["device"] = entityDisplayEntry.device_id
                ? this.hass.devices && this.hass.devices[entityDisplayEntry.device_id]
                : undefined;

            const area_id = entityDisplayEntry.area_id || (<DeviceRegistryEntry>this.entityData["device"])?.area_id;
            if (area_id) {
                this.entityData["area"] = this.hass.areas && this.hass.areas[area_id];
            }
        }
    }
}