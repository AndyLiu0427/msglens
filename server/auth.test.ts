import { describe, expect, it } from "vitest";
import { safeNext, welcomeLanding } from "./auth";

describe("welcomeLanding", () => {
  it("adds welcome=1 and keeps the rest of the path", () => {
    expect(welcomeLanding("/")).toBe("/?welcome=1");
    expect(welcomeLanding("/zh/msg-vs-eml/")).toBe("/zh/msg-vs-eml/?welcome=1");
    expect(welcomeLanding("/workspace/?invite=abc#top")).toBe("/workspace/?invite=abc&welcome=1#top");
  });

  it("never produces a protocol-relative redirect", () => {
    expect(welcomeLanding("/.//evil.com")).not.toMatch(/^\/\//);
  });
});

describe("safeNext", () => {
  it("keeps same-origin paths", () => {
    expect(safeNext("/zh/")).toBe("/zh/");
    expect(safeNext("/workspace/?invite=x")).toBe("/workspace/?invite=x");
  });

  it("refuses anything that could leave the site", () => {
    for (const raw of [
      null,
      "",
      "https://evil.com",
      "//evil.com",
      "/\\evil.com",
      "/\\/evil.com",
      "/.//evil.com",
      "/a/..//evil.com",
      "evil.com",
    ]) {
      expect(safeNext(raw), String(raw)).toBe("/workspace/");
    }
  });
});
