import { expect } from '@esm-bundle/chai';
import { BatteryStateCard } from '../../../src/custom-elements/battery-state-card';
import { HomeAssistantMock } from '../../helpers';

describe('Group height', () => {
    let grid: HTMLDivElement;

    beforeEach(() => {
        grid = document.createElement('div');
        grid.style.cssText = 'display: grid; grid-template-columns: 1fr; width: 360px; line-height: 24px;';
        document.body.appendChild(grid);
    });

    afterEach(() => grid.remove());

    const createCard = async (count: number, secondaryInfo?: string) => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const entities = Array.from({ length: count }, (_, i) =>
            hass.addEntity(`Battery ${i + 1}`, '50', undefined, 'sensor').entity_id);
        const card = hass.addCard('battery-state-card', {
            entities,
            secondary_info: secondaryInfo,
            collapse: [{ name: 'Batteries', entities }],
        });
        grid.appendChild(card);
        await card.cardUpdated;
        await card.updateComplete;
        await Promise.all(Object.values(card.batteries).map(battery => battery.updateComplete));
        const toggler = card.shadowRoot!.querySelector<HTMLElement>('.toggler')!;
        const items = card.shadowRoot!.querySelector<HTMLElement>('.groupItems')!;
        items.style.transition = 'none';
        const rows = items.querySelectorAll<HTMLElement>('battery-state-entity');
        return { card, toggler, items, rows };
    };

    const expectFullyVisible = (items: HTMLElement, rows: NodeListOf<HTMLElement>) => {
        const bounds = items.getBoundingClientRect();
        for (const row of rows) {
            const rowBounds = row.getBoundingClientRect();
            expect(rowBounds.height).to.be.greaterThan(0);
            expect(rowBounds.top).to.be.at.least(bounds.top);
            expect(rowBounds.bottom).to.be.at.most(bounds.bottom);
        }
    };

    for (const count of [7, 8, 11]) {
        it(`shows all ${count} rows with secondary info in an expanded group`, async () => {
            const { toggler, items, rows } = await createCard(count, 'Battery status');
            expect(rows.length).to.equal(count);
            expect(items.getBoundingClientRect().height).to.equal(0);
            toggler.click();
            expectFullyVisible(items, rows);
        });
    }

    it('collapses and reopens a group without secondary info', async () => {
        const { toggler, items, rows } = await createCard(7);
        toggler.click();
        expectFullyVisible(items, rows);
        toggler.click();
        expect(items.getBoundingClientRect().height).to.equal(0);
        toggler.click();
        expectFullyVisible(items, rows);
    });

    it('adapts to taller rows after the group has been expanded', async () => {
        const { toggler, items, rows } = await createCard(7, 'Battery status');
        toggler.click();
        grid.style.lineHeight = '32px';
        expectFullyVisible(items, rows);
        toggler.click();
        expect(items.getBoundingClientRect().height).to.equal(0);
        toggler.click();
        expectFullyVisible(items, rows);
    });

    it('expands to the full content height with a transition', async () => {
        const { toggler, items, rows } = await createCard(7, 'Battery status');
        items.style.transition = 'all 20ms linear';
        expect(items.getBoundingClientRect().height).to.equal(0);
        toggler.click();
        const opening = items.getAnimations();
        expect(opening.length).to.equal(1);
        opening.forEach(animation => animation.finish());
        expectFullyVisible(items, rows);
        toggler.click();
        const closing = items.getAnimations();
        expect(closing.length).to.equal(1);
        closing.forEach(animation => animation.finish());
        expect(items.getBoundingClientRect().height).to.equal(0);
    });

    it('shows new rows when an expanded filtered group grows', async () => {
        const hass = new HomeAssistantMock<BatteryStateCard>();
        const entities = Array.from({ length: 11 }, (_, i) =>
            hass.addEntity(`Battery ${i + 1}`, i < 3 ? '25' : '75', undefined, 'sensor'));
        const card = hass.addCard('battery-state-card', {
            entities: entities.map(entity => entity.entity_id),
            secondary_info: 'Battery status',
            collapse: [{ name: 'Low batteries', filters: [{ name: 'state', operator: '<', value: 50 }] }],
        });
        grid.appendChild(card);
        await card.cardUpdated;
        await card.updateComplete;
        const items = card.shadowRoot!.querySelector<HTMLElement>('.groupItems')!;
        items.style.transition = 'none';
        card.shadowRoot!.querySelector<HTMLElement>('.toggler')!.click();
        expect(items.querySelectorAll('battery-state-entity').length).to.equal(3);
        entities.slice(3).forEach(entity => entity.setState('25'));
        await card.cardUpdated;
        await card.updateComplete;
        await Promise.all(Object.values(card.batteries).map(battery => battery.updateComplete));
        const rows = items.querySelectorAll<HTMLElement>('battery-state-entity');
        expect(rows.length).to.equal(11);
        expectFullyVisible(items, rows);
    });
});
