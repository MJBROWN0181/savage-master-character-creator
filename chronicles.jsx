import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ConvexReactClient,
  useConvexAuth,
  useQuery,
  useMutation,
} from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { makeFunctionReference as ref } from "convex/server";
import { CharacterAccount } from "./account.jsx";
import "./chronicles.css";
import { BugMascot } from './bug-mascot.jsx';
import { ChronicleShare } from './chronicle-share.jsx';
const games = [
  "Any tabletop game",
  "Savage Worlds",
  "Dungeons & Dragons 5e",
  "Pathfinder 2e",
];
const kinds = ["Session tale", "Epic roll", "Character moment", "Table memory"];
function App() {
  const { isAuthenticated } = useConvexAuth(),
    eligible = useQuery(ref("chronicles:eligibility"));
  const [before, setBefore] = useState(null),
    [history, setHistory] = useState([]),
    [game, setGame] = useState("All games"),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [compose, setCompose] = useState(false),
    [draft, setDraft] = useState({
      title: "",
      body: "",
      game: games[0],
      kind: kinds[0],
      consent: false,
    }),
    [report, setReport] = useState(null),
    [reason, setReason] = useState(""),
    [removing, setRemoving] = useState(null);
  const [closeTome, setCloseTome] = useState(false),
    [reportingTome, setReportingTome] = useState(false);
  const archiveTome = useMutation(ref("chronicles:archiveTome")),
    reportTome = useMutation(ref("chronicles:reportTome"));
  const [view, setView] = useState("community"),
    [tomeId, setTomeId] = useState(undefined),
    [newTome, setNewTome] = useState(false),
    [tomeName, setTomeName] = useState(""),
    [tomeDescription, setTomeDescription] = useState("");
  const tomes = useQuery(ref("chronicles:tomes")) || [],
    follows = useQuery(ref("chronicles:following")),
    follow = useMutation(ref("chronicles:follow")),
    setFollowers = useMutation(ref("chronicles:setFollowers")),
    createTome = useMutation(ref("chronicles:createTome")),
    join = useMutation(ref("chronicles:join"));
  const selected = tomes.find((t) => t._id === tomeId);
  useEffect(() => {
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    if (
      draft.title.trim() ||
      draft.body.trim() ||
      tomeName.trim() ||
      tomeDescription.trim()
    )
      window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [draft.title, draft.body, tomeName, tomeDescription]);
  function changeView(v, id) {
    if (new URLSearchParams(location.search).has('post')) {
      const url = new URL(location.href); url.searchParams.delete('post'); history.replaceState(null, '', url.pathname + url.search + url.hash);
    }
    setView(v);
    setTomeId(id);
    setCloseTome(false);
    setReportingTome(false);
    setBefore(null);
    setHistory([]);
  }
  const sharedId = new URLSearchParams(location.search).get('post');
  const sharedPost = useQuery(ref('chronicles:post'), sharedId ? { id: sharedId } : 'skip');
  const communityFeed = useQuery(ref("chronicles:feed"), sharedId ? 'skip' : {
      before,
      tomeId,
      following: view === "following",
    }),
    publish = useMutation(ref("chronicles:publish")),
    toast = useMutation(ref("chronicles:toast")),
    remove = useMutation(ref("chronicles:remove")),
    flag = useMutation(ref("chronicles:report"));
  const feed = sharedId ? sharedPost === undefined ? undefined : { posts: sharedPost ? [sharedPost] : [], next: null } : communityFeed;
  async function act(fn, success) {
    setBusy(true);
    setMessage("");
    try {
      await fn();
      setMessage(success);
    } catch (error) {
      const known = [
        "Let the tale settle. Please try again later.",
        "You can create up to 10 Tomes.",
        "You can follow up to 200 storytellers.",
        "This player has followers turned off.",
        "Join this Tome before posting.",
        "Complete your public-profile review before sharing a tale.",
        "Check your title, story, and category.",
        "This tale is unavailable.",
        "Tome unavailable.",
      ];
      setMessage(
        known.find((text) => String(error?.message).includes(text)) ||
          "That action could not be completed. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  function field(k, val) {
    setDraft((d) => ({ ...d, [k]: val }));
  }
  return (
    <div className="chronicles">
      <header className="chron-nav">
        <a href="/" className="chron-brand">
          Savage Master <small>Stories worth keeping</small>
        </a>
        <nav aria-label="Main navigation">
          <a href="/">Home</a>
          <a href="/campaigns">Campaigns & journals</a>
          <a href="/profile">My profile & friends</a>
          <a href="/chronicles" aria-current="page">
            Chronicles
          </a>
        </nav>
      </header>
      <main>
        <section className="chron-hero">
          <div>
            <span className="chron-eyebrow">
              Gather around the storyteller’s fire
            </span>
            <h1>Chronicles</h1>
            <p>
              Every table has a tale. A daring rescue. A wildly unlikely roll. A
              friend who made the whole room laugh. Bring yours to the fire.
            </p>
            <button
              onClick={() => {
                setCompose(true);
                document.getElementById("chron-compose")?.scrollIntoView({
                  behavior: matchMedia("(prefers-reduced-motion: reduce)")
                    .matches
                    ? "instant"
                    : "smooth",
                });
              }}
            >
              ✦ Share a tale
            </button>
          </div>
          <div className="chron-art" aria-hidden="true">
            <span className="chron-moon">☾</span>
            <span className="chron-star">✧</span>
            <svg viewBox="0 0 320 220">
              <path
                d="M25 180 Q110 130 160 155 Q240 135 295 180L285 200Q205 165 160 185Q85 160 35 200Z"
                fill="#1e373d"
                stroke="#d9b978"
                strokeWidth="3"
              />
              <path
                d="M160 155V185M40 187Q100 151 145 172M175 172Q230 155 280 188"
                fill="none"
                stroke="#a48b5c"
                strokeWidth="2"
              />
              <path
                d="M137 142Q105 103 142 80Q128 111 159 119Q178 100 170 64Q220 114 183 142Z"
                fill="#deae61"
              />
              <path
                d="M151 138Q137 117 163 100Q157 120 177 129L172 144Z"
                fill="#ffe7b3"
              />
              <path
                d="M95 210L145 193M180 193L230 210"
                stroke="#6d8b87"
                strokeWidth="3"
              />
              <path
                d="M75 50L80 36L85 50L98 55L85 60L80 74L75 60L62 55ZM244 70L247 61L250 70L259 73L250 76L247 85L244 76L235 73Z"
                fill="#d9b978"
              />
            </svg>
            <span className="chron-art-caption">
              One spark becomes a legend
            </span>
          </div>
        </section>
        <nav className="chron-tabs" aria-label="Chronicles sections">
          <button
            className={view === "community" ? "" : "quiet"}
            aria-pressed={view === "community"}
            onClick={() => changeView("community")}
          >
            Around the fire
          </button>
          <button
            className={view === "following" ? "" : "quiet"}
            aria-pressed={view === "following"}
            disabled={!isAuthenticated}
            onClick={() => changeView("following")}
          >
            Following
          </button>
          <button
            className={view === "tomes" ? "" : "quiet"}
            aria-pressed={view === "tomes"}
            onClick={() => changeView("tomes", tomes[0]?._id)}
          >
            Tomes & groups
          </button>
          <button
            className={view === "market" ? "" : "quiet"}
            aria-pressed={view === "market"}
            onClick={() => changeView("market")}
          >
            Market shelf
          </button>
        </nav>
        {view === "tomes" && (
          <section className="chron-panel chron-tomes">
            <div className="chron-feed-heading">
              <div>
                <h2>Community Tomes</h2>
                <p>
                  Public gathering places for shared worlds, campaigns, and
                  gaming friendships.
                </p>
              </div>
              {isAuthenticated && eligible && (
                <button onClick={() => setNewTome(!newTome)}>
                  ✦ Create a Tome
                </button>
              )}
            </div>
            {newTome && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  act(async () => {
                    const id = await createTome({
                      name: tomeName,
                      description: tomeDescription,
                    });
                    setTomeName("");
                    setTomeDescription("");
                    setNewTome(false);
                    changeView("tomes", id);
                  }, "Your Tome is open.");
                }}
              >
                <label>
                  Tome name
                  <input
                    required
                    maxLength={70}
                    value={tomeName}
                    onChange={(e) => setTomeName(e.target.value)}
                  />
                </label>
                <label>
                  What brings your group together?
                  <textarea
                    maxLength={400}
                    value={tomeDescription}
                    onChange={(e) => setTomeDescription(e.target.value)}
                  />
                </label>
                <p>
                  Names, descriptions, members’ posts, and creator shop links
                  are public. Keep private campaign material in your journals.
                </p>
                <button disabled={busy}>Create public Tome</button>
              </form>
            )}
            <div className="chron-tome-grid">
              {tomes.map((t) => (
                <article
                  className={tomeId === t._id ? "selected" : ""}
                  key={t._id}
                >
                  <button
                    className="quiet"
                    onClick={() => changeView("tomes", t._id)}
                  >
                    {t.name}
                  </button>
                  <p>{t.description}</p>
                  <small>Opened by {t.creator}</small>
                  {isAuthenticated && (
                    <button
                      className="quiet"
                      disabled={busy || t.owner}
                      onClick={() =>
                        act(
                          () => join({ id: t._id, enabled: !t.joined }),
                          t.joined
                            ? "You left the Tome."
                            : "Welcome to the Tome.",
                        )
                      }
                    >
                      {t.owner
                        ? "Your Tome"
                        : t.joined
                          ? "Leave Tome"
                          : "Join Tome"}
                    </button>
                  )}
                </article>
              ))}
            </div>
            {!tomes.length && (
              <p>Be the first to open a Tome for your gaming community.</p>
            )}
            {selected && (
              <p>
                <strong>{selected.name}</strong> ·{" "}
                {selected.joined
                  ? "You are a member"
                  : "Open to everyone to read"}{" "}
                ·{" "}
                <button className="quiet" onClick={() => setView("market")}>
                  Visit its Market shelf
                </button>
              </p>
            )}
            {selected && isAuthenticated && (
              <div className="chron-actions">
                {selected.owner ? (
                  <button
                    className="quiet"
                    onClick={() => setCloseTome(!closeTome)}
                  >
                    Close Tome
                  </button>
                ) : (
                  <button
                    className="quiet"
                    onClick={() => {
                      setReportingTome(!reportingTome);
                      setReason("");
                    }}
                  >
                    Report Tome
                  </button>
                )}
              </div>
            )}
            {closeTome && selected && (
              <div>
                <p>Close this Tome and hide its stories from the community?</p>
                <button
                  disabled={busy}
                  onClick={() =>
                    act(async () => {
                      await archiveTome({ id: selected._id });
                      changeView("tomes");
                    }, "Tome closed.")
                  }
                >
                  Confirm close
                </button>{" "}
                <button className="quiet" onClick={() => setCloseTome(false)}>
                  Cancel
                </button>
              </div>
            )}
            {reportingTome && selected && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  act(async () => {
                    await reportTome({ id: selected._id, reason });
                    setReportingTome(false);
                  }, "Tome report recorded for review.");
                }}
              >
                <label>
                  Reason
                  <textarea
                    required
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
                <button disabled={busy}>Send Tome report</button>
              </form>
            )}
          </section>
        )}
        {view === "market" && (
          <section className="chron-panel">
            <span className="chron-eyebrow">Creators from your community</span>
            <h2>
              {selected
                ? selected.name + " · Market shelf"
                : "The Market shelf"}
            </h2>
            <p>
              Discover creator shops linked from reviewed profiles. These links
              open external stores; Savage Master does not handle purchases here
              yet.
            </p>
            <div className="chron-tome-grid">
              {(selected ? [selected] : tomes)
                .filter((t) => t.shops.length)
                .map((t) => (
                  <article key={t._id}>
                    <h3>{t.name}</h3>
                    <p>Curated by {t.creator}</p>
                    {t.shops.map((l, i) => (
                      <a
                        key={i}
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {l.label || "Visit creator shop"} ↗
                      </a>
                    ))}
                  </article>
                ))}
            </div>
            {!(selected ? [selected] : tomes).some((t) => t.shops.length) && (
              <p>
                No creator shops here yet. Tome owners can add shop links to
                their public profile and submit them for review.
              </p>
            )}
            <small>
              Check a seller’s reputation, delivery terms, and refund policy
              before buying. Never share sensitive information in posts.
            </small>
          </section>
        )}
        <div className="chron-layout">
          <section className="chron-feed" aria-label="Community tales">
            {!sharedId && <div id="chron-compose" className="chron-panel">
              <h2>
                {selected
                  ? `Add a chapter to ${selected.name}`
                  : "Your next chapter"}
              </h2>
              {!isAuthenticated ? (
                <>
                  <p>Sign in to share your stories and raise a toast.</p>
                  <CharacterAccount accountOnly />
                </>
              ) : !eligible ? (
                <p>
                  Make your <a href="/profile">public profile</a> ready and
                  complete its review before posting. You can still read tales
                  and raise a toast.
                </p>
              ) : selected && !selected.joined ? (
                <p>
                  Join this Tome to add a tale. Its stories are public, so
                  anyone can read them.
                </p>
              ) : compose ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    act(async () => {
                      await publish({ ...draft, tomeId });
                      setDraft({
                        title: "",
                        body: "",
                        game: games[0],
                        kind: kinds[0],
                        consent: false,
                      });
                      setCompose(false);
                      setBefore(null);
                      setHistory([]);
                    }, "Your tale has joined the Chronicles.");
                  }}
                >
                  <div className="chron-fields">
                    <label>
                      Game
                      <select
                        value={draft.game}
                        onChange={(e) => field("game", e.target.value)}
                      >
                        {games.map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Kind of tale
                      <select
                        value={draft.kind}
                        onChange={(e) => field("kind", e.target.value)}
                      >
                        {kinds.map((k) => (
                          <option key={k}>{k}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                  <label>
                    Give your tale a title
                    <input
                      required
                      maxLength={100}
                      value={draft.title}
                      onChange={(e) => field("title", e.target.value)}
                      placeholder="The night our goblin saved the kingdom"
                    />
                  </label>
                  <label>
                    What happened?
                    <textarea
                      required
                      maxLength={2000}
                      rows={6}
                      value={draft.body}
                      onChange={(e) => field("body", e.target.value)}
                      placeholder="Tell us about the moment, the people, and why you’ll remember it…"
                    />
                  </label>
                  <small>
                    {draft.body.length}/2,000 · Public community post · Avoid
                    campaign spoilers
                  </small>
                  <label className="chron-check">
                    <input
                      type="checkbox"
                      required
                      checked={draft.consent}
                      onChange={(e) => field("consent", e.target.checked)}
                    />
                    This is mine to share. I have permission to mention others,
                    and have removed private details.
                  </label>
                  <div className="chron-actions">
                    <button disabled={busy}>Publish tale</button>
                    <button
                      type="button"
                      className="quiet"
                      onClick={() => setCompose(false)}
                    >
                      Keep draft on this page
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p>
                    Your journals hold the details. Chronicles is where you
                    choose a moment to share.
                  </p>
                  <button onClick={() => setCompose(true)}>
                    ✦ Write your tale
                  </button>
                </>
              )}
            </div>}
            <div className="chron-feed-heading">
              {sharedId && <a href="/chronicles">Back to all Chronicles</a>}
              <h2>
                {sharedId ? 'Shared update' : selected
                  ? selected.name
                  : view === "following"
                    ? "Tales you follow"
                    : "Tales around the fire"}
              </h2>
              <label>
                Explore by game
                <select value={game} onChange={(e) => setGame(e.target.value)}>
                  {["All games", ...games].map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </label>
            </div>
            <p role="status" className="chron-status">
              {message}
            </p>
            {!feed ? (
              <p>Opening the storybook…</p>
            ) : feed.posts.filter(
                (p) => game === "All games" || p.game === game,
              ).length === 0 ? (
              <div className="chron-empty">
                <span aria-hidden="true">✧</span>
                <h3>
                  {view === "following"
                    ? "Your storytellers’ tales will gather here."
                    : selected
                      ? "A new Tome awaits its first chapter."
                      : game === "All games"
                        ? sharedId ? "This update is unavailable." : "The fire is lit. The first tale is yours."
                        : "No tales for this game on this page."}
                </h3>
                <p>
                  {view === "following"
                    ? "Follow a storyteller from their posts in Around the fire. You can always unfollow later."
                    : game === "All games"
                      ? sharedId ? "It may have been removed or is unavailable to this account." : "Share a real moment from your table and begin the Chronicles."
                      : "Try another game or browse the next page of stories."}
                </p>
              </div>
            ) : (
              feed.posts
                .filter((p) => game === "All games" || p.game === game)
                .map((p) => (
                  <article className="chron-post" key={p._id}>
                    {p.sharedBy && <p className="chron-shared-by"><a href={`/profile?user=${encodeURIComponent(p.sharedBy.handle)}`}>{p.sharedBy.name}</a> shared Bug’s update</p>}
                    <header>
                      <a
                        className="chron-author"
                        href={
                          "/profile?user=" + encodeURIComponent(p.author.handle)
                        }
                      >
                        {p.author.avatar ? (
                          <img src={p.author.avatar} alt="" />
                        ) : (
                          <span className="chron-avatar" aria-hidden="true">
                            ✦
                          </span>
                        )}
                        <span>
                          <strong>{p.author.name}</strong>
                          {p.author.official === 'bug' && <span className="bug-official">Official</span>}
                          <small>
                            {new Date(p.createdAt).toLocaleDateString(
                              undefined,
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </small>
                        </span>
                      </a>
                      <div className="chron-author-tools">
                        {isAuthenticated && !p.mine && p.allowFollowers && (
                          <button
                            className="quiet"
                            disabled={busy}
                            onClick={() =>
                              act(
                                () =>
                                  follow({
                                    handle: p.author.handle,
                                    enabled: !follows?.handles.includes(
                                      p.author.handle,
                                    ),
                                  }),
                                follows?.handles.includes(p.author.handle)
                                  ? "Storyteller unfollowed."
                                  : "Following this storyteller.",
                              )
                            }
                          >
                            {follows?.handles.includes(p.author.handle)
                              ? "Unfollow"
                              : "Follow"}
                          </button>
                        )}
                        <span className="chron-tag">{p.kind}</span>
                      </div>
                    </header>
                    <span className="chron-game">{p.game}</span>
                    <h3>{p.title}</h3>
                    <p className="chron-story">{p.body}</p>
                    <footer>
                      <button
                        className={p.toasted ? "toasted" : "quiet"}
                        aria-pressed={p.toasted}
                        disabled={!isAuthenticated || busy}
                        onClick={() =>
                          act(
                            () => toast({ id: p._id }),
                            p.toasted
                              ? "Toast withdrawn."
                              : "A toast to that adventure!",
                          )
                        }
                      >
                        ✧ {p.toasted ? "Toast raised" : "Raise a toast"}{" "}
                        <span>{p.toastCount}</span>
                      </button>
                      {p.mine ? (
                        <button
                          className="quiet"
                          onClick={() => setRemoving(p._id)}
                        >
                          Remove
                        </button>
                      ) : (
                        isAuthenticated && (
                          <button
                            className="quiet"
                            onClick={() => {
                              setReport(p._id);
                              setReason("");
                            }}
                          >
                            Report
                          </button>
                        )
                      )}
                    </footer>
                    {p.author.official === 'bug' && <ChronicleShare post={p} />}
                    {removing === p._id && (
                      <div className="chron-panel">
                        <p>Remove this tale from the community?</p>
                        <button
                          disabled={busy}
                          onClick={() =>
                            act(async () => {
                              await remove({ id: p._id });
                              setRemoving(null);
                            }, "Tale removed.")
                          }
                        >
                          Remove my tale
                        </button>{" "}
                        <button
                          className="quiet"
                          onClick={() => setRemoving(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {report === p._id && (
                      <form
                        className="chron-panel"
                        onSubmit={(e) => {
                          e.preventDefault();
                          act(async () => {
                            await flag({ id: p._id, reason });
                            setReport(null);
                          }, "Report recorded for review.");
                        }}
                      >
                        <label>
                          Why are you reporting this tale?
                          <textarea
                            required
                            maxLength={500}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                          />
                        </label>
                        <button disabled={busy}>Send report</button>{" "}
                        <button
                          className="quiet"
                          type="button"
                          onClick={() => setReport(null)}
                        >
                          Cancel
                        </button>
                      </form>
                    )}
                  </article>
                ))
            )}
            <div className="chron-actions">
              {history.length > 0 && (
                <button
                  className="quiet"
                  onClick={() => {
                    setBefore(history[history.length - 1]);
                    setHistory((h) => h.slice(0, -1));
                  }}
                >
                  Newer tales
                </button>
              )}
              {feed?.next && (
                <button
                  className="quiet"
                  onClick={() => {
                    setHistory((h) => [...h, before]);
                    setBefore(feed.next);
                  }}
                >
                  Older tales
                </button>
              )}
            </div>
          </section>
          <aside>
            <section className="chron-panel chron-bug-card"><BugMascot state="announce" size={78} /><span className="chron-eyebrow">Keeper of the code</span><h2>Meet Bug</h2><p>Follow our winged companion for official updates and setup tips. Share his posts with your table.</p><a href="/profile?user=bug">Visit Bug’s profile</a></section>
            {isAuthenticated && (
              <section className="chron-panel">
                <h2>Your campfire</h2>
                <label className="chron-check">
                  <input
                    type="checkbox"
                    checked={follows?.allowFollowers ?? true}
                    disabled={busy || !follows}
                    onChange={(e) =>
                      act(
                        () => setFollowers({ enabled: e.target.checked }),
                        "Follower setting saved.",
                      )
                    }
                  />
                  Allow others to follow my tales
                </label>
                <small>
                  Turn this off to hide Follow on your posts and exclude your
                  tales from Following feeds. Public posts remain readable.
                </small>
              </section>
            )}
            <section className="chron-panel">
              <span className="chron-eyebrow">The storyteller’s pact</span>
              <h2>A welcoming fire</h2>
              <p>
                Celebrate the players behind the heroes. Be kind, credit your
                companions, and ask before sharing someone else’s story.
              </p>
              <p>
                Keep secrets at your table. No private information, harassment,
                explicit content, or unwanted spoilers.
              </p>
              <small>
                Reports go to the site team for review. Blocking a player in
                Profiles hides your tales from each other while signed in.
                Public stories can still be read without an account.
              </small>
            </section>
            <section className="chron-prompt">
              <span aria-hidden="true">✦</span>
              <h2>Need a spark?</h2>
              <p>What was the moment your table cheered together?</p>
              <p>Who surprised everyone by doing the brave thing?</p>
              <a href="/campaigns">Return to your campaign journals →</a>
            </section>
            <section className="chron-panel">
              <h2>Across every realm</h2>
              <p>
                One profile. Every game. Your friendships and stories belong
                together.
              </p>
              <a href="/profile">Find your gaming friends →</a>
            </section>
            <section
              className="chron-sponsor"
              aria-label="Future sponsor space"
            >
              <small>Reserved for future sponsors</small>
              <p>A little room for discoveries from the tabletop world.</p>
            </section>
          </aside>
        </div>
      </main>
      <footer className="chron-bottom">
        Savage Master · Every adventure leaves a story.
      </footer>
    </div>
  );
}
const url = import.meta.env.VITE_CONVEX_URL;
const chronicleHost = document.getElementById('chroniclesRoot');
const chronicleRoot = chronicleHost ? import.meta.hot?.data.chronicleRoot || createRoot(chronicleHost) : null;
if (import.meta.hot && chronicleRoot) import.meta.hot.data.chronicleRoot = chronicleRoot;
chronicleRoot?.render(
  url ? (
    <ConvexAuthProvider client={new ConvexReactClient(url)}>
      <App />
    </ConvexAuthProvider>
  ) : (
    <p>Chronicles is temporarily unavailable.</p>
  ),
);
