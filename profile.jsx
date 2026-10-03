import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import {
  ConvexReactClient,
  useConvexAuth,
  useQuery,
  useMutation,
  useAction,
} from "convex/react";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { makeFunctionReference as ref } from "convex/server";
import { CharacterAccount } from "./account.jsx";
import "./campaigns.css";
import "./profile.css";
import {FriendsArea,FriendActions} from "./profile-friends.jsx";
import { BugGuide } from './bug-mascot.jsx';
import { BugProfile } from './bug-profile.jsx';
const blank = {
  handle: `table-${crypto.randomUUID().slice(0, 8)}`,
  displayName: "",
  bio: "",
  games: [],
  memory: "",
  roles: [],
  links: [],
  favorites: [],
  highlights: [],
  appearance: {
    background: "midnight",
    accent: "gold",
    font: "classic",
    layout: "balanced",
    sections: ["about", "games", "memory", "characters", "journal"],
  },
};
const titles = {
  about: "About me",
  games: "Games at my table",
  memory: "A memory worth keeping",
  characters: "Favorite characters",
  journal: "Journal highlights",
};
function ProfileCard({ p, characters = [] }) {
  const content = {
    about: p.bio && <p>{p.bio}</p>,
    games: p.games.some((g) => g.trim()) && (
      <div className="tags">
        {p.games
          .filter((g) => g.trim())
          .map((g, i) => (
            <span key={i}>{g.trim()}</span>
          ))}
      </div>
    ),
    memory: p.memory && <p>{p.memory}</p>,
    characters: p.favorites.length > 0 && (
      <div className="character-cards">
        {p.favorites.map((f, i) => (
          <article key={f.characterId || i}>
            {f.imageUrl && <img src={f.imageUrl} alt="" />}
            <h3>
              {f.name ||
                characters.find((c) => c._id === f.characterId)?.name ||
                "Character"}
            </h3>
          </article>
        ))}
      </div>
    ),
    journal:
      p.highlights.length > 0 &&
      p.highlights.map((h, i) => <blockquote key={i}>{h.excerpt}</blockquote>),
  };
  return (
    <div
      className={`profile-card bg-${p.appearance.background} accent-${p.appearance.accent} font-${p.appearance.font} layout-${p.appearance.layout}`}
      style={
        p.backgroundUrl
          ? {
              backgroundImage: `linear-gradient(#141c20d9,#141c20e8),url("${p.backgroundUrl}")`,
            }
          : undefined
      }
    >
      <div className="profile-identity">
        {p.avatarUrl ? (
          <img
            className="avatar"
            src={p.avatarUrl}
            alt={`${p.displayName || p.handle}'s profile`}
          />
        ) : (
          <div className="avatar avatar-placeholder" aria-hidden="true">
            {(p.displayName || p.handle || "?").slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <span className="profile-eyebrow">
            Savage Master · Tabletop adventurer
          </span>
          <h1>{p.displayName || p.handle || "Your name here"}</h1>
          <div className="tags">
            {p.roles.map((r) => (
              <span key={r}>{r === "gm" ? "Game Master" : "Player"}</span>
            ))}
          </div>
        </div>
      </div>
      <div className="profile-sections">
        {p.appearance.sections.map(
          (s) =>
            content[s] && (
              <section key={s}>
                <h2>{titles[s]}</h2>
                {content[s]}
              </section>
            ),
        )}
      </div>
      {p.links.length > 0 && (
        <section>
          <h2>Around my table</h2>
          <div className="profile-links">
            {p.links.map((l, i) => (
              <a
                key={i}
                href={/^https:\/\//i.test(l.url) ? l.url : undefined}
                target="_blank"
                rel="noopener noreferrer nofollow ugc"
              >
                {l.kind === "shop" ? "Shop · " : ""}
                {l.label} ↗
              </a>
            ))}
          </div>
          <small>
            External links are shared by this user. Savage Master does not
            endorse these shops.
          </small>
        </section>
      )}
    </div>
  );
}
function Editor({ initial, characters, journals, onStatus, onCreated }) {
  const fingerprint = (value) => JSON.stringify(Object.fromEntries([...Object.keys(blank), 'avatarId', 'backgroundId'].map(key => [key, key === 'favorites' ? value.favorites.map(({characterId,imageId}) => ({characterId,imageId})) : value[key]])));
  const [savedFingerprint,setSavedFingerprint] = useState(() => fingerprint(initial || blank));
  const [tab, setTab] = useState("about"),
    [guided, setGuided] = useState(!initial);
  const steps = [
    ["about", "About you"],
    ["style", "Appearance"],
    ["showcase", "Showcase"],
    ["links", "Links"],
    ["share", "Review & save"],
  ];
  const step = steps.findIndex(([id]) => id === tab);
  const [draft, setDraft] = useState(initial || blank),
    [age, setAge] = useState(false),
    [policy, setPolicy] = useState(false),
    [busy, setBusy] = useState(false);
  const hasUnsavedChanges = fingerprint(draft) !== savedFingerprint;
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const warn = (event) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasUnsavedChanges]);
  const save = useMutation(ref("profiles:save")),
    uploadUrl = useMutation(ref("profiles:uploadUrl")),
    validate = useAction(ref("profileImages:validate")),
    review = useMutation(ref("profiles:requestReview")),
    unpublish = useMutation(ref("profiles:unpublish"));
  const field = (k, value) => setDraft((d) => ({ ...d, [k]: value }));
  async function run(fn) {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      onStatus(
        e.message.includes("Uncaught Error:")
          ? e.message.split("Uncaught Error:")[1].split("\n")[0]
          : "Unable to save. Check your entries and try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function upload(file, target, index) {
    if (!file) return;
    await run(async () => {
      if (
        !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
        file.size > 4 * 1024 * 1024
      )
        throw new Error("Uncaught Error: Use PNG, JPEG, or WebP under 4 MB.");
      const image = new Image(),
        objectUrl = URL.createObjectURL(file);
      try {
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () =>
            reject(
              new Error("Uncaught Error: This image could not be opened."),
            );
          image.src = objectUrl;
        });
        if (image.width * image.height > 25000000)
          throw new Error(
            "Uncaught Error: Image is too large. Use less than 25 megapixels.",
          );
        const canvas = document.createElement("canvas"),
          scale = Math.min(1, 1600 / Math.max(image.width, image.height));
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas
          .getContext("2d")
          .drawImage(image, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/webp", 0.85),
        );
        if (!blob)
          throw new Error("Uncaught Error: Image could not be processed.");
        const response = await fetch(await uploadUrl({}), {
          method: "POST",
          headers: { "Content-Type": "image/webp" },
          body: blob,
        });
        if (!response.ok) throw new Error("Upload failed");
        const { storageId } = await response.json();
        await validate({ storageId });
        const preview = URL.createObjectURL(blob);
        if (target === "character")
          field(
            "favorites",
            draft.favorites.map((f, i) =>
              i === index ? { ...f, imageId: storageId, imageUrl: preview } : f,
            ),
          );
        else
          setDraft((d) => ({
            ...d,
            [target + "Id"]: storageId,
            [target + "Url"]: preview,
          }));
        onStatus("Image uploaded. Save your draft to keep it.");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    });
  }
  async function persist() {
    const payload = Object.fromEntries(
      Object.keys(blank).map((k) => [k, draft[k]]),
    );
    payload.favorites = draft.favorites.map(({ characterId, imageId }) => ({
      characterId,
      ...(imageId ? { imageId } : {}),
    }));
    payload.highlights = draft.highlights.map(({ journalId, excerpt }) => ({
      journalId,
      excerpt,
    }));
    for (const k of ["avatarId", "backgroundId"])
      if (draft[k]) payload[k] = draft[k];
    await save({ ...payload, ageConfirmed: age });
    setSavedFingerprint(fingerprint(draft));
    if (!initial) onCreated();
  }
  const appearance = (k, value) =>
    field("appearance", { ...draft.appearance, [k]: value });
  function move(i, step) {
    const sections = [...draft.appearance.sections],
      j = i + step;
    if (j < 0 || j >= sections.length) return;
    [sections[i], sections[j]] = [sections[j], sections[i]];
    appearance("sections", sections);
  }
  return (
    <>
      <section id="profile-settings" className="profile-settings">
        <div className="profile-settings-top">
          <div>
            <h2>{initial ? "Make it yours" : "Build your profile"}</h2>
            <p>
              Small steps. Your own gaming home. Everything you enter stays in
              your draft until you save.
            </p>
          </div>
          <div className="profile-settings-actions">
          <a href="#profile-preview">Preview my page</a>
          <button
            type="button"
            onClick={() => {
              setGuided(true);
              setTab("about");
            }}
          >
            Start here
          </button>
          </div>
        </div>
        <div
          role="tablist"
          aria-label="Profile settings"
          className="profile-tabs"
          onKeyDown={(event) => {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            event.preventDefault();
            const next = event.key === 'Home' ? 0 : event.key === 'End' ? steps.length - 1 : (step + (event.key === 'ArrowRight' ? 1 : -1) + steps.length) % steps.length;
            setTab(steps[next][0]);
            setGuided(false);
            document.getElementById('tab-' + steps[next][0])?.focus();
          }}
        >
          {steps.map(([id, label], i) => (
            <button
              key={id}
              id={"tab-" + id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              tabIndex={tab === id ? 0 : -1}
              aria-controls={"panel-" + id}
              onClick={() => {
                setTab(id);
                setGuided(false);
              }}
            >
              {guided ? `${i + 1}. ` : ""}
              {label}
            </button>
          ))}
        </div>
        {guided && (
          <BugGuide step={step}>
              Step {step + 1} of {steps.length}.{' '}
              {
                [
                  "Start with a name and picture, or leave them for later. Your Player and GM roles share this profile.",
                  "Choose your colors, font, and layout. Upload your own background to make this page yours.",
                  "Choose the characters and player memories you want visitors to see. Private GM notes stay private.",
                  "Add your social pages, artwork shop, or marketplace listings. These are optional.",
                  "Preview your page, confirm your age, and save privately. Request sharing only when you are ready.",
                ][step]
              }
          </BugGuide>
        )}
        {tab === "about" && (
          <div
            role="tabpanel"
            id="panel-about"
            aria-labelledby="tab-about"
            className="profile-tab-panel"
          >
            {" "}
            <label>
              Profile address
              <input
                required
                pattern="[a-z0-9][a-z0-9-]{2,29}"
                maxLength={30}
                value={draft.handle}
                disabled={!!initial}
                onChange={(e) => field("handle", e.target.value.toLowerCase())}
              />
              <small>
                3–30 lowercase letters, numbers, or hyphens. This address stays
                fixed after creation.
              </small>
            </label>
            <label>
              Display name
              <input
                maxLength={80}
                value={draft.displayName}
                onChange={(e) => field("displayName", e.target.value)}
              />
            </label>
            <fieldset>
              <legend>At the table, I am…</legend>
              {["player", "gm"].map((r) => (
                <label className="check" key={r}>
                  <input
                    type="checkbox"
                    checked={draft.roles.includes(r)}
                    onChange={(e) =>
                      field(
                        "roles",
                        e.target.checked
                          ? [...draft.roles, r]
                          : draft.roles.filter((x) => x !== r),
                      )
                    }
                  />
                  {r === "gm" ? "A Game Master" : "A Player"}
                </label>
              ))}
            </fieldset>
            <label>
              Profile picture
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                onChange={(e) => upload(e.target.files[0], "avatar")}
              />
            </label>
            {draft.avatarId && (
              <button
                type="button"
                onClick={() =>
                  setDraft((d) => ({
                    ...d,
                    avatarId: undefined,
                    avatarUrl: null,
                  }))
                }
              >
                Remove profile picture
              </button>
            )}
            <label>
              Short bio · 600 characters
              <textarea
                maxLength={600}
                value={draft.bio}
                onChange={(e) => field("bio", e.target.value)}
              />
            </label>
            <label>
              Tabletop games you play · separated by commas
              <input
                maxLength={1600}
                value={draft.games.join(",")}
                onChange={(e) =>
                  field("games", e.target.value.split(",").slice(0, 20))
                }
              />
            </label>
            <label>
              Favorite tabletop memory · 1,500 characters
              <textarea
                maxLength={1500}
                value={draft.memory}
                onChange={(e) => field("memory", e.target.value)}
              />
            </label>
          </div>
        )}
        {tab === "style" && (
          <div
            role="tabpanel"
            id="panel-style"
            aria-labelledby="tab-style"
            className="profile-tab-panel"
          >
            {" "}
            <fieldset>
              <legend>Your page style</legend>
              {Object.entries({
                background: ["midnight", "forest", "parchment"],
                accent: ["gold", "teal", "rose"],
                font: ["classic", "modern", "book"],
                layout: ["balanced", "stacked", "showcase"],
              }).map(([k, options]) => (
                <label key={k}>
                  {k[0].toUpperCase() + k.slice(1)}
                  <select
                    value={draft.appearance[k]}
                    onChange={(e) => appearance(k, e.target.value)}
                  >
                    {options.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </label>
              ))}
              <p className="upload-hint">
                Use your own art, a favorite landscape, or a tabletop photo.
                PNG, JPEG, or WebP · up to 4 MB. Your picture is softened behind
                the page so your story stays readable.
              </p>
              <label>
                Upload your own background
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  disabled={busy}
                  onChange={(e) => upload(e.target.files[0], "background")}
                />
              </label>
              {draft.backgroundId && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      backgroundId: undefined,
                      backgroundUrl: null,
                    }))
                  }
                >
                  Remove background
                </button>
              )}
              <p>Arrange your sections</p>
              {draft.appearance.sections.map((s, i) => (
                <div className="order-row" key={s}>
                  <span>{titles[s]}</span>
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => move(i, -1)}
                    aria-label={`Move ${titles[s]} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === 4}
                    onClick={() => move(i, 1)}
                    aria-label={`Move ${titles[s]} down`}
                  >
                    ↓
                  </button>
                </div>
              ))}
            </fieldset>
          </div>
        )}
        {tab === "showcase" && (
          <div
            role="tabpanel"
            id="panel-showcase"
            aria-labelledby="tab-showcase"
            className="profile-tab-panel"
          >
            {" "}
            <h2>Your showcase</h2>
            <p>
              Choose up to six characters and six journal excerpts. Only these
              selected details will appear on your public profile.
            </p>
            <label>
              Feature a saved character
              <select
                value=""
                onChange={(e) => {
                  if (
                    e.target.value &&
                    draft.favorites.length < 6 &&
                    !draft.favorites.some(
                      (f) => f.characterId === e.target.value,
                    )
                  )
                    field("favorites", [
                      ...draft.favorites,
                      { characterId: e.target.value },
                    ]);
                }}
              >
                <option value="">Choose character</option>
                {characters.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            {draft.favorites.map((f, i) => (
              <article key={f.characterId}>
                <h3>{characters.find((c) => c._id === f.characterId)?.name}</h3>
                <label>
                  Character portrait
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={busy}
                    onChange={(e) => upload(e.target.files[0], "character", i)}
                  />
                </label>
                <button
                  onClick={() =>
                    field(
                      "favorites",
                      draft.favorites.filter((_, j) => i !== j),
                    )
                  }
                >
                  Remove character
                </button>
              </article>
            ))}
            <label>
              Share a player journal excerpt
              <select
                value=""
                onChange={(e) => {
                  const j = journals.find((j) => j._id === e.target.value);
                  if (
                    j &&
                    draft.highlights.length < 6 &&
                    !draft.highlights.some((h) => h.journalId === j._id)
                  )
                    field("highlights", [
                      ...draft.highlights,
                      { journalId: j._id, excerpt: j.text.slice(0, 800) },
                    ]);
                }}
              >
                <option value="">Choose journal entry</option>
                {journals.map((j) => (
                  <option key={j._id} value={j._id}>
                    {j.text.slice(0, 70)}
                  </option>
                ))}
              </select>
            </label>
            <small>
              Private GM journals are never offered for sharing. Select only
              excerpts you are happy to make public.
            </small>
            {draft.highlights.map((h, i) => (
              <article key={h.journalId}>
                <label>
                  Public excerpt · copy an exact passage, up to 800 characters
                  <textarea
                    maxLength={800}
                    value={h.excerpt}
                    onChange={(e) =>
                      field(
                        "highlights",
                        draft.highlights.map((x, j) =>
                          j === i ? { ...x, excerpt: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <button
                  onClick={() =>
                    field(
                      "highlights",
                      draft.highlights.filter((_, j) => i !== j),
                    )
                  }
                >
                  Remove excerpt
                </button>
              </article>
            ))}
          </div>
        )}
        {tab === "links" && (
          <div
            role="tabpanel"
            id="panel-links"
            aria-labelledby="tab-links"
            className="profile-tab-panel"
          >
            {" "}
            <h3>Social & shop links</h3>
            <p>
              Link your social pages and marketplace listings or creator shop.
            </p>
            {draft.links.map((l, i) => (
              <article key={i}>
                <label>
                  Link label
                  <input
                    maxLength={60}
                    value={l.label}
                    onChange={(e) =>
                      field(
                        "links",
                        draft.links.map((x, j) =>
                          j === i ? { ...x, label: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  HTTPS address
                  <input
                    type="url"
                    value={l.url}
                    onChange={(e) =>
                      field(
                        "links",
                        draft.links.map((x, j) =>
                          j === i ? { ...x, url: e.target.value } : x,
                        ),
                      )
                    }
                  />
                </label>
                <label>
                  Link type
                  <select
                    value={l.kind}
                    onChange={(e) =>
                      field(
                        "links",
                        draft.links.map((x, j) =>
                          j === i ? { ...x, kind: e.target.value } : x,
                        ),
                      )
                    }
                  >
                    <option value="social">Social media</option>
                    <option value="shop">Marketplace / shop</option>
                  </select>
                </label>
                <button
                  onClick={() =>
                    field(
                      "links",
                      draft.links.filter((_, j) => i !== j),
                    )
                  }
                >
                  Remove link
                </button>
              </article>
            ))}
            <button
              disabled={draft.links.length >= 12}
              onClick={() =>
                field("links", [
                  ...draft.links,
                  { label: "", url: "https://", kind: "social" },
                ])
              }
            >
              Add link
            </button>
          </div>
        )}
        {tab === "share" && (
          <div
            role="tabpanel"
            id="panel-share"
            aria-labelledby="tab-share"
            className="profile-tab-panel"
          >
            {" "}
            {!initial && (
              <label className="check">
                <input
                  type="checkbox"
                  required
                  checked={age}
                  onChange={(e) => setAge(e.target.checked)}
                />
                I confirm I am 18 or older.
              </label>
            )}
            <h3>Share with confidence</h3>
            <p>
              Your account email and age confirmation never appear on your
              profile. Public profiles need review for explicit imagery, hate,
              harassment, threats, scams, and exposed personal information. Only
              upload images you have permission to use.
            </p>
            <label className="check">
              <input
                type="checkbox"
                checked={policy}
                onChange={(e) => setPolicy(e.target.checked)}
              />
              I have checked my profile and agree to these community rules. My
              chosen details, images, links and excerpts may be shared publicly
              after approval.
            </label>
            <button
              disabled={busy || !policy}
              onClick={() =>
                run(async () => {
                  await persist();
                  await review({});
                  onStatus(
                    "Submitted for review. Your profile is private until approved.",
                  );
                })
              }
            >
              Save & request public sharing
            </button>
            {initial && (
              <>
                <p>
                  Sharing status: {initial.reviewStatus}. Editing an approved
                  profile leaves its previously reviewed version public until
                  another review.
                </p>
                {initial.reviewStatus === "approved" && (
                  <label>
                    Share your profile
                    <input
                      readOnly
                      value={
                        location.origin + "/profile?user=" + initial.handle
                      }
                    />
                  </label>
                )}
                <button
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await unpublish({});
                      onStatus("Your profile is private.");
                    })
                  }
                >
                  Make profile private
                </button>
              </>
            )}
          </div>
        )}
        <div className="profile-settings-footer">
          <span className="profile-draft-state">{!initial || hasUnsavedChanges ? "Unsaved changes · preview updates as you edit" : "Your private draft is saved"}</span>
          <div className="profile-step-actions">
            {guided && step > 0 && (
              <button
                type="button"
                className="secondary"
                onClick={() => setTab(steps[step - 1][0])}
              >
                Back
              </button>
            )}
            {guided && step < steps.length - 1 ? (
              <button type="button" onClick={() => setTab(steps[step + 1][0])}>
                Next: {steps[step + 1][1]}
              </button>
            ) : (
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (!initial && !age) {
                    setTab("share");
                    onStatus(
                      "Confirm you are 18 or older in Review & save before saving.",
                    );
                    return;
                  }
                  run(async () => {
                    await persist();
                    setGuided(false);
                    onStatus(
                      initial ? "Private draft saved. Your profile is ready to preview." : "Your profile is saved. Let's show you around.",
                    );
                  });
                }}
              >
                {busy ? "Saving..." : initial ? "Save private draft" : "Save profile & show me around"}
              </button>
            )}
          </div>
        </div>
      </section>
      <h2 id="profile-preview" className="profile-preview-heading">Draft preview · only you can see this</h2>
      <ProfileCard p={draft} characters={characters} />
    </>
  );
}
export function WelcomeTour({ onFinish, guest = false }) {
  const [step, setStep] = useState(0);
  const heading = React.useRef(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const stops = [
    ["Your heroes start here", "Create and save characters for Savage Worlds, Dungeons & Dragons 5e, and Pathfinder 2e. Your account keeps them together.", [["Savage Worlds", "/?game=savage"], ["Dungeons & Dragons 5e", "/dnd"], ["Pathfinder 2e", "/pathfinder"]]],
    ["Bring your table together", "Create a campaign, invite your party, and prepare your next adventure. Keep scenes, party details, and private Game Master notes together.", [["Campaigns", "/campaigns"]]],
    ["Keep the memories", "Write player journals in your campaigns and revisit your adventures in Chronicles. Choose favorite characters and journal excerpts to showcase on your profile.", [["Chronicles", "/chronicles"]]],
    ["Make yourself at home", "Your profile is your starting point. Customize your page and use Friends below to connect with the people at your table.", [["Bug's official updates", "/profile?user=bug"], ["Support", "/support"]]],
  ];
  const [title, description, links] = stops[step];
  return <section className="profile-tour" aria-labelledby="tour-title">
    <p className="profile-eyebrow">Welcome to Savage Master / {step + 1} of {stops.length}</p>
    <h2 id="tour-title" tabIndex={-1} ref={heading}>{title}</h2>
    <p>{description}</p>
    <BugGuide step={step}>{[
      'Pick your game to start a character. You can come back to this tour at any time from my button.',
      'Your Game Master’s private notes stay with the GM. Invite your players when your campaign is ready.',
      'Chronicles is public. Share only what you choose, and follow my profile for official updates.',
      'You are ready to explore. My tome is always nearby if you need setup help or want to report an error.',
    ][step]}</BugGuide>
    <div className="profile-tour-links">{links.map(([label, href]) => <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}<span className="sr-only"> (opens in a new tab)</span></a>)}</div>
    <div className="profile-step-actions">
      {step > 0 && <button type="button" className="secondary" onClick={() => setStep(step - 1)}>Back</button>}
      <button type="button" onClick={() => step < stops.length - 1 ? setStep(step + 1) : onFinish()}>{step < stops.length - 1 ? "Next" : guest ? 'Continue to account' : "Open my profile"}</button>
      <button type="button" className="secondary" onClick={onFinish}>Skip tour</button>
    </div>
  </section>;
}

export function App() {
  const { isAuthenticated, isLoading } = useConvexAuth(),
    [status, setStatus] = useState("");
  const [editing, setEditing] = useState(false);
  const [tour, setTour] = useState(() => new URLSearchParams(location.search).get('tour') === '1');
  const [entry, setEntry] = useState(() => new URLSearchParams(location.search).get("entry") === "signUp" ? "signUp" : "signIn");
  const handle = new URLSearchParams(location.search).get("user");
  useEffect(() => {
    if (!isAuthenticated) { setEditing(false); return; }
    const cleanUrl = new URL(location.href);
    cleanUrl.searchParams.delete("entry");
    history.replaceState(null, "", cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
  }, [isAuthenticated]);
  const mine = useQuery(
      ref("profiles:mine"),
      isAuthenticated && !handle ? {} : "skip",
    ),
    publicProfile = useQuery(
      ref("profiles:publicProfile"),
      handle ? { handle } : "skip",
    ),
    characters = useQuery(
      ref("characters:list"),
      isAuthenticated && !handle ? {} : "skip",
    ),
    journals = useQuery(
      ref("profiles:journalChoices"),
      isAuthenticated && !handle ? {} : "skip",
    ),
    report = useMutation(ref("profiles:report"));
  const tourRequested = React.useRef(new URLSearchParams(location.search).get('tour') === '1');
  useEffect(() => {
    if (!tourRequested.current || !isAuthenticated || !mine) return;
    tourRequested.current = false; setTour(true);
    const url = new URL(location.href); url.searchParams.delete('tour'); history.replaceState(null, '', url.pathname + url.search + url.hash);
  }, [isAuthenticated, mine]);
  function finishTour() {
    tourRequested.current = false; setTour(false); setStatus('');
    const url = new URL(location.href); url.searchParams.delete('tour'); history.replaceState(null, '', url.pathname + url.search + url.hash);
    requestAnimationFrame(() => document.getElementById(isAuthenticated ? 'my-profile' : 'profile-entry-title')?.focus());
  }
  return (
    <main>
{(handle || isAuthenticated) && <><nav className="game-switch" aria-label="Game system"><a href="/?game=savage">Savage Worlds</a><a href="/dnd">Dungeons &amp; Dragons 5e</a><a href="/pathfinder">Pathfinder 2e</a></nav><nav className="workspace-nav" aria-label="Workspace"><a href="/">Home</a><a href="/?game=savage">Characters</a><a href="/campaigns">Campaigns</a><a href="/builder">Master Builder</a><a href="/chronicles">Chronicles</a><a href="/profile" aria-current="page">My Profile</a></nav></>}
      {handle === 'bug' ? <BugProfile /> : handle ? (
        <>
          {publicProfile === undefined ? (
            <p>Opening profile…</p>
          ) : publicProfile ? (
            <>
              <ProfileCard p={publicProfile} />
              <FriendActions handle={handle}/>
              <section>
                <h2>Keep our tables welcoming</h2>
                <p>
                  Report inappropriate images, harassment, or suspicious links.
                </p>
                {isAuthenticated ? (
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const reason = new FormData(e.currentTarget).get(
                        "reason",
                      );
                      try {
                        await report({ handle, reason });
                        setStatus("Report received for review.");
                      } catch {
                        setStatus(
                          "Unable to submit. This profile may already be reported.",
                        );
                      }
                    }}
                  >
                    <input
                      name="reason"
                      required
                      maxLength={1000}
                      placeholder="Describe the concern"
                      aria-label="Report reason"
                    />
                    <button>Report profile</button>
                  </form>
                ) : (
                  <>
                    <p>Sign in to send a report.</p>
                    <CharacterAccount accountOnly />
                  </>
                )}
              </section>
            </>
          ) : (
            <section>
              <h1>Profile unavailable</h1>
              <p>This page is private or waiting for review.</p>
            </section>
          )}
        </>
      ) : (
        <>
          {isLoading ? (
            <p>Checking account.</p>
          ) : isAuthenticated ? (
            mine === undefined || !characters || !journals ? (
              <p>Opening your profile.</p>
            ) : (
              <>
                {tour && <WelcomeTour onFinish={finishTour} />}
                {mine && !editing ? <>
                  <div id="my-profile" tabIndex={-1}>
                    <ProfileCard p={mine} characters={characters} />
                  </div>
                  <nav className="sm-profile-paths" aria-label="Your adventure">
                    <a href="/?game=savage"><strong>Your heroes</strong><small>Create a character or return to a sheet.</small></a>
                    <a href="/campaigns?view=journal"><strong>Your journal</strong><small>Keep the moments that make your story.</small></a>
                    <a href="/chronicles"><strong>Meet at Chronicles</strong><small>Find friends, shared stories, and community tomes.</small></a>
                  </nav>
                  <div className="profile-owner-actions">
                    <button type="button" onClick={() => setEditing(true)}>Customize my profile</button>
                    <button type="button" className="secondary" onClick={() => setTour(true)}>Show me around</button>
                  </div>
                </> : <>
                  {mine && <button type="button" className="secondary" onClick={() => {
                    if (!confirm("Close profile settings? Any unsaved edits will be discarded.")) return;
                    setEditing(false);
                  }}>Back to my profile</button>}
                  <Editor
                    initial={mine}
                    characters={characters}
                    journals={journals}
                    onStatus={setStatus}
                    onCreated={() => { setEditing(false); setTour(true); }}
                  />
                </>}
                {mine && <FriendsArea />}
                <CharacterAccount accountOnly />
              </>
            )
          ) : (
            <>{tour && <WelcomeTour guest onFinish={finishTour} />}<section className="profile-entry" aria-labelledby="profile-entry-title">
              <a href="/">Back to home</a>
              <h1 id="profile-entry-title" tabIndex={-1}>{entry === "signUp" ? "Begin Your Adventure" : "Already On One"}</h1>
              <p>{entry === "signUp" ? "Create your account, build your profile, and let us show you around." : "Sign in to return to your profile."}</p>
              <CharacterAccount accountOnly initialMode={entry} onModeChange={setEntry} />
            </section></>
          )}
        </>
      )}
      <p className="workspace-status" role="status">{status}{status && <button type="button" aria-label="Dismiss message" onClick={()=>setStatus('')}>×</button>}</p>
    </main>
  );
}
const url = import.meta.env.VITE_CONVEX_URL;
const profileHost = document.getElementById('profileRoot');
const profileRoot = profileHost ? import.meta.hot?.data.profileRoot || createRoot(profileHost) : null;
if (import.meta.hot && profileRoot) import.meta.hot.data.profileRoot = profileRoot;
profileRoot?.render(
  url ? (
    <ConvexAuthProvider client={new ConvexReactClient(url)}>
      <App />
    </ConvexAuthProvider>
  ) : (
    <p>Profiles need a configured Convex deployment.</p>
  ),
);
