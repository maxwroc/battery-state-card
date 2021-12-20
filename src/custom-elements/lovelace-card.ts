import { HomeAssistant } from "custom-card-helpers";
import { LitElement, TemplateResult } from "lit";
import { throttledCall } from "../utils";

/**
 * Lovelace UI component/card base
 */
export abstract class LovelaceCard<TConfig> extends LitElement {

    /**
     * HomeAssistant object
     */
    private _hass: HomeAssistant | undefined;

    /**
     * Component/card config
     */
    protected config: TConfig;

    /**
     * Queue of the collbacks to call after next update
     */
    private updateNotifyQueue: { (): void }[] = [];

    /**
     * Whether config has been updated since the last internalUpdate call
     */
    private configUpdated = false;

    /**
     * Whether hass has been updated since the last internalUpdate call
     */
    private hassUpdated = false;

    /**
     * Safe update triggering function
     * 
     * It happens quite often that setConfig or hassio setter are called few times 
     * in the same execution path. We want to throttle such updates and handle just 
     * the last one.
     */
    private triggerUpdate = throttledCall(() => {
        this.internalUpdate(this.configUpdated, this.hassUpdated);
        this.configUpdated = false;
        this.hassUpdated = false;
        this.updateNotifyQueue.forEach(n => n());
        this.updateNotifyQueue = [];
    }, 100);

    /**
     * HomeAssistant object setter
     */
    set hass(hass: HomeAssistant | undefined) {
        this._hass = hass;
        this.hassUpdated = true;
        this.triggerUpdate();
    }

    /**
     * HomeAssistant object getter
     */
    get hass(): HomeAssistant | undefined {
        return this._hass;
    }

    /**
     * Helper getter to wait for an update to finish
     */
    get cardUpdated() {
        return new Promise<void>((resolve) => this.updateNotifyQueue.push(resolve));
    }

    /**
     * Func for setting card configuration
     * @param config Card config
     */
    setConfig(config: TConfig): void {
        // the original config is immutable
        this.config = JSON.parse(JSON.stringify(config));
        this.configUpdated = true;
        this.triggerUpdate();
    };

    /**
     * Handler called when updated happened
     * @param config Whether config has been updated since the last call
     * @param hass Whetther hass has been updated since the last call
     */
    abstract internalUpdate(config: boolean, hass:boolean): void;

    abstract render(): TemplateResult<1>;
}