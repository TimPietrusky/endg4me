/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as clans from "../clans.js";
import type * as labs from "../labs.js";
import type * as lib_gameConstants from "../lib/gameConstants.js";
import type * as lib_skillTree from "../lib/skillTree.js";
import type * as migrations_removeReputation from "../migrations/removeReputation.js";
import type * as migrations_seedAttributeNodes from "../migrations/seedAttributeNodes.js";
import type * as notifications from "../notifications.js";
import type * as research from "../research.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  clans: typeof clans;
  labs: typeof labs;
  "lib/gameConstants": typeof lib_gameConstants;
  "lib/skillTree": typeof lib_skillTree;
  "migrations/removeReputation": typeof migrations_removeReputation;
  "migrations/seedAttributeNodes": typeof migrations_seedAttributeNodes;
  notifications: typeof notifications;
  research: typeof research;
  tasks: typeof tasks;
  users: typeof users;
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
