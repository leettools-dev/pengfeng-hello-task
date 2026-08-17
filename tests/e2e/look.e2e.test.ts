import { describe, expect, it } from "vitest";
import { buildServer } from "../../src/app/src/server.js";

describe("critical flow: Look", () => {
  it("visiting / returns the greeting within one second, over a real HTTP request", async () => {
    const app = buildServer();

    try {
      await app.listen({ port: 0, host: "127.0.0.1" });
      const address = app.server.address();
      if (address === null || typeof address === "string") {
        throw new Error("expected server to bind a TCP port");
      }

      const start = performance.now();
      const response = await fetch(`http://127.0.0.1:${address.port}/`);
      const elapsedMs = performance.now() - start;
      const body = await response.text();

      expect(response.status).toBe(200);
      expect(body).toContain("Hello, Venture!");
      expect(elapsedMs).toBeLessThan(1000);
    } finally {
      await app.close();
    }
  });
});
