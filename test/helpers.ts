import { HomeAssistant } from "custom-card-helpers";
import { BatteryStateCard } from "../src/custom-elements/battery-state-card";
import { BatteryStateEntity } from "../src/custom-elements/battery-state-entity";
import { LovelaceCard } from "../src/custom-elements/lovelace-card";
import { throttledCall } from "../src/utils";

/**
 * Removing all custome elements
 */
afterEach(() => {
    ["battery-state-card", "battery-state-entity"].forEach(cardTagName => Array
        .from(document.body.getElementsByTagName(cardTagName))
        .forEach(elem => elem.remove()));
});

export class CardElements {
    constructor(private card: BatteryStateCard) {

    }

    get header() {
        return this.card.shadowRoot?.querySelector(".card-header .truncate")?.textContent?.trim();
    }

    get itemsCount() {
        return this.card.shadowRoot!.querySelectorAll(".card-content > * > battery-state-entity").length;
    }

    item(index: number) {
        const entity = this.card.shadowRoot!.querySelectorAll<BatteryStateEntity>(".card-content > * > battery-state-entity")[index];
        if (!entity) {
            throw new Error("Card element not found: " + index);
        }

        return new EntityElements(entity);
    }
}

export class EntityElements {
    constructor(private card: BatteryStateEntity) {

    }

    get icon() {
        return this.card.shadowRoot?.querySelector("ha-icon")?.getAttribute("icon")
    }

    get name() {
        return this.card.shadowRoot?.querySelector(".name")?.textContent?.trim();
    }

    get secondaryInfo() {
        return this.card.shadowRoot?.querySelector(".secondary")?.textContent?.trim();
    }

    get state() {
        return this.card.shadowRoot?.querySelector(".state")
            ?.textContent
            ?.trim()
            .replace(String.fromCharCode(160), " "); // replace non breakable space
    }
}


export class HomeAssistantMock<T extends LovelaceCard<any>> {

    private cards: LovelaceCard<any>[] = [];

    private hass: HomeAssistant = <any>{
        states: {},
        localize: jest.fn((key: string) => `[${key}]`)
    };

    private throttledUpdate = throttledCall(() => {
        this.cards.forEach(c => c.hass = this.hass);
    }, 0)

    addCard<K extends LovelaceCard<T>>(type: string, config: extractGeneric<T>): T {
        const elementName = type.replace("custom:", "");

        if (customElements.get(elementName) === undefined) {
            throw new Error("Card definition not found: " + elementName);
        }

        const card = <T>document.createElement(elementName);
        card.setConfig(config as T);
        card.hass = this.hass;

        document.body.appendChild(card);
        this.cards.push(card);

        return card;
    }

    addEntity(name: string, state?: string, attribs?: IEntityAttributes): IEntityMock {
        const entity = {
            entity_id: this.convertoToEntityId(name),
            state: state || "",
            attributes: {
                friendly_name: name,
                ...attribs
            },
            last_changed: "",
            last_updated: "",
            context: {
                id: "",
                user_id: null
            },
            setState: (state: string) => {
                this.hass.states[entity.entity_id].state = state;

                this.throttledUpdate();
                return entity;
            },
            setAttributes: (attribs: IEntityAttributes) => {
                this.hass.states[entity.entity_id].attributes = {
                    ...this.hass.states[entity.entity_id].attributes,
                    ...attribs
                };

                this.throttledUpdate();
                return entity;
            }
        };

        this.hass.states[entity.entity_id] = entity;

        return entity
    }

    convertoToEntityId(input: string) {
        return input.toLocaleLowerCase().replace(/[-\s]/g, "_")
    }
}

type extractGeneric<Type> = Type extends LovelaceCard<infer X> ? X : never


interface IEntityAttributes {
    [key: string]: string | number | undefined;
    friendly_name?: string;
    battery_level?: string;
    device_class?: string;
}

interface IEntityMock {
    readonly entity_id: string;
    setState(state: string): IEntityMock;
    setAttributes(attribs: IEntityAttributes): IEntityMock;
}