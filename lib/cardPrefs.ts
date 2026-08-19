import { collection, doc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export function userCardPrefsRef(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "cardPrefs");
}

function cardPrefRef(uid: string, cardId: string) {
  return doc(getFirebaseDb(), "users", uid, "cardPrefs", cardId);
}

export function imageForCard(
  card: { id: string; images: string[] },
  preferredByCardId: Record<string, string>,
): string | null {
  const preferred = preferredByCardId[card.id];
  if (preferred && card.images.includes(preferred)) return preferred;
  return card.images[0] ?? null;
}

export async function setPreferredImage(
  uid: string,
  cardId: string,
  preferredImageUrl: string,
): Promise<void> {
  await setDoc(
    cardPrefRef(uid, cardId),
    { preferredImageUrl },
    { merge: true },
  );
}
