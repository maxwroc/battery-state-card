import { HomeAssistant } from "custom-card-helpers";
import { LitElement, TemplateResult } from "lit";
import { throttledCall } from "../utils";

export abstract class LovelaceCard<TConfig> extends LitElement {

    private _hass: HomeAssistant | undefined;

    protected config: TConfig;

    private updateNotifyQueue: { (): void }[] = [];

    private triggerUpdate = throttledCall(() => {
        this.internalUpdate();
        this.updateNotifyQueue.forEach(n => n());
        this.updateNotifyQueue = [];
    }, 100);

    set hass(hass: HomeAssistant | undefined) {
        this._hass = hass;
        this.triggerUpdate();
    }

    get hass(): HomeAssistant | undefined {
        return this._hass;
    }

    get cardUpdated() {
        return new Promise<void>((resolve) => this.updateNotifyQueue.push(resolve));
    }

    setConfig(config: TConfig): void {
        // the original config is immutable
        this.config = JSON.parse(JSON.stringify(config));
        this.triggerUpdate();
    };

    abstract internalUpdate(): void;

    abstract render(): TemplateResult<1>;
}