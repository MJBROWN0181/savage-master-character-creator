# Bug, the website companion

Bug keeps his approved transparent dark fantasy artwork: wings, glowing antennae,
and a code tome. The SVG rig uses that same image for independently moving wings,
head, eyes, and tome. He stays in the bottom corner and opens the existing support
dialog by mouse, touch, or keyboard.

His eyes keep the original amber iris texture inside individually clipped sockets.
Idle eyes glance around and respond to nearby pointers. Investigating eyes look
down into the tome; guiding eyes alternate between the page and player. Each eye
has its own upper lid for gentle blinks and occasional double blinks, with warm
tome reflections and a brief happy squint after success. Paused or reduced-motion
artwork shows the original static eyes.

| Job | Movement | Trigger |
| --- | --- | --- |
| Keeping watch | Gentle hover, breathing, slow wing flutter, blinks and glances | Idle |
| Investigating | Looks down into the raised, glowing tome; wings settle | Captured error, error detail review, failed report |
| Delivering | Faster flutter, flying posture, holds tome close, trailing code | Report submission starts |
| Confirming | Happy lift, nod, faster wings and ticket seal | Successful submission |
| Welcoming | Arrives and gives a friendly head tilt | Opens support |
| Guiding | Alternates between the tome and the player, presents the tome | Setup steps and creation choice notices |
| Announcing | Presents the tome with rising runes | Publishing/sharing updates, opening Bug’s profile |

Delivery continues until a result arrives. Unrelated errors and hints do not
interrupt an active delivery. Short reactions return to idle, and all listeners,
timers, and visibility observers are released on unmount.

The dialog offers persistent pause/resume and minimize/restore controls. Minimized
Bug remains a touch-friendly support button with error alerts. Device reduced-motion
preferences always stop animation. Hidden tabs and offscreen artwork also stop
animating. These choices leave support and reporting usable.

Development rehearsal: `/design/prototypes/bug-2d/bug-animation-preview.html`. It shows all seven
performances together and has an isolated pause control; it never sends a report.
The rehearsal is a local ignored artifact, outside the production build.

Verification: `tests/bug-ui.test.jsx`, the shared type/build/test checks, and browser
inspection of multiple animation frames, support interactions, reduced motion,
and responsive layouts.

## Free flight

Bug now explores the visible page between quiet rests. A bounded curved path controls travel, with faster wingbeats, modest body banking and a small amber trail. He stops at his current position when approached, focused with the keyboard, paused, hidden, minimized, or assigned a task. Only the floating companion roams; support illustrations stay in place. Reports and setup take priority over roaming. Viewport changes cancel the current path and reposition immediately within the new bounds. Native clicks remain transparent until the deliberate-hover invitation.

Local flight demonstration: `/design/prototypes/bug-2d/bug-flight-preview.html`. Geometry coverage checks phone and desktop bounds and upright landings. UI coverage checks flight interruption and cleanup.

The authored 2D rehearsal pages are archived under design/prototypes/bug-2d. QA screenshots stay in ignored output; the rehearsals are excluded from the production build.
