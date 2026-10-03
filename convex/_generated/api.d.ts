/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accountSettings from "../accountSettings.js";
import type * as auth from "../auth.js";
import type * as bazaar from "../bazaar.js";
import type * as billing from "../billing.js";
import type * as billingModel from "../billingModel.js";
import type * as bug from "../bug.js";
import type * as bugGithub from "../bugGithub.js";
import type * as bugUpdates from "../bugUpdates.js";
import type * as campaigns from "../campaigns.js";
import type * as campfire from "../campfire.js";
import type * as campfireOrder from "../campfireOrder.js";
import type * as characterValidation from "../characterValidation.js";
import type * as characters from "../characters.js";
import type * as chronicleVisibility from "../chronicleVisibility.js";
import type * as chronicles from "../chronicles.js";
import type * as communityAccess from "../communityAccess.js";
import type * as crons from "../crons.js";
import type * as friends from "../friends.js";
import type * as guilds from "../guilds.js";
import type * as http from "../http.js";
import type * as masterBuilder from "../masterBuilder.js";
import type * as news from "../news.js";
import type * as passwordReset from "../passwordReset.js";
import type * as paypal from "../paypal.js";
import type * as paypalClient from "../paypalClient.js";
import type * as privateWorkspaces from "../privateWorkspaces.js";
import type * as profileCleanup from "../profileCleanup.js";
import type * as profileImages from "../profileImages.js";
import type * as profileReviewEmail from "../profileReviewEmail.js";
import type * as profiles from "../profiles.js";
import type * as support from "../support.js";
import type * as supportEmail from "../supportEmail.js";
import type * as worldMaps from "../worldMaps.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accountSettings: typeof accountSettings;
  auth: typeof auth;
  bazaar: typeof bazaar;
  billing: typeof billing;
  billingModel: typeof billingModel;
  bug: typeof bug;
  bugGithub: typeof bugGithub;
  bugUpdates: typeof bugUpdates;
  campaigns: typeof campaigns;
  campfire: typeof campfire;
  campfireOrder: typeof campfireOrder;
  characterValidation: typeof characterValidation;
  characters: typeof characters;
  chronicleVisibility: typeof chronicleVisibility;
  chronicles: typeof chronicles;
  communityAccess: typeof communityAccess;
  crons: typeof crons;
  friends: typeof friends;
  guilds: typeof guilds;
  http: typeof http;
  masterBuilder: typeof masterBuilder;
  news: typeof news;
  passwordReset: typeof passwordReset;
  paypal: typeof paypal;
  paypalClient: typeof paypalClient;
  privateWorkspaces: typeof privateWorkspaces;
  profileCleanup: typeof profileCleanup;
  profileImages: typeof profileImages;
  profileReviewEmail: typeof profileReviewEmail;
  profiles: typeof profiles;
  support: typeof support;
  supportEmail: typeof supportEmail;
  worldMaps: typeof worldMaps;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
