import { doc, getDoc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";
import type { CardPref } from "@/types/cardPref";

function cardPrefRef(uid: string, cardId: string) {
  return doc(getFirebaseDb(), "users", uid, "cardPrefs", cardId);
}

export async function getPreferredImage(
  uid: string,
  cardId: string,
): Promise<string | null> {
  const snap = await getDoc(cardPrefRef(uid, cardId));
  if (!snap.exists()) return null;
  const data = snap.data() as CardPref;
  return data.preferredImageUrl ?? null;
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
