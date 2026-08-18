import { getOwnedCardCount } from "@/lib/users";

/** Post-login destination per blueprint: Decks, or Collection if binder is empty. */
export async function getPostLoginPath(uid: string): Promise<string> {
  try {
    const owned = await getOwnedCardCount(uid);
    return owned === 0 ? "/collection" : "/decks";
  } catch {
    return "/decks";
  }
}
