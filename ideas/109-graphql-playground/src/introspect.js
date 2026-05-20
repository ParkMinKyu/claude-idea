// GraphQL schema introspection -> structured model for a self-hosted IDE.
// Uses graphql to build a schema from SDL, runs introspection, and flattens it.
import { buildSchema, graphqlSync, getIntrospectionQuery } from "graphql";

/** Build a schema from SDL and run the standard introspection query. */
export function introspect(sdl) {
  const schema = buildSchema(sdl);
  const result = graphqlSync({ schema, source: getIntrospectionQuery() });
  if (result.errors) throw new Error(result.errors.map((e) => e.message).join("; "));
  return result.data.__schema;
}

const unwrap = (t) => {
  let cur = t;
  let suffix = "";
  while (cur && (cur.kind === "NON_NULL" || cur.kind === "LIST")) {
    if (cur.kind === "LIST") suffix = `[${suffix || "?"}]` + (suffix ? "" : "");
    cur = cur.ofType;
  }
  return cur?.name ?? "?";
};

/** Render a type ref back into SDL-ish notation, e.g. [User!]! */
export function typeRefToString(t) {
  if (!t) return "?";
  if (t.kind === "NON_NULL") return typeRefToString(t.ofType) + "!";
  if (t.kind === "LIST") return "[" + typeRefToString(t.ofType) + "]";
  return t.name;
}

/** Flatten an introspection result into a model the IDE can render. */
export function buildModel(introspection) {
  const types = (introspection.types ?? []).filter((t) => !t.name.startsWith("__"));
  return {
    queryType: introspection.queryType?.name ?? null,
    mutationType: introspection.mutationType?.name ?? null,
    subscriptionType: introspection.subscriptionType?.name ?? null,
    types: types.map((t) => ({
      name: t.name,
      kind: t.kind,
      description: t.description ?? null,
      fields: (t.fields ?? []).map((f) => ({
        name: f.name,
        type: typeRefToString(f.type),
        baseType: unwrap(f.type),
        args: (f.args ?? []).map((a) => ({ name: a.name, type: typeRefToString(a.type) })),
      })),
      enumValues: (t.enumValues ?? []).map((e) => e.name),
    })),
  };
}

/** Convenience: SDL string -> IDE model. */
export function modelFromSdl(sdl) {
  return buildModel(introspect(sdl));
}

/** Find a type by name in the model. */
export function findType(model, name) {
  return model.types.find((t) => t.name === name) ?? null;
}
