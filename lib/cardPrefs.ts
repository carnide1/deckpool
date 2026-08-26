import { collection, doc, setDoc } from "firebase/firestore";
import { getFirebaseDb } from "@/lib/firebase";

export {
  displayImageCandidates,
  getCardImageMirrorOrigin,
  imageCandidates,
  imageForCard,
  publicImageUrl,
  urlsForCatalogImage,
} from "@/lib/cardImageUrl";

export function userCardPrefsRef(uid: string) {
  return collection(getFirebaseDb(), "users", uid, "cardPrefs");
}

function cardPrefRef(uid: string, cardId: string) {
  return doc(getFirebaseDb(), "users", uid, "cardPrefs", cardId);
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
