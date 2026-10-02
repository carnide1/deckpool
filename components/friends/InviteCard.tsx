"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { UsernameClaimForm } from "@/components/friends/UsernameClaimForm";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { useFriends } from "@/contexts/FriendsContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { isPermissionDenied } from "@/lib/firestoreErrors";
import { relationshipWith } from "@/lib/friendIds";
import {
  getInvite,
  invitePagePath,
  isInviteCurrent,
  isInviteExpired,
} from "@/lib/invites";
import type { Invite } from "@/types/friends";

type LoadedInvite = { code: string; invite: Invite | null; expired: boolean };
type CurrentCheck = { key: string; current: boolean };

const linkButton =
  "inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold";
const primaryLink = `${linkButton} bg-[var(--accent-pirate-red)] text-white hover:opacity-90`;
const secondaryLink = `${linkButton} border border-[var(--bg-inset)] bg-[var(--bg-panel)] text-[var(--ink-primary)] hover:bg-[var(--bg-inset)]`;

function Panel({ children }: { children: ReactNode }) {
  return (
    <section className="poster-panel flex w-full max-w-md flex-col gap-4 p-6 text-center">
      {children}
    </section>
  );
}

function Loading() {
  return <p className="text-sm text-[var(--ink-muted)]">Loading invite…</p>;
}

function ExpiredView() {
  return (
    <Panel>
      <p className="poster-stamp mx-auto">Invite expired</p>
      <p className="text-sm text-[var(--ink-muted)]">
        This invite link has expired or doesn&apos;t exist. Ask them for a new
        one.
      </p>
      <Link href="/" className={`${secondaryLink} mx-auto`}>
        Go to DeckPool
      </Link>
    </Panel>
  );
}

/**
 * Landing for /invite/{code}. Opening it writes nothing; only the Send / Accept
 * buttons do, so link previews in messaging apps can't trigger a request.
 */
export function InviteCard({ code }: { code: string }) {
  const { user, loading: authLoading } = useAuth();
  const { publicProfile, publicProfileLoading } = useUserProfile();
  const {
    friendUids,
    incoming,
    outgoing,
    loading: friendsLoading,
    sendRequest,
    acceptRequest,
  } = useFriends();
  const [loaded, setLoaded] = useState<LoadedInvite | null>(null);
  const [check, setCheck] = useState<CurrentCheck | null>(null);
  const [busy, setBusy] = useState(false);
  const [staleAfterSend, setStaleAfterSend] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getInvite(code)
      .then((invite) => {
        if (cancelled) return;
        setLoaded({
          code,
          invite,
          expired: invite ? isInviteExpired(invite, Date.now()) : true,
        });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setLoaded({ code, invite: null, expired: true });
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  const current = loaded?.code === code ? loaded : null;
  const invite = current && !current.expired ? current.invite : null;
  const uid = user?.uid ?? null;
  const hasUsername = Boolean(publicProfile?.username);
  const checkKey = invite && uid ? `${invite.code}:${uid}` : null;
  const needsCheck = Boolean(
    invite && uid && hasUsername && invite.inviterUid !== uid,
  );

  useEffect(() => {
    if (!needsCheck || !invite || !checkKey) return;
    let cancelled = false;
    isInviteCurrent(invite)
      .then((ok) => {
        if (!cancelled) setCheck({ key: checkKey, current: ok });
      })
      .catch((error) => {
        // Unknown (e.g. offline): let the request rule decide on Send.
        console.error(error);
        if (!cancelled) setCheck({ key: checkKey, current: true });
      });
    return () => {
      cancelled = true;
    };
  }, [needsCheck, invite, checkKey]);

  if (authLoading || !current) return <Loading />;
  if (!invite) return <ExpiredView />;

  const name = invite.inviterDisplayName.trim() || `@${invite.inviterUsername}`;
  const invitedLine = (
    <p className="text-base text-[var(--ink-primary)]">
      <span className="font-semibold">{name}</span>{" "}
      <span className="text-[var(--ink-muted)]">(@{invite.inviterUsername})</span>{" "}
      invited you to be friends on DeckPool.
    </p>
  );

  if (!user) {
    const next = encodeURIComponent(invitePagePath(code));
    return (
      <Panel>
        {invitedLine}
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/signup?next=${next}`} className={primaryLink}>
            Sign up
          </Link>
          <Link href={`/login?next=${next}`} className={secondaryLink}>
            Log in
          </Link>
        </div>
      </Panel>
    );
  }

  if (publicProfileLoading) return <Loading />;

  if (!hasUsername) {
    return (
      <Panel>
        {invitedLine}
        <p className="text-sm text-[var(--ink-muted)]">
          Pick a username first so they know who you are.
        </p>
        <div className="text-left">
          <UsernameClaimForm />
        </div>
      </Panel>
    );
  }

  if (invite.inviterUid === user.uid) {
    return (
      <Panel>
        <p className="text-sm text-[var(--ink-primary)]">
          This is your own invite link. Send it to someone you want to add.
        </p>
        <Link href="/friends" className={`${secondaryLink} mx-auto`}>
          Go to Friends
        </Link>
      </Panel>
    );
  }

  const checked = check?.key === checkKey ? check : null;
  if (staleAfterSend || (checked && !checked.current)) return <ExpiredView />;
  if (friendsLoading || !checked) return <Loading />;

  const relation = relationshipWith(invite.inviterUid, {
    selfUid: user.uid,
    friendUids,
    incomingFromUids: new Set(incoming.map((row) => row.fromUid)),
    outgoingToUids: new Set(outgoing.map((row) => row.toUid)),
  });

  const run = async (action: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await action();
      toast.success(ok);
    } catch (error) {
      console.error(error);
      if (isPermissionDenied(error)) {
        setStaleAfterSend(true);
      } else {
        toast.error(
          error instanceof Error ? error.message : "Something went wrong",
        );
      }
    } finally {
      setBusy(false);
    }
  };

  if (relation === "friend") {
    return (
      <Panel>
        <p className="text-sm text-[var(--ink-primary)]">
          You&apos;re already friends with {name}.
        </p>
        <Link
          href={`/friends/${invite.inviterUid}`}
          className={`${primaryLink} mx-auto`}
        >
          View their page
        </Link>
      </Panel>
    );
  }

  if (relation === "outgoing") {
    return (
      <Panel>
        <p className="text-sm text-[var(--ink-primary)]">
          Request sent. You&apos;ll be friends once {name} accepts.
        </p>
        <Link href="/friends" className={`${secondaryLink} mx-auto`}>
          Go to Friends
        </Link>
      </Panel>
    );
  }

  if (relation === "incoming") {
    return (
      <Panel>
        <p className="text-sm text-[var(--ink-primary)]">
          {name} already sent you a request.
        </p>
        <Button
          className="mx-auto"
          disabled={busy}
          onClick={() =>
            void run(
              () => acceptRequest(invite.inviterUid),
              `You and @${invite.inviterUsername} are friends`,
            )
          }
        >
          {busy ? "Working…" : "Accept"}
        </Button>
      </Panel>
    );
  }

  return (
    <Panel>
      {invitedLine}
      <Button
        className="mx-auto"
        disabled={busy}
        onClick={() =>
          void run(
            () => sendRequest(invite.inviterUid, invite.inviterUsername),
            `Request sent to @${invite.inviterUsername}`,
          )
        }
      >
        {busy ? "Sending…" : "Send friend request"}
      </Button>
    </Panel>
  );
}
