"use client";

import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { TextInput } from "@/components/ui/TextInput";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/contexts/FriendsContext";
import { relationshipWith } from "@/lib/friendIds";
import { lookupUsername, UNKNOWN_USERNAME_MESSAGE } from "@/lib/friends";
import { normalizeUsername, validateUsername } from "@/lib/usernames";

export function AddFriendForm() {
  const { user } = useAuth();
  const { friendUids, incoming, outgoing, sendRequest, acceptRequest } =
    useFriends();
  const [value, setValue] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pendingAccept, setPendingAccept] = useState<{
    uid: string;
    username: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setMessage(null);
    setPendingAccept(null);

    const name = normalizeUsername(value);
    const invalid = validateUsername(name);
    if (invalid) {
      setMessage(UNKNOWN_USERNAME_MESSAGE);
      return;
    }

    setBusy(true);
    try {
      const targetUid = await lookupUsername(name);
      if (!targetUid) {
        setMessage(UNKNOWN_USERNAME_MESSAGE);
        return;
      }
      const relation = relationshipWith(targetUid, {
        selfUid: user.uid,
        friendUids,
        incomingFromUids: new Set(incoming.map((row) => row.fromUid)),
        outgoingToUids: new Set(outgoing.map((row) => row.toUid)),
      });
      switch (relation) {
        case "self":
          setMessage("That's you.");
          return;
        case "friend":
          setMessage("Already friends.");
          return;
        case "outgoing":
          setMessage("Request already sent.");
          return;
        case "incoming":
          setPendingAccept({ uid: targetUid, username: name });
          return;
        case "none":
          await sendRequest(targetUid, name);
          toast.success(`Request sent to @${name}`);
          setValue("");
          return;
      }
    } catch (error) {
      console.error(error);
      setMessage(UNKNOWN_USERNAME_MESSAGE);
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async () => {
    if (!pendingAccept) return;
    setBusy(true);
    try {
      await acceptRequest(pendingAccept.uid);
      toast.success(`You and @${pendingAccept.username} are friends`);
      setPendingAccept(null);
      setValue("");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not accept request",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="poster-panel p-5">
      <h2 className="font-display text-lg font-bold text-[var(--ink-primary)]">
        Add friend
      </h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        Enter their exact username.
      </p>
      <form
        onSubmit={(event) => void handleSubmit(event)}
        className="mt-3 flex flex-wrap items-start gap-2"
      >
        <div className="min-w-0 flex-1">
          <TextInput
            aria-label="Friend's username"
            autoCapitalize="none"
            autoComplete="off"
            spellCheck={false}
            placeholder="username"
            value={value}
            onChange={(event) => {
              setValue(event.target.value);
              setMessage(null);
              setPendingAccept(null);
            }}
          />
        </div>
        <Button type="submit" disabled={busy || !value.trim()}>
          {busy ? "Working…" : "Send"}
        </Button>
      </form>
      {message ? (
        <p className="mt-2 text-sm text-[var(--ink-muted)]" role="status">
          {message}
        </p>
      ) : null}
      {pendingAccept ? (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-[var(--ink-primary)]">
            @{pendingAccept.username} already sent you a request.
          </span>
          <Button size="sm" onClick={() => void handleAccept()} disabled={busy}>
            Accept
          </Button>
        </div>
      ) : null}
    </section>
  );
}
