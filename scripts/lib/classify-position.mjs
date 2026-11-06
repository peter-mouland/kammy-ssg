/**
 * Turn gathered evidence into a position bucket, without a model where a model adds nothing.
 *
 * The scoring table is what makes this possible. CB and FB score identically, and so do WA and
 * CA, so the only thing that has to be right is the GROUP: defensive, midfield or attacking.
 * FotMob publishes how many times a player lined up in each slot, so the group is a matter of
 * counting rather than judgement, and counting is free, repeatable and explainable in a way a
 * model's answer is not.
 *
 * IT ALWAYS ANSWERS. An earlier version returned nothing when the record was awkward, on the
 * grounds that a blank is honest. It is not useful: an admin faced with an empty dropdown has
 * to do the whole job by hand, which is what this exists to avoid, and the awkward players are
 * exactly the ones where doing it by hand is hardest. A named suggestion carrying low
 * confidence is easier to correct than a blank, and correcting it is one click either way.
 *
 * So the difficulty is reported rather than used as a reason to stop. `review` marks the rows
 * where the evidence did not settle it cleanly, and `confidence` says how much weight the
 * answer will take.
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

/** Where FPL's own four types land when there is nothing better to go on. */
const FPL_TYPE_BUCKET = { GKP: 'GK', DEF: 'CB', MID: 'MID', FWD: 'CA' };

export function slotToBucket(label) {
    return SLOT_TO_BUCKET.find(([re]) => re.test(label ?? ''))?.[1] ?? null;
}

/** Enough of one group's appearances to call it without argument. */
const DOMINANT_SHARE = 0.7;
/** Below this the answer is a plurality rather than a pattern. */
const CLEAR_SHARE = 0.5;
/** Below this, a share is an artefact of a small sample. */
const CONFIDENT_APPEARANCES = 10;

/**
 * @returns {{bucket: string, confidence: 'high'|'medium'|'low', basis: 'record'|'projection',
 *            review: boolean, summary: string, reasoning: string[],
 *            sources: {label:string,url:string}[]}}
 */
export function classify(evidence) {
    const { fotmob: fm, transfermarkt: tm, wikipedia: wiki, player } = evidence;

    const sources = [];
    if (fm) sources.push({ label: 'FotMob appearance distribution', url: fm.url });
    if (tm) sources.push({ label: 'Transfermarkt profile', url: tm.url });
    if (wiki) sources.push({ label: 'Wikipedia', url: wiki.url });

    const reasoning = [];
    const listed = tm?.position ? slotToBucket(tm.position) : null;

    // ---- nothing to count ----------------------------------------------------------
    if (!fm || fm.positions.length === 0) {
        reasoning.push('FotMob has no appearance distribution for this player, so there is no record to count.');
        if (tm) reasoning.push(`Transfermarkt lists him as ${tm.position || 'no position'}.`);
        if (wiki) reasoning.push('Wikipedia was read for the current club and any recent role change.');

        if (listed && listed !== 'AM') {
            return {
                bucket: listed,
                confidence: 'low',
                basis: 'projection',
                review: true,
                summary: `No appearance record. Taken from Transfermarkt's listed position of ${tm.position}.`,
                reasoning,
                sources,
            };
        }

        const fallback = FPL_TYPE_BUCKET[player.fplType] ?? 'MID';
        reasoning.push(
            `Nothing usable from either source, so this falls back to FPL's own registration of ` +
                `${player.fplType}, which is the thing we would normally be correcting.`,
        );
        return {
            bucket: fallback,
            confidence: 'low',
            basis: 'projection',
            review: true,
            summary: `Nothing to count. This is FPL's ${player.fplType} carried over, and wants checking.`,
            reasoning,
            sources,
        };
    }

    // ---- count appearances by slot -------------------------------------------------
    const byBucket = new Map();
    let attackingMidfielder = 0;

    for (const p of fm.positions) {
        const bucket = slotToBucket(p.label);
        if (bucket === 'AM') attackingMidfielder += p.appearances;
        else if (bucket) byBucket.set(bucket, (byBucket.get(bucket) ?? 0) + p.appearances);
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

    // The club check lives in `player-evidence.mjs`, which is where the name was matched and
    // where both club names exist. A mismatch is the strongest signal available that this is a
    // different player of the same name, so it never leaves here as a high-confidence answer.
    const wrongClub = fm.clubMatched === false;
    if (wrongClub) {
        reasoning.push(
            `FotMob has this player at ${fm.club}, not ${player.clubName || player.club}. ` +
                'That is either a different player of the same name or a move FotMob has not recorded, ' +
                'so the appearance split below may not be his.',
        );
    }

    // ---- attacking midfield --------------------------------------------------------
    // The slot spans MID and CA, so counting cannot place it on its own. Transfermarkt names
    // the actual role often enough to settle it, and names it precisely: a right winger who
    // also fills in at ten belongs with the wide attackers, not the strikers. Where it has
    // nothing to say, the rest of his own record decides.
    let amGuessed = false;
    if (attackingMidfielder > 0) {
        let target;
        if (listed && listed !== 'AM') {
            target = listed;
            reasoning.push(
                `${attackingMidfielder} appearances at attacking midfield, a slot that spans MID and CA. ` +
                    `Transfermarkt has him at ${tm.position}, so they are counted as ${target}.`,
            );
        } else {
            const inGroup = (group) =>
                [...byBucket.entries()].filter(([b]) => BUCKET_GROUP[b] === group).reduce((n, [, v]) => n + v, 0);
            target = inGroup('ATT') > inGroup('MID') ? 'CA' : 'MID';
            amGuessed = true;
            reasoning.push(
                `${attackingMidfielder} appearances at attacking midfield, a slot that spans MID and CA. ` +
                    `Neither Transfermarkt nor the rest of the record settles it, so they follow the ` +
                    `larger half of his other appearances and count as ${target}. This is the judgement call.`,
            );
        }
        byBucket.set(target, (byBucket.get(target) ?? 0) + attackingMidfielder);
    }

    const byGroup = new Map();
    for (const [bucket, n] of byBucket) {
        const group = BUCKET_GROUP[bucket];
        byGroup.set(group, (byGroup.get(group) ?? 0) + n);
    }

    // ---- nothing mapped ------------------------------------------------------------
    if (byGroup.size === 0) {
        const fallback = FPL_TYPE_BUCKET[player.fplType] ?? 'MID';
        reasoning.push('None of the recorded slots mapped to a bucket, so FPL\'s registration stands in.');
        return {
            bucket: fallback,
            confidence: 'low',
            basis: 'projection',
            review: true,
            summary: `The slots on record did not map to anything. This is FPL's ${player.fplType} carried over.`,
            reasoning,
            sources,
        };
    }

    // ---- the answer ----------------------------------------------------------------
    // Whichever group he has played in most. Within it, the most played slot, which never
    // changes anyone's points because CB scores as FB and WA scores as CA.
    const ranked = [...byGroup.entries()].sort((a, b) => b[1] - a[1]);
    const [topGroup, topCount] = ranked[0];
    const total = [...byGroup.values()].reduce((n, v) => n + v, 0);
    const share = topCount / (total || 1);

    const inGroup = [...byBucket.entries()].filter(([b]) => BUCKET_GROUP[b] === topGroup).sort((a, b) => b[1] - a[1]);
    const bucket = inGroup[0][0];

    const thin = total < CONFIDENT_APPEARANCES;
    const review = share < DOMINANT_SHARE || amGuessed || wrongClub || thin;

    let confidence = 'high';
    if (share < CLEAR_SHARE || amGuessed) confidence = 'low';
    else if (share < DOMINANT_SHARE || thin || wrongClub) confidence = 'medium';

    reasoning.push(
        `${topCount} of ${total} appearances are in the ${topGroup} group (${Math.round(share * 100)}%), ` +
            `and ${bucket} is the most played slot within it.`,
    );
    if (thin) reasoning.push(`Only ${total} appearances in total, which is a small sample to read a pattern from.`);
    if (share < DOMINANT_SHARE && !amGuessed) {
        const [second, secondCount] = ranked[1] ?? [];
        reasoning.push(
            second
                ? `He is not settled in one group: ${secondCount} of his appearances are ${second} instead. ` +
                      'The answer is the larger half, not a clear pattern.'
                : 'The majority is thinner than we would like.',
        );
    }

    let summary;
    if (wrongClub) {
        summary =
            `Check this one: the appearances counted are ${fm.club}'s, not ${player.clubName || player.club}'s. ` +
            `On that record it is ${bucket}.`;
    } else if (share < DOMINANT_SHARE || amGuessed) {
        summary = `${bucket} on the balance of it, ${topCount} of ${total} appearances in the ${topGroup} group, but he moves around.`;
    } else {
        summary = `${Math.round(share * 100)}% of ${total} recorded appearances are in the ${topGroup} group, most often at ${bucket}.`;
    }

    return { bucket, confidence, basis: 'record', review, summary, reasoning, sources };
}
