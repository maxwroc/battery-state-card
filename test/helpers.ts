import { BatteryStateCard } from "../src/custom-elements/battery-state-card";
import { BatteryStateEntity } from "../src/custom-elements/battery-state-entity";
import { LovelaceCard } from "../src/custom-elements/lovelace-card";
import { DeviceRegistryEntry, EntityRegistryDisplayEntry, HomeAssistantExt, AreaRegistryEntry } from "../src/type-extensions";
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

    get groupsCount() {
        return this.card.shadowRoot!.querySelectorAll(".card-content > .expandWrapper").length;
    }

    get items(): EntityElements[] {
        const result: EntityElements[] = [];
        for (let index = 0; index < this.itemsCount; index++) {
            result.push(this.item(index));
        }

        return result;
    }

    get groups(): GroupElement[] {
        const result: GroupElement[] = [];
        for (let index = 0; index < this.groupsCount; index++) {
            result.push(this.group(index));
        }

        return result;
    }

    item(index: number) {
        const entity = this.card.shadowRoot!.querySelectorAll<BatteryStateEntity>(".card-content > * > battery-state-entity")[index];
        if (!entity) {
            throw new Error("Card element not found: " + index);
        }

        return new EntityElements(entity);
    }

    group(index: number) {
        const group = this.card.shadowRoot!.querySelectorAll<BatteryStateEntity>(".card-content > .expandWrapper")[index];
        if (!group) {
            throw new Error("Group element not found: " + index);
        }

        return new GroupElement(group);
    }
}

export class EntityElements {

    private root: HTMLElement;

    constructor(private card: BatteryStateEntity, isShadowRoot: boolean = true) {
        this.root = isShadowRoot ? <any>card.shadowRoot! : card;
    }

    get iconName() {
        return this.root.querySelector("ha-icon")?.getAttribute("icon");
    }

    get nameText() {
        return this.root.querySelector(".name")?.textContent?.trim();
    }

    get secondaryInfo() {
        return this.root.querySelector(".secondary");
    }

    get secondaryInfoText() {
        return this.secondaryInfo?.textContent?.trim();
    }

    get stateText() {
        return this.root.querySelector(".state")
            ?.textContent
            ?.trim()
            .replace(String.fromCharCode(160), " "); // replace non breakable space
    }
}

export class GroupElement extends EntityElements {
    constructor(private elem: HTMLElement) {
        super(<BatteryStateEntity>elem.querySelector(".toggler"), false);
    }

    private get batteryNodes(): NodeListOf<BatteryStateEntity> {
        return this.elem.querySelectorAll<BatteryStateEntity>(".groupItems > * > battery-state-entity");
    }

    get itemsCount() {
        return this.batteryNodes.length;
    }

    get items(): EntityElements[] {
        const result: EntityElements[] = [];
        for (let index = 0; index < this.itemsCount; index++) {
            result.push(this.item(index));
        }

        return result;
    }

    item(index: number): EntityElements {
        const entity = this.batteryNodes[index];
        if (!entity) {
            throw new Error("Card element not found: " + index);
        }

        return new EntityElements(entity);
    }
}


export class HomeAssistantMock<T extends LovelaceCard<any>> {

    private cards: LovelaceCard<any>[] = [];

    public hass: HomeAssistantExt = <any>{
        states: {},
        localize: jest.fn((key: string) => `[${key}]`),
        formatEntityState: jest.fn((entityData: any) => `${entityData.state} %`),
    };

    private throttledUpdate = throttledCall(() => {
        this.cards.forEach(c => c.hass = this.hass);
    }, 0);

    constructor(disableCardUpdates?: boolean) {
        if (disableCardUpdates) {
            this.throttledUpdate = () => {};
        }
    }

    mockFunc(funcName: keyof HomeAssistantExt, mockedFunc: Function) {
        (<any>this.hass)[funcName] = jest.fn(<any>mockedFunc)
    }

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

    addEntity(name: string, state?: string, attribs?: IEntityAttributes, domain?: string): IEntityMock {
        const entity = {
            entity_id: convertoToEntityId(name, domain),
            state: state || "",
            attributes: {
                friendly_name: name,
                ...attribs
            },
            last_changed: "",
            last_updated: "",
            context: {
                id: "",
                user_id: null,
                parent_id: null,
            },
            setState: (state: string) => {
                this.hass.states[entity.entity_id].state = state;

                this.throttledUpdate();
                return entity;
            },
            setAttributes: (attribs: IEntityAttributes) => {

                if (attribs === null) {
                    this.hass.states[entity.entity_id].attributes = <any>undefined;
                    return entity;
                }

                this.hass.states[entity.entity_id].attributes = {
                    ...this.hass.states[entity.entity_id].attributes,
                    ...attribs
                };

                this.throttledUpdate();
                return entity;
            },
            setLastUpdated: (val: string) => {
                entity.last_updated = val;
                this.throttledUpdate();
            },
            setLastChanged: (val: string) => {
                entity.last_changed = val;
                this.throttledUpdate();
            },
            setProperty: <K extends keyof HaEntityPropertyToTypeMap>(name: K, val: HaEntityPropertyToTypeMap[K]) => {
                (<any>entity)[name] = val;
            }
        };

        this.hass.states[entity.entity_id] = entity;

        return entity
    }
}


export const convertoToEntityId = (input: string, domain?: string) => {
    return (domain ? domain + "." : "") + input.toLocaleLowerCase().replace(/[-\s]/g, "_");
}

type extractGeneric<Type> = Type extends LovelaceCard<infer X> ? X : never


interface IEntityAttributes {
    [key: string]: any;
    friendly_name?: string;
    battery_level?: string;
    battery?: string;
    device_class?: string;
}

interface IEntityMock {
    readonly entity_id: string;
    readonly state: string;
    setState(state: string): IEntityMock;
    setAttributes(attribs: IEntityAttributes | null): IEntityMock;
    setLastUpdated(val: string): void;
    setLastChanged(val: string): void;
    setProperty<K extends keyof HaEntityPropertyToTypeMap>(name: K, val: HaEntityPropertyToTypeMap[K]): void;
}

interface HaEntityPropertyToTypeMap {
    "display": EntityRegistryDisplayEntry,
    "device": DeviceRegistryEntry,
    "area": AreaRegistryEntry,
}