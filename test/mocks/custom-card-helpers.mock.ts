export interface HomeAssistant {
    localize: (key: string, ...args: any[]) => string;
    states: { [entity_id: string]: any };
    formatEntityState?: (entity: any) => string;
    formatEntityAttributeValue?: (entity: any, attribute: string) => string;
    [key: string]: any;
}

export const fireEvent = (node: HTMLElement | Window, type: string, detail?: any, options?: any) => {
    const event = new CustomEvent(type, {
        detail,
        bubbles: options?.bubbles !== false,
        cancelable: options?.cancelable !== false,
        composed: options?.composed !== false,
    });
    node.dispatchEvent(event);
    return event;
};

export const hasConfigOrEntityChanged = (element: any, changedProps: any) => true;

export const createThing = () => ({});

export const handleAction = () => {};

export const handleClick = () => {};

export const navigate = () => {};

export const forwardHaptic = () => {};

export const getLovelace = () => ({
    setEditMode: () => {},
});