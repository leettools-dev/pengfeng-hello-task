import { pathToFileURL } from "node:url";
import Fastify from "fastify";
import { Type } from "@sinclair/typebox";
import type { TypeBoxTypeProvider } from "@fastify/type-provider-typebox";

export function buildServer() {
  const app = Fastify({ logger: true }).withTypeProvider<TypeBoxTypeProvider>();

  app.get(
    "/health",
    {
      schema: {
        response: {
          200: Type.Object({
            status: Type.Literal("ok"),
          }),
        },
      },
    },
    async () => ({ status: "ok" as const }),
  );

  return app;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? "127.0.0.1";
  const app = buildServer();

  app.listen({ port, host }).catch((error) => {
    app.log.error(error);
    process.exit(1);
  });
}
