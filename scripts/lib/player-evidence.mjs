/**
 * Gather what several sites say about where a footballer actually plays.
 *
 * The point of this file is that a position bucket is a judgement about DEPLOYMENT, and no
 * single site is trustworthy enough to settle it alone. FPL's registration is routinely stale
 * (that is what we are correcting). Transfermarkt publishes a curated main position that lags a
 * role change. FotMob is the only reachable source that publishes a real distribution -- how
 * many times a player lined up in each slot -- which is the closest thing to the per-match
 * lineup evidence you would want.
 *
 * So all of them get fetched, disagreement between them is preserved rather than resolved
 * here, and the caller gets URLs for every claim so a human can go and check.
 *
 * REACHABILITY, tested 29 Aug 2026 from a normal connection:
 *   FotMob         200 via /api/data/...   (the older /api/... paths 404)
 *   Transfermarkt  200
 *   Wikipedia      200
 *   Sofascore      403 on every endpoint and header combination tried
 *   FBref          403
 *   Understat      200 but serves no embedded JSON any more
 *   FootballCritic 200 but its search is client-rendered, so no player URL to follow
 *
 * Sofascore's per-match lineup endpoint was the ideal source and is not available. FotMob's
 * occurrence counts are the substitute. If Sofascore ever becomes reachable, add it here
 * rather than replacing anything: more disagreement is more signal.
 */

const UA =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const POLITE_DELAY_MS = 800;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const stripTags = (html) =>
    html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&#0?39;|&apos;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Wikipedia's API policy requires a descriptive User-Agent naming the tool and a contact.
 * Sending a browser string gets you throttled, and the failure is silent: the fetch returns
 * non-200 and the player looks like he has no article. That produced rationales stating
 * "Wikipedia returned no article" for players who plainly have one.
 */
const WIKI_UA = 'KammyFantasyFootball/1.0 (https://github.com/peter-mouland/kammy-ssg) node-fetch';

async function get(url, { json = false, attempts = 2 } = {}) {
    const agent = url.includes('wikipedia.org') ? WIKI_UA : UA;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const res = await fetch(url, {
            headers: { 'User-Agent': agent, Accept: json ? 'application/json' : 'text/html,application/json' },
        });
        if (res.ok) return json ? res.json() : res.text();
        // 429 and 5xx are worth one more go; a 404 is an answer.
        if (res.status !== 429 && res.status < 500) return null;
        if (attempt < attempts) await sleep(1500);
    }
    return null;
}

/**
 * Competitions that are not the player's league. Counting these is the single most common way
 * to get a split wrong: a defender showing seven appearances at left back may have played all
 * of them in a cup or for his country.
 */
const NON_LEAGUE = /friendl|cup|trophy|shield|qualification|nations league|world cup|euro|copa|internationa/i;

/**
 * FotMob. The valuable field is `positionDescription.positions`, which carries an `occurences`
 * count per slot, so it answers "how often" rather than only "what".
 */
/**
 * Name queries to try, longest first.
 *
 * Full names defeat these search endpoints more often than they help: FotMob returns nothing
 * for "El Hadji Malick Diouf" and finds him immediately as "Malick Diouf". So the full name is
 * tried because it disambiguates when it works, and the shorter forms are the fallback.
 */
function nameQueries(name, fullName) {
    const parts = (fullName || name).split(/\s+/).filter(Boolean);
    const candidates = [fullName, parts.slice(-2).join(' '), name, parts.at(-1)];
    return [...new Set(candidates.filter((q) => q && q.length > 2))];
}

/**
 * Whether two club names are the same club.
 *
 * This is the only place that question gets asked, because asking it twice is how the wrong
 * player got through: the classifier compared the sheet's `BHA` against FotMob's `Sevilla`,
 * which is never equal, so it warned on players it had matched correctly and stayed quiet on
 * one it had not. Comparing a code against a name cannot work; comparing names can.
 *
 * Sources write the same club several ways, so compare on the distinctive word rather than the
 * whole string: "Brighton" against "Brighton & Hove Albion" agrees on `brighton`. The aliases
 * are the clubs where no word is shared at all.
 */
const CLUB_ALIASES = {
    'man city': 'manchester city',
    'man utd': 'manchester united',
    "nott'm forest": 'nottingham forest',
    spurs: 'tottenham hotspur',
    wolves: 'wolverhampton wanderers',
};

const normaliseClub = (name) => {
    const lower = String(name ?? '')
        .toLowerCase()
        .trim();
    return (CLUB_ALIASES[lower] ?? lower).replace(/[^a-z]+/g, ' ').trim();
};

/**
 * Containment rather than word matching, which is not a shortcut: dropping the common words
 * to compare the distinctive ones makes "Man City" and "Manchester United" both read as
 * Manchester. What actually varies between sources is a suffix, so "Brighton" sits inside
 * "Brighton and Hove Albion" and Manchester City stays out of Manchester United.
 */
export function sameClub(a, b) {
    const left = normaliseClub(a);
    const right = normaliseClub(b);
    if (!left || !right) return false;
    return left.includes(right) || right.includes(left);
}

/** Prefer a hit at the club we expect, since surnames repeat across the league. */
function pickHit(hits, clubName) {
    if (hits.length === 0) return null;
    if (!clubName) return hits[0];
    return hits.find((h) => sameClub(h.teamName, clubName)) ?? hits[0];
}

async function fotmob(name, fullName, clubName) {
    let hit = null;
    for (const query of nameQueries(name, fullName)) {
        const suggest = await get(`https://www.fotmob.com/api/data/search/suggest?term=${encodeURIComponent(query)}`, {
            json: true,
        });
        const hits = (suggest ?? []).flatMap((group) => group.suggestions ?? []).filter((s) => s.type === 'player');
        hit = pickHit(hits, clubName);
        if (hit) break;
        await sleep(POLITE_DELAY_MS);
    }
    if (!hit) return null;

    await sleep(POLITE_DELAY_MS);
    const data = await get(`https://www.fotmob.com/api/data/playerData?id=${hit.id}`, { json: true });
    if (!data) return null;

    const positions = (data.positionDescription?.positions ?? [])
        .map((p) => ({
            label: p.strPos?.label ?? '?',
            appearances: p.occurences ?? 0,
            isMain: Boolean(p.isMainPosition),
        }))
        .sort((a, b) => b.appearances - a.appearances);

    const matches = data.recentMatches ?? [];
    const league = matches.filter((m) => !NON_LEAGUE.test(m.leagueName ?? ''));
    const byCompetition = {};
    for (const m of matches) {
        const key = m.leagueName ?? 'unknown';
        byCompetition[key] = (byCompetition[key] ?? 0) + (m.minutesPlayed ?? 0);
    }

    const club = data.primaryTeam?.teamName ?? '';

    return {
        source: 'FotMob',
        url: `https://www.fotmob.com/players/${hit.id}`,
        name: data.name,
        club,
        // null when we had no club to check against, so "unknown" and "wrong" stay apart.
        clubMatched: clubName ? sameClub(club, clubName) : null,
        primaryPosition: data.positionDescription?.primaryPosition?.label ?? '',
        positions,
        leagueAppearances: league.length,
        leagueMinutes: league.reduce((n, m) => n + (m.minutesPlayed ?? 0), 0),
        minutesByCompetition: byCompetition,
    };
}

/** Transfermarkt. A curated main position plus any secondary ones, and the current club. */
async function transfermarkt(name, fullName) {
    let link = null;
    for (const query of nameQueries(name, fullName)) {
        const html = await get(
            `https://www.transfermarkt.com/schnellsuche/ergebnis/schnellsuche?query=${encodeURIComponent(query)}`,
        );
        link = html?.match(/href="(\/[^"]*\/profil\/spieler\/\d+)"/)?.[1] ?? null;
        if (link) break;
        await sleep(POLITE_DELAY_MS);
    }
    if (!link) return null;

    await sleep(POLITE_DELAY_MS);
    const profile = await get(`https://www.transfermarkt.com${link}`);
    if (!profile) return null;

    const position = stripTags(profile.match(/Position:<\/span>\s*<span[^>]*>(.*?)<\/span>/s)?.[1] ?? '');
    const other = [...profile.matchAll(/Other position:?\s*<\/[^>]+>\s*(?:<[^>]+>\s*)*([A-Za-z\- ]{3,30})/g)].map(
        (m) => m[1].trim(),
    );

    return {
        source: 'Transfermarkt',
        url: `https://www.transfermarkt.com${link}`,
        position,
        otherPositions: [...new Set(other)],
    };
}

/** Wikipedia. Weakest on deployment, strongest on whether he has just changed club. */
async function wikipedia(name) {
    const search = await get(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&list=search&srlimit=1&srsearch=${encodeURIComponent(`${name} footballer`)}`,
        { json: true },
    );
    const found = search?.query?.search?.[0];
    if (!found) return null;

    await sleep(POLITE_DELAY_MS);
    const page = await get(
        `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&explaintext=1&redirects=1&titles=${encodeURIComponent(found.title)}`,
        { json: true },
    );
    const extract = Object.values(page?.query?.pages ?? {})[0]?.extract ?? '';

    return {
        source: 'Wikipedia',
        url: `https://en.wikipedia.org/wiki/${encodeURIComponent(found.title.replace(/ /g, '_'))}`,
        title: found.title,
        // The intro carries club and position; the club career section carries role changes.
        text: extract.slice(0, 5000),
    };
}

/**
 * All three, in parallel, with a failure of one never taking the others down. A player with no
 * FotMob entry is a real and common case (academy players), and the right answer there is thin
 * evidence and low confidence, not an error.
 */
export async function gatherEvidence({ name, fullName, club, clubName, fplType }) {
    const [fm, tm, wiki] = await Promise.all([
        fotmob(name, fullName, clubName).catch((e) => ({ error: `FotMob: ${e.message}` })),
        transfermarkt(name, fullName).catch((e) => ({ error: `Transfermarkt: ${e.message}` })),
        wikipedia(fullName || name).catch((e) => ({ error: `Wikipedia: ${e.message}` })),
    ]);

    const sources = [fm, tm, wiki].filter((s) => s && !s.error);
    const failures = [fm, tm, wiki].filter((s) => s?.error).map((s) => s.error);

    return {
        player: { name, fullName, club, clubName, fplType },
        fotmob: fm?.error ? null : fm,
        transfermarkt: tm?.error ? null : tm,
        wikipedia: wiki?.error ? null : wiki,
        sourceCount: sources.length,
        failures,
    };
}

/** The evidence as text for a model to reason over, with every URL it is allowed to cite. */
export function formatEvidence(evidence) {
    const lines = [];
    const { player, fotmob: fm, transfermarkt: tm, wikipedia: wiki } = evidence;

    lines.push(`PLAYER: ${player.fullName || player.name}`);
    lines.push(`Club per the league sheet: ${player.clubName || player.club}`);
    lines.push(`FPL registers him as: ${player.fplType}   (often stale; this is what we are checking)`);
    lines.push('');

    if (fm) {
        lines.push(`SOURCE FotMob  ${fm.url}`);
        lines.push(
            `  listed club: ${fm.club}` +
                (fm.clubMatched === false
                    ? `   *** NOT ${player.clubName}. This may be the wrong player, or a transfer FotMob has not recorded yet. ***`
                    : ''),
        );
        lines.push(`  primary position: ${fm.primaryPosition}`);
        lines.push('  appearances by position:');
        for (const p of fm.positions) {
            lines.push(`    ${p.label.padEnd(24)} ${String(p.appearances).padStart(3)}${p.isMain ? '  (main)' : ''}`);
        }
        lines.push(`  league appearances in the recent window: ${fm.leagueAppearances} (${fm.leagueMinutes} mins)`);
        lines.push('  minutes by competition (watch for cup and international minutes):');
        for (const [comp, mins] of Object.entries(fm.minutesByCompetition)) {
            lines.push(`    ${comp.padEnd(28)} ${mins}`);
        }
        lines.push('');
    } else {
        lines.push('SOURCE FotMob: no entry found. There is no appearance distribution to read.');
        lines.push('');
    }

    if (tm) {
        lines.push(`SOURCE Transfermarkt  ${tm.url}`);
        lines.push(`  position: ${tm.position || 'not stated'}`);
        if (tm.otherPositions.length) lines.push(`  other positions: ${tm.otherPositions.join(', ')}`);
        lines.push('');
    } else {
        lines.push('SOURCE Transfermarkt: no profile found.');
        lines.push('');
    }

    if (wiki) {
        lines.push(`SOURCE Wikipedia  ${wiki.url}`);
        lines.push(wiki.text);
        lines.push('');
    } else {
        lines.push('SOURCE Wikipedia: no article found.');
        lines.push('');
    }

    if (evidence.failures.length) lines.push(`FETCH FAILURES: ${evidence.failures.join('; ')}`);

    return lines.join('\n');
}
