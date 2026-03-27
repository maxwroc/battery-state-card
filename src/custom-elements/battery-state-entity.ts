import { css } from "lit";
import { property } from "lit/decorators.js"
import { safeGetConfigObject } from "../utils";
import { batteryHtml, debugOutput } from "./battery-state-entity.views";
import { LovelaceCard } from "./lovelace-card";
import sharedStyles from "./shared.css"
import entityStyles from "./battery-state-entity.css";
import { handleAction } from "../handle-action";
import { getColorForBatteryLevel } from "../colors";
import { getSecondaryInfo } from "../entity-fields/get-secondary-info";
import { getChargingState } from "../entity-fields/charging-state";
import { getBatteryLevel } from "../entity-fields/battery-level";
import { getName } from "../entity-fields/get-name";
import { getIcon } from "../entity-fields/get-icon";
import { EntityRegistryEntry } from "../type-extensions";
import { RichStringProcessor } from "../rich-string-processor";
import { EntityDataAccessor, resolveSiblings } from "../entity-data-accessor";

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
     * Secondary information displayed below the name
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
     * Dynamic styles from custom style config
     */
    @property({ attribute: false })
    public dynamicStyles: string = "";

    /**
     * Tap action
     */
    @property({ attribute: false })
    public action: IAction | undefined;

    /**
     * Whether entity should not be shown
     */
    public isHidden: boolean | undefined;

    /**
     * Lazy-resolving data accessor for entity data
     */
    public accessor!: EntityDataAccessor;

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

        this.accessor = new EntityDataAccessor(this.hass!, this.config.entity);

        if (!this.accessor.state) {
            this.alert = {
                type: "warning",
                title: this.hass?.localize("ui.panel.lovelace.warning.entity_not_found", "entity", this.config.entity) || `Entity not available: ${this.config.entity}`,
            }

            return;
        }

        let siblings: ISiblingEntity[] = [];

        if (this.config.extend_entity_data !== false) {
            // Resolve siblings from device
            siblings = resolveSiblings(this.hass!, this.config.entity, this.accessor.entity?.device_id);
            this.accessor.setComputed("siblings", siblings);

            this.showEntity();
        }

        var { state, level, unit} = getBatteryLevel(this.config, this.hass!, this.accessor);
        this.state = state;
        this.unit = unit;
        this.stateNumeric = level;

        const isCharging = getChargingState(this.config, this.state, this.hass!, siblings);
        const chargingText = this.config.charging_state?.secondary_info_text || "Charging"; // todo: think about i18n
        const processor = new RichStringProcessor(this.accessor);
        this.accessor.setComputed("charging", {
            text: isCharging ? processor.process(chargingText) : "",
            is_active: isCharging,
        });

        this.accessor.setComputed("state", this.state);

        if (this.config.debug === true || this.config.debug === this.config.entity) {
            this.alert = {
                title: `Debug: ${this.config.entity}`,
                content: debugOutput(this.accessor.toDebugJSON()),
            }
        }

        this.name = getName(this.config, this.accessor);
        this.secondaryInfo = getSecondaryInfo(this.config, this.accessor);
        this.icon = getIcon(this.config, level, isCharging, this.accessor);
        this.iconColor = getColorForBatteryLevel(this.config, level, isCharging);
        this.dynamicStyles = this.config.style || "";
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

    hideEntity(): void {
        this.isHidden = true;
    }

    showEntity(): void {
        if (this.config.respect_visibility_setting !== false && (<EntityRegistryEntry>this.accessor?.entity)?.hidden) {
            // When entity is marked as hidden in the UI we should respect it
            this.isHidden = true;
            return;
        }

        this.isHidden = false;
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
                    handleAction(
                        this,
                        {
                            entity: this.config.entity,
                            tap_action: safeGetConfigObject(tapAction!, "action"),
                        },
                        "tap",
                        this.accessor,
                    );
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