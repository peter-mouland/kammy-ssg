/**
 * Turn gathered evidence into a position bucket, without a model where a model adds nothing.
 *
 * The scoring table is what makes this possible. CB and FB score identically, and so do WA and
 * CA, so the only thing that has to be right is the GROUP: defensive, midfield or attacking.
 * FotMob publishes how many times a player lined up in each slot, so for most players the group
 * is a matter of counting rather than judgement, and counting is free, repeatable and
 * explainable in a way a model's answer is not.
 *
 * A model is called only where the counting genuinely does not settle it: a player split across
 * groups, an attacking midfielder (which straddles MID and CA), or no appearance data at all.
 * Those are the cases where the reasoning is worth paying for.
 */

/** Slot vocabulary shared by FotMob and Transfermarkt, mapped onto the six buckets. */
const SLOT_TO_BUCKET = [
    [/goalkeeper|keeper/i, 'GK'],
    [/centre.?back|center.?back|centre.?half/i, 'CB'],
    [/(left|right).?(back|wing.?back)/i, 'FB'],
    [/wing.?back/i, 'FB'],
    [/defensive midfield|central midfield|centre midfield|central mid|deep.?lying/i, 'MID'],
    [/attacking midfield/i, 'AM'], // straddles MID and CA, resolved separately
    [/(left|right) midfield/i, 'WA'],
    [/(left|right) winger|winger|wide (forward|attacker)/i, 'WA'],
    [/second striker|centre.?forward|center.?forward|striker|forward/i, 'CA'],
    [/midfield/i, 'MID'], // after the specific ones
    [/defender|defence|back/i, 'CB'], // coarse, but CB and FB score the same
];

export const BUCKET_GROUP = { GK: 'GK', CB: 'DEF', FB: 'DEF', MID: 'MID', WA: 'ATT', CA: 'ATT' };

export function slotToBucket(label) {
    return SLOT_TO_BUCKET.find(([re]) => re.test(label ?? ''))?.[1] ?? null;
}

/** Enough of one group's appearances to call it without argument. */
const DOMINANT_SHARE = 0.7;
/** Below this, a share is an artefact of a small sample rather than a pattern. */
const CONFIDENT_APPEARANCES = 10;

/**
 * @returns {{bucket: string|null, confidence: string, basis: string, needsModel: boolean,
 *            summary: string, reasoning: string[], sources: {label:string,url:string}[]}}
 */
export function classify(evidence) {
    const { fotmob: fm, transfermarkt: tm, wikipedia: wiki, player } = evidence;

    const sources = [];
    if (fm) sources.push({ label: 'FotMob appearance distribution', url: fm.url });
    if (tm) sources.push({ label: 'Transfermarkt profile', url: tm.url });
    if (wiki) sources.push({ label: 'Wikipedia', url: wiki.url });

    const reasoning = [];

    // ---- no appearance data at all -------------------------------------------------
    if (!fm || fm.positions.length === 0) {
        const tmBucket = tm ? slotToBucket(tm.position) : null;
        reasoning.push('FotMob has no appearance distribution for this player, so there is no record to count.');
        if (tm) reasoning.push(`Transfermarkt lists him as ${tm.position || 'no position'}.`);
        if (wiki) reasoning.push('Wikipedia was read for the current club and any recent role change.');

        if (tmBucket && tmBucket !== 'AM') {
            return {
                bucket: tmBucket,
                confidence: 'low',
                basis: 'projection',
                needsModel: false,
                summary: `No appearance record; taken from Transfermarkt's listed position of ${tm.position}.`,
                reasoning,
                sources,
            };
        }
        return {
            bucket: null,
            confidence: 'low',
            basis: 'projection',
            needsModel: true,
            summary: 'No appearance record and no clear listed position.',
            reasoning,
            sources,
        };
    }

    // ---- count appearances by group ------------------------------------------------
    const byBucket = new Map();
    let attackingMidfielder = 0;
    let total = 0;

    for (const p of fm.positions) {
        const bucket = slotToBucket(p.label);
        total += p.appearances;
        if (bucket === 'AM') {
            attackingMidfielder += p.appearances;
            continue;
        }
        if (bucket) byBucket.set(bucket, (byBucket.get(bucket) ?? 0) + p.appearances);
    }

    const byGroup = new Map();
    for (const [bucket, n] of byBucket) {
        const group = BUCKET_GROUP[bucket];
        byGroup.set(group, (byGroup.get(group) ?? 0) + n);
    }

    const spread = fm.positions.map((p) => `${p.label} ${p.appearances}`).join(', ');
    reasoning.push(`FotMob appearance split: ${spread}.`);
    reasoning.push(
        `Recent league window: ${fm.leagueAppearances} league appearances, ${fm.leagueMinutes} minutes. ` +
            `Minutes by competition: ${Object.entries(fm.minutesByCompetition)
                .map(([c, m]) => `${c} ${m}`)
                .join(', ')}.`,
    );
    if (tm) {
        reasoning.push(
            `Transfermarkt lists him as ${tm.position}` +
                (tm.otherPositions.length ? `, also ${tm.otherPositions.join(' and ')}.` : '.'),
        );
    }
    if (fm.club && player.club && !fm.club.toLowerCase().includes(String(player.club).toLowerCase())) {
        reasoning.push(`FotMob has his club as ${fm.club}, which is worth checking against the sheet's ${player.club}.`);
    }

    // An attacking midfielder is not resolvable by counting: the slot itself spans two groups.
    if (attackingMidfielder > 0 && attackingMidfielder / (total || 1) >= 0.3) {
        reasoning.push(
            `${attackingMidfielder} of ${total} appearances are at attacking midfield, which spans MID and CA, ` +
                'so counting alone cannot settle the group.',
        );
        return {
            bucket: null,
            confidence: 'low',
            basis: 'record',
            needsModel: true,
            summary: 'Split between midfield and attack; the attacking-midfield slot needs a judgement.',
            reasoning,
            sources,
        };
    }

    const ranked = [...byGroup.entries()].sort((a, b) => b[1] - a[1]);
    if (ranked.length === 0) {
        return {
            bucket: null,
            confidence: 'low',
            basis: 'record',
            needsModel: true,
            summary: 'Appearance data present but none of the slots mapped to a bucket.',
            reasoning,
            sources,
        };
    }

    const [topGroup, topCount] = ranked[0];
    const share = topCount / (total || 1);

    if (share < DOMINANT_SHARE) {
        reasoning.push(
            `The largest group, ${topGroup}, holds only ${topCount} of ${total} appearances, ` +
                'which is not enough to call it by counting.',
        );
        return {
            bucket: null,
            confidence: 'low',
            basis: 'record',
            needsModel: true,
            summary: 'Appearances are spread across groups with no clear majority.',
            reasoning,
            sources,
        };
    }

    // Within the settled group, the most-played bucket wins. CB against FB and WA against CA
    // score identically, so this pick never changes anyone's points.
    const inGroup = [...byBucket.entries()].filter(([b]) => BUCKET_GROUP[b] === topGroup).sort((a, b) => b[1] - a[1]);
    const bucket = inGroup[0][0];

    const confident = share >= DOMINANT_SHARE && total >= CONFIDENT_APPEARANCES;
    reasoning.push(
        `${topCount} of ${total} appearances are in the ${topGroup} group (${Math.round(share * 100)}%), ` +
            `and ${bucket} is the most played slot within it.`,
    );
    if (!confident) {
        reasoning.push(`Only ${total} appearances in total, which is a small sample to read a pattern from.`);
    }

    return {
        bucket,
        confidence: confident ? 'high' : 'medium',
        basis: 'record',
        needsModel: false,
        summary:
            `${Math.round(share * 100)}% of ${total} recorded appearances are in the ${topGroup} group, ` +
            `most often at ${bucket}.`,
        reasoning,
        sources,
    };
}
