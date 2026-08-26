/* Location: app/admin/components/sections/new-players-section.tsx */

import { useMemo, useState } from 'react';
import { type FetcherWithComponents, useFetcher } from 'react-router';
import { PositionBadge } from '../../../_shared/components/player';
import { SearchInput } from '../../../_shared/components/search-input';
import { Table, type TableColumn } from '../../../_shared/components/table';
import type { CustomPosition } from '../../../_shared/types/league-types';
import type { HeldPlayer, NewPlayerCandidate, PositionBucket, PositionSuggestion } from '../../types/new-players-types';
import { POSITION_BUCKETS } from '../../types/new-players-types';
import * as Icons from '../icons/admin-icons';
import { ActionBar } from '../layout/action-bar';
import { AdminContainer } from '../layout/admin-container';
import { AdminSection } from '../layout/admin-section';
import { AdminMessage } from '../ui/admin-message';
import styles from './new-players-section.module.css';

interface NewPlayersSectionProps {
    newPlayers: NewPlayerCandidate[];
    heldPlayers: HeldPlayer[];
}

interface ActionResult {
    success: boolean;
    message: string;
}

/**
 * Approving a position and letting a player into the game are two decisions, so they are
 * two tables. Approve writes the player into the `Players` tab with `isHidden` set -- they
 * exist and have a position, and nobody can take them. Release clears `isHidden` and sets
 * `new` for a batch, handing them to the `NEW_PLAYER` transfer flow that already exists.
 */
export function NewPlayersSection({ newPlayers, heldPlayers }: NewPlayersSectionProps) {
    // One fetcher per table: approving and releasing are independent, and sharing a
    // fetcher would let one table's result render as the other's.
    const approveFetcher = useFetcher<ActionResult>();
    const releaseFetcher = useFetcher<ActionResult>();

    return (
        <AdminContainer>
            <NewPlayersTable players={newPlayers} fetcher={approveFetcher} />
            <HeldPlayersTable players={heldPlayers} fetcher={releaseFetcher} />
        </AdminContainer>
    );
}

/** The action's own words, rather than a generic success line that could be about anything. */
function ActionOutcome({ result }: { result: ActionResult | undefined }) {
    if (!result) return null;
    return <AdminMessage type={result.success ? 'success' : 'error'}>{result.message}</AdminMessage>;
}

/** Enough to see a normal week's intake without scrolling, and to tame a pre-season diff. */
const PAGE_SIZE = 25;

/**
 * A high-confidence suggestion is pre-ticked so the ordinary case is one click. A
 * low-confidence one is not: approving a weak call should take a decision rather than
 * inherit a default.
 */
function isPreSelected(suggestion: PositionSuggestion | null): boolean {
    return suggestion?.position != null && suggestion.confidence === 'high';
}

function NewPlayersTable({
    players,
    fetcher,
}: {
    players: NewPlayerCandidate[];
    fetcher: FetcherWithComponents<ActionResult>;
}) {
    const isBusy = fetcher.state !== 'idle';
    const [selected, setSelected] = useState<Set<number>>(
        () => new Set(players.filter((p) => isPreSelected(p.suggestion)).map((p) => p.code)),
    );
    const [positions, setPositions] = useState<Record<number, PositionBucket | ''>>(() =>
        Object.fromEntries(players.map((p) => [p.code, p.suggestion?.position ?? ''])),
    );
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    /**
     * Pre-season the diff can be hundreds of players, which is an unusable wall of rows.
     * Selections and chosen positions are keyed by code, so they survive both filtering
     * and paging -- and the button's count is over every selection, not the visible page,
     * so nothing gets approved or forgotten off-screen.
     */
    const visible = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return players;
        return players.filter(
            (player) => player.webName.toLowerCase().includes(term) || player.club.toLowerCase().includes(term),
        );
    }, [players, search]);

    const pageOf = visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const toggleExpanded = (code: number) =>
        setExpanded((prev) => {
            const next = new Set(prev);
            if (!next.delete(code)) next.add(code);
            return next;
        });

    const toggle = (code: number) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (!next.delete(code)) next.add(code);
            return next;
        });

    const allSelected = visible.length > 0 && visible.every((player) => selected.has(player.code));
    const toggleAll = () =>
        setSelected((prev) => {
            const next = new Set(prev);
            for (const player of visible) {
                if (allSelected) next.delete(player.code);
                else next.add(player.code);
            }
            return next;
        });

    // A selected row with no position is not approvable, so it does not count towards the
    // button's total either -- the number on the button is what will actually be written.
    const approvals = useMemo(
        () =>
            players
                .filter((p) => selected.has(p.code) && positions[p.code])
                .map((p) => ({ code: p.code, position: positions[p.code] as PositionBucket })),
        [players, selected, positions],
    );

    const blockedCount = selected.size - approvals.length;

    const columns: TableColumn<NewPlayerCandidate>[] = [
        {
            key: 'select',
            header: (
                <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all new players" />
            ),
            width: '44px',
            align: 'center',
            sortable: false,
            render: (_, player) => (
                <input
                    type="checkbox"
                    checked={selected.has(player.code)}
                    onChange={() => toggle(player.code)}
                    aria-label={`Select ${player.webName}`}
                />
            ),
        },
        {
            key: 'player',
            header: 'Player',
            sortable: true,
            accessor: 'webName',
            render: (_, player) => (
                <div className={styles.player_cell}>
                    <span className={styles.player_name}>{player.webName}</span>
                    {player.suggestion?.summary && <span className={styles.note}>{player.suggestion.summary}</span>}
                </div>
            ),
        },
        { key: 'club', header: 'Club', width: '90px', accessor: 'club', sortable: true },
        {
            key: 'fplType',
            header: 'FPL',
            width: '70px',
            align: 'center',
            accessor: 'fplType',
            sortable: true,
            variant: 'muted',
        },
        {
            key: 'suggested',
            header: 'Suggested',
            width: '110px',
            align: 'center',
            sortable: false,
            render: (_, player) =>
                player.suggestion?.position ? (
                    <PositionBadge position={player.suggestion.position.toLowerCase() as CustomPosition} />
                ) : (
                    <span className={styles.no_suggestion}>none</span>
                ),
        },
        {
            key: 'why',
            header: 'Why',
            width: '160px',
            sortable: false,
            render: (_, player) => <SuggestionEvidence suggestion={player.suggestion} />,
        },
        {
            key: 'call',
            header: 'Your call',
            width: '110px',
            sortable: false,
            render: (_, player) => (
                <select
                    className={styles.position_select}
                    value={positions[player.code] ?? ''}
                    onChange={(e) =>
                        setPositions((prev) => ({ ...prev, [player.code]: e.target.value as PositionBucket | '' }))
                    }
                    aria-label={`Position for ${player.webName}`}
                >
                    <option value="">-</option>
                    {POSITION_BUCKETS.map((bucket) => (
                        <option key={bucket} value={bucket}>
                            {bucket}
                        </option>
                    ))}
                </select>
            ),
        },
        {
            key: 'expand',
            header: '',
            width: '44px',
            align: 'center',
            sortable: false,
            render: (_, player) => (
                <button
                    type="button"
                    className={styles.expand_button}
                    onClick={() => toggleExpanded(player.code)}
                    aria-expanded={expanded.has(player.code)}
                    aria-label={`${expanded.has(player.code) ? 'Hide' : 'Show'} reasoning for ${player.webName}`}
                >
                    <span className={`${styles.chevron} ${expanded.has(player.code) ? styles.chevron_open : ''}`}>
                        ▾
                    </span>
                </button>
            ),
        },
    ];

    return (
        <AdminSection
            title="New Players"
            icon={<Icons.UsersIcon />}
            description={
                players.length > 0
                    ? `${players.length} ${players.length === 1 ? 'player is' : 'players are'} in FPL but not in the sheet. They are invisible on the site until added.`
                    : 'Every FPL player is in the sheet. Nothing to add.'
            }
        >
            {players.length > PAGE_SIZE && (
                <div className={styles.filter_row}>
                    <SearchInput
                        value={search}
                        onChange={(value: string) => {
                            setSearch(value);
                            setPage(1);
                        }}
                        placeholder="Filter by player or club..."
                    />
                    <span className={styles.action_hint}>
                        {visible.length} shown{selected.size > 0 ? `, ${selected.size} selected in total` : ''}
                    </span>
                </div>
            )}

            <Table
                data={pageOf}
                columns={columns}
                size="compact"
                bordered
                pagination={
                    visible.length > PAGE_SIZE
                        ? { page, pageSize: PAGE_SIZE, total: visible.length, onPageChange: setPage }
                        : undefined
                }
                expandable={{
                    isExpanded: (player) => expanded.has(player.code),
                    render: (player) => <SuggestionRationale player={player} />,
                }}
                empty={{
                    title: 'Nothing new',
                    description: 'Every player FPL knows about is already in the sheet.',
                }}
            />

            {blockedCount > 0 && (
                <AdminMessage type="warning">
                    {blockedCount} selected {blockedCount === 1 ? 'player has' : 'players have'} no position set. Choose
                    one, or untick them.
                </AdminMessage>
            )}

            <ActionBar>
                <button
                    type="button"
                    className={styles.primary_button}
                    disabled={approvals.length === 0 || isBusy}
                    onClick={() =>
                        fetcher.submit(
                            { intent: 'approve', approvals: JSON.stringify(approvals) },
                            { method: 'post', action: '/admin/new-players' },
                        )
                    }
                >
                    {approvals.length > 0 ? `Approve ${approvals.length} selected` : 'Approve selected'}
                </button>
                <span className={styles.action_hint}>
                    Approved players are held. They only enter the game when released.
                </span>
            </ActionBar>

            <ActionOutcome result={fetcher.data} />
        </AdminSection>
    );
}

function SuggestionEvidence({ suggestion }: { suggestion: PositionSuggestion | null }) {
    if (!suggestion) {
        return <span className={styles.no_suggestion}>not researched</span>;
    }

    return (
        <div className={styles.why_cell}>
            <span className={`${styles.confidence} ${styles[`confidence_${suggestion.confidence}`]}`}>
                {suggestion.confidence}
            </span>
            <span className={styles.basis}>{suggestion.basis}</span>
        </div>
    );
}

/**
 * The full argument for a suggested position, shown when a row is expanded.
 *
 * A position an admin cannot interrogate can only be taken on trust, and taking positions
 * on trust is the habit this page replaces. So the panel leads with what the call rests on,
 * names its sources, and states the FPL prior it is arguing with rather than hiding it.
 */
function SuggestionRationale({ player }: { player: NewPlayerCandidate }) {
    const { suggestion } = player;

    if (!suggestion) {
        return (
            <div className={styles.rationale}>
                <p className={styles.rationale_empty}>
                    Nobody has researched {player.webName} yet. FPL lists them as {player.fplType}; the call is yours.
                </p>
            </div>
        );
    }

    return (
        <div className={styles.rationale}>
            <div className={styles.rationale_head}>
                <h4 className={styles.rationale_title}>
                    {suggestion.position ? `Why ${suggestion.position}` : 'Why no call was made'}
                </h4>
                <span className={styles.rationale_meta}>
                    FPL says {player.fplType} · {suggestion.basis} · {suggestion.confidence} confidence
                </span>
            </div>

            <ul className={styles.rationale_points}>
                {suggestion.reasoning.map((point) => (
                    <li key={point}>{point}</li>
                ))}
            </ul>

            {suggestion.sources.length > 0 ? (
                <div className={styles.rationale_sources}>
                    <span className={styles.rationale_sources_label}>Sources</span>
                    {suggestion.sources.map((source) => (
                        <a
                            key={source.url}
                            className={styles.source_link}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer noopener"
                        >
                            {source.label}
                        </a>
                    ))}
                </div>
            ) : (
                <p className={styles.rationale_nosource}>
                    No source was reachable, so nothing here has been verified first-hand.
                </p>
            )}
        </div>
    );
}

function HeldPlayersTable({
    players,
    fetcher,
}: {
    players: HeldPlayer[];
    fetcher: FetcherWithComponents<ActionResult>;
}) {
    const isBusy = fetcher.state !== 'idle';
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [copied, setCopied] = useState(false);

    const toggle = (code: number) =>
        setSelected((prev) => {
            const next = new Set(prev);
            if (!next.delete(code)) next.add(code);
            return next;
        });

    const allSelected = players.length > 0 && selected.size === players.length;
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(players.map((p) => p.code)));

    const selectedPlayers = players.filter((p) => selected.has(p.code));

    // The batch gets announced to the league either way, and retyping it is exactly the
    // kind of step that quietly reintroduces the errors this page exists to remove.
    const copyAnnouncement = async () => {
        const text = selectedPlayers.map((p) => `${p.webName} (${p.club}) - ${p.position}`).join('\n');
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const columns: TableColumn<HeldPlayer>[] = [
        {
            key: 'select',
            header: (
                <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    aria-label="Select all held players"
                />
            ),
            width: '44px',
            align: 'center',
            sortable: false,
            render: (_, player) => (
                <input
                    type="checkbox"
                    checked={selected.has(player.code)}
                    onChange={() => toggle(player.code)}
                    aria-label={`Select ${player.webName}`}
                />
            ),
        },
        { key: 'player', header: 'Player', accessor: 'webName', sortable: true },
        { key: 'club', header: 'Club', width: '90px', accessor: 'club', sortable: true },
        {
            key: 'position',
            header: 'Position',
            width: '110px',
            align: 'center',
            sortable: false,
            render: (_, player) => <PositionBadge position={player.position.toLowerCase() as CustomPosition} />,
        },
        {
            key: 'addedAt',
            header: 'Added',
            width: '110px',
            accessor: 'addedAt',
            sortable: true,
            variant: 'muted',
            render: (_, player) =>
                new Date(player.addedAt).toLocaleDateString('en-gb', { day: 'numeric', month: 'short' }),
        },
    ];

    return (
        <AdminSection
            title="Held - not yet in the game"
            icon={<Icons.CalendarIcon />}
            description="Position agreed, hidden from managers. Release a batch to put them into the new-player transfer window."
        >
            <Table
                data={players}
                columns={columns}
                size="compact"
                bordered
                empty={{
                    title: 'Nobody held',
                    description: 'Every approved player has been released into the game.',
                }}
            />

            <ActionBar>
                <button
                    type="button"
                    className={styles.primary_button}
                    disabled={selected.size === 0 || isBusy}
                    onClick={() =>
                        fetcher.submit(
                            { intent: 'release', codes: JSON.stringify(selectedPlayers.map((p) => p.code)) },
                            { method: 'post', action: '/admin/new-players' },
                        )
                    }
                >
                    {selected.size > 0 ? `Release ${selected.size} into the game` : 'Release into the game'}
                </button>
                <button
                    type="button"
                    className={styles.secondary_button}
                    disabled={selected.size === 0}
                    onClick={copyAnnouncement}
                >
                    {copied ? 'Copied' : 'Copy announcement'}
                </button>
                <span className={styles.action_hint}>
                    Released players appear on the site once Populate Bootstrap Data has run.
                </span>
            </ActionBar>

            <ActionOutcome result={fetcher.data} />
        </AdminSection>
    );
}
