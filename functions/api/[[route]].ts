/**
 * Pages Function adapter — catches every `/api/*` request.
 *
 * All the logic is in `server/router.ts`, which takes a Request and an Env and
 * knows nothing about Pages. Migrating to a Worker with static assets, which
 * is what Cloudflare now recommends for new projects, replaces this file with
 * a `fetch` export and nothing else.
 */

import { handleApi } from "../../server/router";
import type { Env } from "../../server/types";

export const onRequest: PagesFunction<Env> = (context) =>
  handleApi(context.request, context.env);
