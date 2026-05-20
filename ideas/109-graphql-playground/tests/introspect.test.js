import { describe, it, expect } from "vitest";
import { introspect, buildModel, modelFromSdl, findType, typeRefToString } from "../src/introspect.js";

const SDL = `
  "A blogging platform"
  type Query {
    user(id: ID!): User
    posts(limit: Int): [Post!]!
  }
  type User {
    id: ID!
    name: String!
    role: Role!
  }
  type Post {
    id: ID!
    title: String!
    author: User!
  }
  enum Role { ADMIN EDITOR VIEWER }
`;

describe("introspect", () => {
  it("returns a schema with the Query root", () => {
    const intro = introspect(SDL);
    expect(intro.queryType.name).toBe("Query");
    expect(intro.types.some((t) => t.name === "User")).toBe(true);
  });

  it("throws on invalid SDL", () => {
    expect(() => introspect("type Query { broken")).toThrow();
  });
});

describe("buildModel", () => {
  const model = modelFromSdl(SDL);

  it("excludes built-in __ types", () => {
    expect(model.types.every((t) => !t.name.startsWith("__"))).toBe(true);
  });

  it("captures fields with rendered type refs", () => {
    const user = findType(model, "User");
    const idField = user.fields.find((f) => f.name === "id");
    expect(idField.type).toBe("ID!");
    const nameField = user.fields.find((f) => f.name === "name");
    expect(nameField.baseType).toBe("String");
  });

  it("captures field arguments", () => {
    const query = findType(model, "Query");
    const userField = query.fields.find((f) => f.name === "user");
    expect(userField.args).toContainEqual({ name: "id", type: "ID!" });
  });

  it("captures list and non-null wrappers", () => {
    const query = findType(model, "Query");
    const posts = query.fields.find((f) => f.name === "posts");
    expect(posts.type).toBe("[Post!]!");
  });

  it("captures enum values", () => {
    const role = findType(model, "Role");
    expect(role.kind).toBe("ENUM");
    expect(role.enumValues).toEqual(["ADMIN", "EDITOR", "VIEWER"]);
  });
});

describe("typeRefToString", () => {
  it("renders nested wrappers", () => {
    const ref = {
      kind: "NON_NULL",
      ofType: { kind: "LIST", ofType: { kind: "NON_NULL", ofType: { name: "Int" } } },
    };
    expect(typeRefToString(ref)).toBe("[Int!]!");
  });
});
