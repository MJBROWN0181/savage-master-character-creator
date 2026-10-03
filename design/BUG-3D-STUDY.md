# Bug 3D study

Status: shelved at the user's request on October 3, 2026. Keep the approved animated 2D Bug on the website. These prototype files are retained only as an unused experiment; do not integrate them into the companion.

Local preview: `/design/prototypes/bug-3d/index.html`.

This is an early procedural geometry prototype, not the final approved character model. The production website companion has not been replaced. The study demonstrates true volume, rotation, lighting, four wing pivots, arm pivots, blinking eyes, a code tome and hover/flight/read/wave controls. Drag and a keyboard-accessible slider rotate the model. Pause and the initial reduced-motion preference stop idle animation.

Source: `design/prototypes/bug-3d/model.js`. The local preview uses the official Three.js 0.186.1 package, saved under `design/prototypes/bug-3d/vendor` with its MIT license. No application dependency was added. Reference: https://threejs.org/docs/.

The prototype is intentionally simplified. A production conversion still needs a sculpt matching the approved face and silhouette, detailed hood/cloak and book textures, a skeletal rig, optimized GLB export and mobile performance validation before replacing the existing Bug. The authored preview, texture source, and licensed vendor files are archived in Git under design/prototypes/bug-3d. They are excluded from the production static build.

## Reference-based revision

The current preview loads `design/prototypes/bug-3d/character.js`. It replaces the initial cone robe with an open-front ragged cloak, exposes two independently pivoted segmented hind legs and clawed feet, and retains four articulated arms. New reference details include a pointed gold-trimmed hood with a blue crest gem, curved glowing antennae, amber eyes with cheek/brow geometry, mottled teal armor, gold knee plates, veined translucent wings, and outward-facing leather tome covers with glowing code symbols. Seeded material textures use mipmaps to reduce shimmer. Wing veins terminate on the actual wing boundary.

The original procedural study is preserved as `design/prototypes/bug-3d/model-study-v1.js`. This remains a stylized procedural 3D interpretation; it is not a scanned or hand-sculpted replica of the painted reference. Website integration remains separate from this preview revision.

## Final shelved revision

The final local study removed the book and reading control, used relaxed empty-handed upper arms, and added a generated material atlas and studio reflections. The earlier tome model is retained as character-with-tome.js. See materials-notes.md for the texture prompt and limitations. The approved animated 2D Bug remains the website companion.
