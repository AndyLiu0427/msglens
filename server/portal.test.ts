import { afterEach, describe, expect, it, vi } from "vitest";
import { billingPortal } from "./paddle";
import { HttpError, type Ctx, type Env } from "./types";

// The session layer is tested elsewhere; here only "who is asking" matters.
vi.mock("./session", () => ({
  requireUser: vi.fn(async () => ({ id: "u1", email: "a@example.com" })),
}));

/** Every value the handler bound into a query, to check whose row it read. */
let bound: unknown[] = [];

/** One canned entitlement row, or none. */
function ctxFor(row: Record<string, unknown> | null, env: Partial<Env> = {}): Ctx {
  const db = {
    prepare: () => ({
      bind: (...args: unknown[]) => {
        bound = args;
        return { first: async () => row };
      },
    }),
  };
  return {
    env: { DB: db, PADDLE_API_KEY: "test-key", ...env } as unknown as Env,
    request: new Request("https://msglens.app/api/billing/portal", { method: "POST" }),
    url: new URL("https://msglens.app/api/billing/portal"),
  };
}

function paddleReplies(body: unknown, status = 200) {
  const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe("billingPortal", () => {
  it("asks Paddle for the caller's own customer and subscription", async () => {
    const fetchMock = paddleReplies({
      data: { urls: { general: { overview: "https://customer-portal.paddle.com/x" } } },
    });

    const res = await billingPortal(ctxFor({ paddle_customer_id: "ctm_1", paddle_subscription_id: "sub_1" }));

    expect(await res.json()).toEqual({ url: "https://customer-portal.paddle.com/x" });
    // The row read is the signed-in user's, never one named in the request.
    expect(bound).toEqual(["u1"]);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://api.paddle.com/customers/ctm_1/portal-sessions");
    expect(JSON.parse(init.body as string)).toEqual({ subscription_ids: ["sub_1"] });
  });

  it("refuses a user who has never paid, without calling Paddle", async () => {
    const fetchMock = paddleReplies({});
    await expect(billingPortal(ctxFor(null))).rejects.toMatchObject({ status: 404 });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("fails closed when the API key is not set", async () => {
    const err = await billingPortal(
      ctxFor({ paddle_customer_id: "ctm_1" }, { PADDLE_API_KEY: undefined }),
    ).catch((e) => e);
    expect(err).toBeInstanceOf(HttpError);
    expect(err.status).toBe(503);
  });

  it("reports a Paddle error instead of returning an empty link", async () => {
    paddleReplies({ error: "nope" }, 400);
    await expect(
      billingPortal(ctxFor({ paddle_customer_id: "ctm_1", paddle_subscription_id: null })),
    ).rejects.toMatchObject({ status: 503 });
  });
});
