import { css } from "lit";
import { property } from "lit/decorators.js"
import { isNumber, safeGetConfigObject } from "../utils";
import { batteryHtml } from "./battery-state-entity.views";
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
    public secondaryInfo: string | Date;

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
     * Entity CSS styles
     */
    public static get styles() {
        return css(<any>[sharedStyles + entityStyles]);
    }

    async internalUpdate() {
        this.name = getName(this.config, this.hass);
        this.state = getBatteryLevel(this.config, this.hass);
        if (isNumber(this.state)) {
            this.unit = String.fromCharCode(160) + (this.config.unit || "%");
        }
        else {
            this.unit = undefined;
        }

        const isCharging = getChargingState(this.config, this.state, this.hass);
        this.secondaryInfo = getSecondaryInfo(this.config, this.hass, isCharging);
        this.icon = getIcon(this.config, Number(this.state), isCharging, this.hass);
        this.iconColor = getColorForBatteryLevel(this.config, this.state, isCharging);
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

    render() {
        return batteryHtml(this);
    }

    /**
     * Adding or removing action
     * @param enable Whether to enable/add the tap action
     */
    private setupAction(enable: boolean = true) {
        if (enable) {
            if (this.config.tap_action && !this.action) {
                this.action = evt => {
                    evt.stopPropagation();
                    handleAction({
                        card: this,
                        config: safeGetConfigObject(this.config.tap_action!, "action"),
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
}