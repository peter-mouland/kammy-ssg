/**
 * Write the rationale for a position, from evidence already gathered.
 *
 * The model does NOT choose the bucket. `classify-position.mjs` does that by counting, because
 * counting is free, repeatable and cannot hallucinate. What counting cannot do is explain
 * itself: "93% of 27 appearances are in the ATT group" is the statistic restated, not a reason
 * anyone can argue with.
 *
 * So the decision and the explanation are separate jobs, and only the explanation is paid for.
 * The model is handed the evidence and the verdict and asked to say why, and is told it may not
 * introduce a fact that is not in front of it. Everything it writes is therefore checkable
 * against the same three sources the row already links to.
 *
 * If the call fails, or `--no-model` is passed, the caller keeps the mechanical reasoning. A
 * row with dry reasoning is worth filing; a row that never gets filed because an API was down
 * is not.
 */

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Flash rather than Pro: this is summarising supplied text, not solving anything.
 *
 * Free tier covers this model, so a normal window costs nothing. For a pre-season review of
 * several hundred players, `gemini-3.1-flash-lite` with thinking off is roughly ten times
 * fewer output tokens and answers in about a second, at the cost of a vaguer rationale. It is
 * the only one of the three that accepts `thinkingBudget: 0`; Flash 3.6 and 3.5-flash-lite
 * reject the request outright.
 */
export const DEFAULT_MODEL = 'gemini-3.6-flash';
export const CHEAP_MODEL = 'gemini-3.1-flash-lite';

/** Free tier allows only a few requests a minute, so a 429 is expected rather than exceptional. */
const RETRY_DELAYS_MS = [4000, 12000, 30000];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const SYSTEM = `You explain a football position decision to a fantasy league admin who may
disagree with it and wants to be able to check.

Rules:
- The bucket has already been decided by counting appearances. Do not argue with it, explain it.
- Use ONLY the evidence supplied. Never add a fact, a club, a statistic or a source of your own.
- Where sources disagree, say so plainly. That disagreement is the most useful thing on the page.
- Prefer specifics over adjectives. "13 of 27 starts at right wing" beats "predominantly wide".
- If the evidence is thin, say what is missing rather than padding.
- No hedging phrases, no filler, no em dashes.

The six buckets: GK, CB centre back, FB full back and wing back, MID central midfield,
WA wide attacker, CA central attacker from the ten through to the striker. CB and FB score
identically, as do WA and CA, so only the defensive / midfield / attacking group affects points.

Reply as JSON only:
{"summary":"one sentence, under 25 words, stating the call and the single strongest reason",
 "reasoning":["3 or 4 points. Each must be traceable to the evidence. Include the numbers."]}`;

/**
 * @returns {{summary: string, reasoning: string[]} | null} null when the call could not be made,
 * so the caller can fall back rather than treating it as an error.
 */
export async function explain({ apiKey, evidenceText, verdict, player, model = DEFAULT_MODEL }) {
    // Reported rather than returned as null: a silently missing key looks exactly like a run
    // that chose not to write rationales, and the two need telling apart.
    if (!apiKey) return { error: 'GEMINI_API_KEY is not set' };

    const ask = `${SYSTEM}

DECISION ALREADY MADE: ${verdict.bucket ?? 'none, the appearances do not settle the group'}
Confidence: ${verdict.confidence}. Basis: ${verdict.basis}.

${evidenceText}`;

    // No tools. Grounding would let it search, which is exactly what we do not want: the whole
    // point is that every claim traces to the evidence already fetched.
    const body = JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: ask }] }],
        generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
            // Only the lite model accepts this, and only it needs it.
            ...(model === CHEAP_MODEL ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
        },
    });

    let json;
    for (let attempt = 0; ; attempt += 1) {
        let res;
        try {
            res = await fetch(`${ENDPOINT}/${model}:generateContent`, {
                method: 'POST',
                headers: { 'x-goog-api-key': apiKey, 'content-type': 'application/json' },
                body,
            });
        } catch (error) {
            return { error: `network: ${error.message}` };
        }

        if (res.ok) {
            json = await res.json();
            break;
        }

        const text = await res.text();
        let message = `HTTP ${res.status}`;
        try {
            message = JSON.parse(text).error?.message ?? message;
        } catch {
            // keep the status
        }

        // Free tier is a few requests a minute, so waiting is the correct response to a 429.
        const retryable = res.status === 429 || res.status >= 500;
        if (!retryable || attempt >= RETRY_DELAYS_MS.length) return { error: message.slice(0, 160) };
        await sleep(RETRY_DELAYS_MS[attempt]);
    }
    const text = (json.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
    const usage = json.usageMetadata ?? {};

    let parsed;
    try {
        parsed = JSON.parse(text.replace(/^```json\s*|\s*```$/g, ''));
    } catch {
        return { error: 'the model did not return usable JSON' };
    }

    const reasoning = Array.isArray(parsed.reasoning) ? parsed.reasoning.filter(Boolean).map(String) : [];
    if (!parsed.summary || reasoning.length === 0) return { error: 'the model returned an empty rationale' };

    return {
        summary: String(parsed.summary),
        reasoning,
        tokens: {
            input: usage.promptTokenCount ?? 0,
            output: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
        },
        player,
    };
}
