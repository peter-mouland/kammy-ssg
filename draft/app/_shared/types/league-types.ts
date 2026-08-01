// app/_shared/types/league-types.ts

/**
 * The shared kernel: the vocabulary the whole league is described in.
 *
 * Why this file exists
 * --------------------
 * "Types live in the domain that owns the concept" (ai-contribution-rules.md) has no
 * answer for concepts that no single domain owns. A division is not a teams concept --
 * the draft, transfers, scoring, leagues and the cup all deal in divisions. Because
 * there was nowhere else to put it, DivisionId ended up in teams/types/team-types.ts,
 * and every other domain -- plus _shared itself -- had to reach into teams to say the
 * most basic thing about the app.
 *
 * What belongs here
 * -----------------
 * A type earns a place here only if it is genuinely league-wide AND has no dependency
 * on any single domain's business logic. Everything below is an identifier or a plain
 * record: no behaviour, no domain rules.
 *
 * Adding to this file needs a note in .kiro/backlog.md. It is a shared kernel, not a
 * second dumping ground -- the failure mode we are moving away from is exactly a
 * general-purpose module that every domain depends on.
 */

/** The three divisions. premierLeague > championship > leagueOne. */
/**
 * `greatScott` is a standalone division: no promotion, no relegation, not in the cup.
 * What each division takes part in is data, not position — see `DivisionSheetData`.
 */
export type DivisionId = 'leagueOne' | 'championship' | 'premierLeague' | 'greatScott';

/** A manager's user id, as used in the Google Sheets. */
export type ManagerId = string;

export interface DivisionSheetData {
    id: DivisionId;
    label: string;
    order: number;
    /**
     * What this division takes part in, straight from the `Divisions` sheet.
     *
     * These used to be inferred from the id — promotion was `id !== 'premierLeague'`,
     * relegation was `id !== 'leagueOne'` — which quietly encoded "there are exactly three
     * divisions and they form one pyramid". `greatScott` is a fourth division that takes
     * part in none of it, and position cannot express that: by order it is bottom, which
     * would have moved relegation onto it and off leagueOne.
     *
     * So each division states its own rules and the sheet is the source of truth.
     */
    promotion: boolean;
    relegation: boolean;
    cup: boolean;
}

export interface UserTeamsSheetData {
    userId: ManagerId;
    userName: string;
    teamName: string;
    divisionId: DivisionId;
    lastUpdated: Date;
}

/**
 * Our positions, which differ from FPL's four-type system. Scoring, draft eligibility
 * and squad shape are all defined against these.
 */
export type CustomPosition = 'gk' | 'fb' | 'cb' | 'mid' | 'wa' | 'ca';

/** A position as it appears in a squad, including the two slots that are not positions. */
export type RosterPosition = CustomPosition | 'sub' | 'on_loan';

/**
 * The 13 fixed slots every squad has.
 * NOTE: underscore notation matches the sheet column names.
 */
export type PositionSlotKey =
    | 'gk_0'
    | 'cb_0'
    | 'cb_1'
    | 'fb_0'
    | 'fb_1'
    | 'mid_0'
    | 'mid_1'
    | 'wa_0'
    | 'wa_1'
    | 'ca_0'
    | 'ca_1'
    | 'sub_0'
    | 'on_loan_0';
