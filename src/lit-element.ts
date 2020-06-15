
declare var LitElement: ILitElement;

/**
 * We're reusing LitElement from other exisitng component this way we don't need to include it in our bundle.
 *
 * Maybe in the future LitElement will be globally available but currently only Polymer.Element is there.
 */
var LitElement = LitElement || Object.getPrototypeOf(customElements.get("home-assistant-main"));
const { html, css } = LitElement.prototype as { html: LitHtml, css: any };

export type LitHtml = Function;
type ChangedProperties = { [propertyName: string]: any };

interface ILitElement extends HTMLElement {
    new(): ILitElement;
    requestUpdate(): Promise<void>;
    requestUpdate(propertyName: string, oldValue: any): Promise<void>;
    shouldUpdate(changedProperties: ChangedProperties): boolean;
    update(changedProperties: ChangedProperties): void;
    firstUpdated(changedProperties: ChangedProperties): void;
    updated(changedProperties: ChangedProperties): void;
    updateComplete(): Promise<boolean>;
    render(): LitHtml;
}

export {
    LitElement,
    html,
    css
}