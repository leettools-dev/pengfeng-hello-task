import { describe, expect, it } from "vitest";
import { buildServer } from "../../src/app/src/server";

describe("unmatched routes", () => {
  it("returns a structured 404, not a crash", async () => {
    const app = buildServer();

    try {
      const response = await app.inject({ method: "GET", url: "/does-not-exist" });

      expect(response.statusCode).toBe(404);
      expect(response.json()).toMatchObject({ statusCode: 404, error: "Not Found" });
    } finally {
      await app.close();
    }
  });
});
