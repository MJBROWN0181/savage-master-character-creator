# Savage Master - Character Creator

A tabletop companion with separate **Savage Worlds**, **Dungeons & Dragons 5e**, and **Pathfinder 2e** character creators, campaigns, community spaces, and account saving through Convex.

![Savage Master](logo.png)

## Install the app

Use [smsheets.com/install](https://smsheets.com/install), the home page’s **Install App** button, or **Explore → Install App** in a workspace. Supported browsers open their native install prompt; other devices get a short guide. The app opens in its own window. Core character tools work offline after the first online setup; account saving and community features need internet. See [installation details](design/APP-INSTALL.md).

## Features

- **Support & the Bug** at `/support`: a quiet winged bug fairy carrying a tome
  of code opens bug reports or support tickets from every page. Players can
  review captured error details, copy/download a report, and send it to a private
  Convex queue. Account owners can track tickets and team replies. See
  [support setup](design/SUPPORT.md) for email notifications and team access.

- **Savage Master Builder** at `/builder`: start with a rule set, then create a
  custom world, lore, play style, and house rules. Upload PNG/JPEG/WebP maps,
  add location notes, map connections, layers, custom travel routes, and player
  handouts with print/poster controls. Open recommended map editors. Browser drafts
  and maps work locally; account worlds and maps use Convex. See
  [builder details](design/MASTER-BUILDER.md).

- **4 Campaign Settings** with unique content:
  - **Deadlands** - The Weird West
  - **Rifts** - The Tomorrow Legion
  - **Pirates** - 50 Fathoms
  - **Pathfinder** - Savage Pathfinder
- **Separate game-specific character journeys**: one decision at a time, live character previews, checked timelines, choice limits, and game-specific equipment shops.
- **Dice Icons**: SVG-based die shapes (d4, d6, d8, d10, d12) that visually represent each die type
- **Point-Buy System**: 5 attribute points, 15 skill points, up to 4 hindrance points
- **Derived Stats**: Auto-calculated Pace, Parry, Toughness, and Run Die
- **3 Export Formats**:
  - **Foundry VTT** (SWADE system) - ready to import
  - **Roll20** - character sheet format
  - **JSON** - universal data export
- **Setting-Specific Content**: Each setting adds unique races, edges, hindrances, and gear
- **Responsive Summary Panel**: Live character sheet preview while building

## Getting Started

1. Clone this repo and install dependencies:
   ```bash
   npm install
   ```
2. Configure Convex using the steps below, then run `npm run dev`.
3. Open the local URL printed by Vite.

Savage Worlds uses plain JavaScript; D&D, Pathfinder, and account workspaces use React and Convex Auth, built with Vite.

## Account saving setup

1. Run `npm install` and `npx convex login`, then `npx convex dev --configure new --team mikebrown81` to create a Convex project for Savage Master in the intended team. Choose a development deployment. This generates `.env.local` and `convex/_generated`.
2. In the Convex deployment settings, set `JWT_PRIVATE_KEY` and `JWKS` using the [Convex Auth setup](https://labs.convex.dev/auth/setup) command (`npx @convex-dev/auth`). Set `AUTH_RESEND_KEY` and `AUTH_EMAIL_FROM` for sign-up verification and password reset email; the sender must be allowed by your email provider.
3. Run `npm run dev` to develop and `npm run check && npm run build` to verify. Local drafts stay on the device; **Save Character** writes to the signed-in player's account in Convex. **Load** replaces the current draft after confirmation.
4. Create a production Convex deployment and production deploy key. Add `CONVEX_DEPLOY_KEY` in Vercel's Production environment. The Vercel build runs `npx convex deploy --cmd-url-env-var-name VITE_CONVEX_URL --cmd 'npm run build'`, which publishes the backend and builds the site into `dist`. Configure the production deployment's JWT and account email variables separately.

Do not publish account sign-up until verification and password reset email and a production sign-in test are working. ChatGPT sign-in and generated character art are future integrations and are not included in this build.

## Tech Stack

- **Vanilla JavaScript** - character builder
- **React and Convex Auth** - account and cloud character library
- **CSS Custom Properties** - full theming support
- **Google Fonts** - Cinzel (headings) + Crimson Text (body)
- **SVG Dice Icons** - inline SVGs for d4, d6, d8, d10, d12
- **Canva** - setting banners and background assets

## Project Structure

```
index.html       - Main HTML shell
style.css        - Parchment theme styles
app.js           - Application logic & UI rendering
data.js          - Core SWADE data (attributes, skills, edges, hindrances, gear)
settings.js      - Campaign setting definitions (Deadlands, Rifts, Pirates, Pathfinder)
logo.png         - Savage Master logo
bg-parchment.jpg - Background texture
banner-*.jpg     - Setting banner images
```

## Created By

**Visionary Studios 101** - *"WarriorKing"*

## License

This is a fan-made tool for the Savage Worlds RPG system. Savage Worlds and all related content are trademarks of Pinnacle Entertainment Group.
