
/**
 * We're reusing LitElement from other exisitng component this way we don't need to include it in our bundle.
 *
 * Maybe in the future LitElement will be globally available but currently only Polymer.Element is there.
 */
var LitElement: any = LitElement || Object.getPrototypeOf(customElements.get("home-assistant-main"));
var { html, css } = LitElement.prototype;

export {
    LitElement,
    html,
    css
}