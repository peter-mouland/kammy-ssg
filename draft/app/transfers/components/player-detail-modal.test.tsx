// @vitest-environment happy-dom

/* Location: app/transfers/components/player-detail-modal.test.tsx */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { createRoutesStub } from 'react-router';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { makePlayerDetailData } from './fixtures';
import { PlayerDetailModal } from './player-detail-modal';

/**
 * The player page shown over the transfer flow. Its data comes from the player detail
 * endpoint, so that is what is substituted: everything from the fetch onwards runs.
 */

const SALIBA_CODE = 462424;
const DETAIL_URL = `*/players/${SALIBA_CODE}/detail.json`;
const saliba = makePlayerDetailData({ code: SALIBA_CODE, firstName: 'William', secondName: 'Saliba', pointsTotal: 87 });

const server = setupServer(http.get(DETAIL_URL, () => HttpResponse.json(saliba)));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

function renderModal(onClose = vi.fn()) {
    const queryClient = new QueryClient();
    const Stub = createRoutesStub([
        {
            path: '/',
            Component: () => (
                <QueryClientProvider client={queryClient}>
                    <PlayerDetailModal playerCode={SALIBA_CODE} playerName="Saliba" onClose={onClose} />
                </QueryClientProvider>
            ),
        },
    ]);
    render(<Stub initialEntries={['/']} />);
    return { onClose };
}

describe('the player modal', () => {
    it('is a dialog named after the player, saying so while their details load', async () => {
        renderModal();

        expect(await screen.findByRole('dialog', { name: 'Saliba' })).toBeDefined();
        expect(screen.getByRole('status').textContent).toBe('Loading Saliba…');
    });

    it("then shows the player's details, as the player page does", async () => {
        renderModal();

        expect(await screen.findByRole('heading', { name: /William Saliba/ })).toBeDefined();
        expect(screen.getByText('87')).toBeDefined();
        expect(screen.getByRole('heading', { name: 'Gameweek Performance' })).toBeDefined();
    });

    it("has a Back control, and not the player page's own way back", async () => {
        const { onClose } = renderModal();
        await screen.findByRole('heading', { name: /William Saliba/ });

        expect(screen.queryByText(/Back to All Players/)).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: '← Back' }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('closes on Escape', async () => {
        const { onClose } = renderModal();
        const dialog = await screen.findByRole('dialog', { name: 'Saliba' });

        // What a browser fires on a modal dialog when Escape is pressed.
        fireEvent(dialog, new Event('cancel', { cancelable: true }));
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('closes on a tap on the backdrop, but not on its content', async () => {
        const { onClose } = renderModal();
        const dialog = await screen.findByRole('dialog', { name: 'Saliba' });

        fireEvent.click(await screen.findByRole('heading', { name: /William Saliba/ }));
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.click(dialog);
        expect(onClose).toHaveBeenCalledOnce();
    });

    it('says when the details could not be loaded, and loads them on a retry', async () => {
        server.use(http.get(DETAIL_URL, () => new HttpResponse(null, { status: 500 })));
        renderModal();

        const alert = await screen.findByRole('alert', {}, { timeout: 5000 });
        expect(alert.textContent).toContain("Couldn't load Saliba's details just now.");

        server.resetHandlers();
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(await screen.findByRole('heading', { name: /William Saliba/ })).toBeDefined();
    });
});
