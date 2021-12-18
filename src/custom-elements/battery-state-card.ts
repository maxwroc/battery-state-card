import { css, CSSResult, TemplateResult } from "lit"
import { IBatteryStateCardConfig } from "../types";
import { LovelaceCard } from "./lovelace-card";
import styles from "./battery-state-card.css"
import { property } from "lit/decorators.js";
import { BatteryStateEntity } from "./battery-state-entity";
import { cardHtml } from "./battery-state-card.views";
import { HomeAssistant } from "custom-card-helpers";


export class BatteryStateCard extends LovelaceCard<IBatteryStateCardConfig> {

    @property({attribute: false})
    public header: string | undefined;

    @property({attribute:false})
    public list: number[] = [];

    @property({attribute: false})
    public groups: IBatteryGroup[] = [];

    /**
     * Not sorted nor groupped batteries
     */
    public batteries: IIndexedBatteryEntity[] = [];

    static get styles(): CSSResult {
        return css(<any>[styles]);
    }

    async internalUpdate() {

        this.header = this.config.title;

        // handle config change - added more batteries etc
        if (this.batteries.length == 0) {
            this.batteries = initBatteries(this.config, this.hass!);
        }

        // updating all batteries
        const updateComplete = this.batteries.map((b, i) => {
            b.index = i;
            b.setConfig(this.config.entities[i]);
            b.hass = this.hass;
            return b.cardUpdated;
        });

        await Promise.all(updateComplete);

        const indexes = getIndexesOfSortedBatteries(this.config, this.batteries);

        this.list = indexes;

        const groups: IBatteryGroup[] = [];
        groups.push({
            indexes: indexes
        });

        if (JSON.stringify(groups) != JSON.stringify(this.groups)) {
            this.groups = groups;
        }
    }

    render(): TemplateResult<1> {
        return cardHtml(this);
    }
}

interface IBatteryGroup {
    title?: string;
    secondaryInfo?: string;
    icon?: string;
    indexes: number[];
}

interface IIndexedBatteryEntity extends BatteryStateEntity {
    index: number;
}

const getIndexesOfSortedBatteries = (config: IBatteryStateCardConfig, batteries: IIndexedBatteryEntity[]): number[] => {
    switch (config.sort_by_level) {
        case "asc": 
            batteries = batteries.sort((a, b) => compareBatteries(a.state, b.state));
            break;
        case "desc":
            batteries = batteries.sort((a, b) => compareBatteries(b.state, a.state));
            break;
    }

    return batteries.map(b => b.index);
} 

const compareBatteries = (a: string, b: string): number => {
    let aNum = Number(a);
    let bNum = Number(b);
    aNum = isNaN(aNum) ? -1 : aNum;
    bNum = isNaN(bNum) ? -1 : bNum;
    return aNum - bNum;
}


const initBatteries = (config: IBatteryStateCardConfig, hass: HomeAssistant): IIndexedBatteryEntity[] => {
    return config.entities.map((c, i) => {
        const b = <IIndexedBatteryEntity>new BatteryStateEntity();
        b.index = i;
        return b;
    });
}