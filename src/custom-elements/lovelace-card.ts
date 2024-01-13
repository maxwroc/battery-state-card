import { LitElement, TemplateResult, html } from "lit";
import { HomeAssistantExt } from "../type-extensions";
import { throttledCall } from "../utils";
import { property } from "lit/decorators.js"

/**
 * Lovelace UI component/card base
 */
export abstract class LovelaceCard<TConfig> extends LitElement {

    /**
     * Error
     */
    @property({ attribute: false })
    public error: Error | undefined;

    /**
     * HomeAssistant object
     */
    private _hass: HomeAssistantExt | undefined;

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
    private triggerUpdate = throttledCall(async () => {

        try {
            await this.internalUpdate(this.configUpdated, this.hassUpdated);
            this.error = undefined;
        }
        catch (e: unknown) {
            if (typeof e === "string") {
                this.error = { message: e, name: "" };
            }
            else if (e instanceof Error) {
                this.error = e;
            }
        }

        if (this.configUpdated) {
            // always rerender when config has changed
            this.requestUpdate();
        }

        this.configUpdated = false;
        this.hassUpdated = false;
        this.updateNotifyQueue.forEach(n => n());
        this.updateNotifyQueue = [];
    }, 100);

    /**
     * HomeAssistant object setter
     */
    set hass(hass: HomeAssistantExt | undefined) {
        this._hass = hass;
        this.hassUpdated = true;
        this.triggerUpdate();
    }

    /**
     * HomeAssistant object getter
     */
    get hass(): HomeAssistantExt | undefined {
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
    abstract internalUpdate(config: boolean, hass:boolean): Promise<void>;

    /**
     * Handler called when render was triggered and updated HTML template is required
     */
    abstract internalRender(): TemplateResult<1>;

    /**
     * Handler called when exception was caught to let know the card
     */
    abstract onError(): void;

    render(): TemplateResult<1> {
        if (this.error) {
            this.onError();
            return errorHtml(this.tagName, "Exception: " + this.error.message, this.error.stack);
        }

        return this.internalRender();
    }
}

const errorHtml = (cardName: string, message: string, content: string | undefined) => html`
<ha-alert alert-type="error" title="${cardName}">
    <p>
        <strong>${message}</strong>
    <p>
    <ol>
        <li>
            Please check if the problem was reported already<br />
            Click <a target="_blank" href="https://github.com/maxwroc/battery-state-card/issues?q=is%3Aissue+is%3Aopen+${encodeURIComponent(message)}">here</a> to search
        </li>
        <li>
            If it wasn't please consider creating one<br />
            Click <a target="_blank" href="https://github.com/maxwroc/battery-state-card/issues/new?assignees=&labels=bug&projects=&template=bug_report.md&title=${encodeURIComponent(message)}">here</a> to create<br />
            Please copy-paste the below stack trace.
        </li>
    </ol>
    <pre>${content}</pre>
</ha-alert>
`;