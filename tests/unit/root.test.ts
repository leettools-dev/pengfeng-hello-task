import { describe, expect, it } from "vitest";
import { buildServer } from "../../src/app/src/server";

describe("root route", () => {
  it("returns the greeting", async () => {
    const app = buildServer();

    try {
      const response = await app.inject({ method: "GET", url: "/" });

      expect(response.statusCode).toBe(200);
      expect(response.headers["content-type"]).toContain("text/html");
      expect(response.body).toContain("Hello, Venture!");
    } finally {
      await app.close();
    }
  });
});
