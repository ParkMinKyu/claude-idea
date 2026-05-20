// Self-hosted GraphQL IDE backend. Executes queries against an SDL+resolvers schema.
import { createServer } from "node:http";
import { buildSchema, graphql } from "graphql";
import { modelFromSdl } from "./introspect.js";

const SDL = `
  type Query { hello(name: String): String!, version: String! }
`;
const root = {
  hello: ({ name }) => `Hello, ${name ?? "world"}!`,
  version: () => "0.1.0",
};
const schema = buildSchema(SDL);

export function buildServer() {
  return createServer((req, res) => {
    if (req.method === "GET" && req.url === "/schema") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify(modelFromSdl(SDL)));
      return;
    }
    if (req.method === "POST" && req.url === "/graphql") {
      let raw = "";
      req.on("data", (c) => (raw += c));
      req.on("end", async () => {
        const { query, variables } = JSON.parse(raw || "{}");
        const result = await graphql({ schema, source: query, rootValue: root, variableValues: variables });
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify(result));
      });
      return;
    }
    res.writeHead(404).end(JSON.stringify({ error: "GET /schema or POST /graphql" }));
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildServer().listen(Number(process.env.PORT ?? 3000), () =>
    console.log("graphql-playground listening")
  );
}
