/** One opponent-Leader journal under users/{uid}/rivals/{leaderId}. */
export interface RivalVsDeckNotes {
  deckId: string;
  /** Snapshot so a deleted deck still has a label. */
  deckName: string;
  notes: string;
  wins: number;
  losses: number;
  updatedAt?: unknown;
  updatedAtMs: number;
}

export interface RivalJournal {
  leaderId: string;
  /** Engine staples for this matchup (presence only). */
  keyPieceIds: string[];
  /** Flex / edge cards; mutually exclusive with keyPieceIds. */
  techOptionIds: string[];
  /** Freeform matchup notes (not tied to one of your decks). */
  notes: string;
  /** Notes + W/L for your deck vs this Leader. */
  vsDecks: Record<string, RivalVsDeckNotes>;
  createdAt?: unknown;
  updatedAt?: unknown;
  updatedAtMs: number;
}

export const RIVAL_NOTES_MAX = 5000;
export const RIVAL_DECK_NAME_MAX = 120;
export const RIVAL_CARD_LIST_MAX = 200;
export const RIVAL_VS_DECKS_MAX = 100;
