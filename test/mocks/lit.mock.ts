export const LitElement = class {
    static styles = [];
    static get properties() { return {}; }
    connectedCallback() {}
    disconnectedCallback() {}
    requestUpdate() {}
    render() { return ''; }
    updated() {}
    firstUpdated() {}
};

export const html = (strings: TemplateStringsArray, ...values: any[]) => {
    return strings.reduce((acc, str, i) => {
        return acc + str + (values[i] || '');
    }, '');
};

export const css = (strings: TemplateStringsArray, ...values: any[]) => {
    return strings.reduce((acc, str, i) => {
        return acc + str + (values[i] || '');
    }, '');
};

export const svg = html;
export const nothing = '';
export const unsafeCSS = (value: string) => value;
export const property = (options?: any) => (target: any, propertyKey: string) => {};
export const customElement = (tagName: string) => (target: any) => {};
export const state = (options?: any) => (target: any, propertyKey: string) => {};
export const query = (selector: string) => (target: any, propertyKey: string) => {};