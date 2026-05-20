import { describe, it, expect } from "vitest";
import { parseDDL, findTable, toDot } from "../src/parser.js";
import { visualize } from "../src/cli.js";

const DDL = `
  -- users table
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    name TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY,
    title TEXT NOT NULL,
    author_id INTEGER REFERENCES users(id),
    created_at TIMESTAMP
  );

  CREATE TABLE comments (
    id INTEGER,
    post_id INTEGER,
    body TEXT,
    PRIMARY KEY (id),
    FOREIGN KEY (post_id) REFERENCES posts(id)
  );
`;

describe("parseDDL tables", () => {
  const model = parseDDL(DDL);

  it("parses all three tables", () => {
    expect(model.tables.map((t) => t.name)).toEqual(["users", "posts", "comments"]);
  });

  it("captures columns with types", () => {
    const users = findTable(model, "users");
    expect(users.columns.map((c) => c.name)).toEqual(["id", "email", "name"]);
    const email = users.columns.find((c) => c.name === "email");
    expect(email.type).toBe("VARCHAR(255)");
    expect(email.notNull).toBe(true);
  });

  it("detects primary keys (inline and table-level)", () => {
    expect(findTable(model, "users").columns.find((c) => c.name === "id").primaryKey).toBe(true);
    expect(findTable(model, "comments").columns.find((c) => c.name === "id").primaryKey).toBe(true);
  });
});

describe("parseDDL relations", () => {
  const model = parseDDL(DDL);

  it("captures inline foreign keys", () => {
    expect(model.relations).toContainEqual({
      from: "posts",
      fromColumn: "author_id",
      to: "users",
      toColumn: "id",
    });
  });

  it("captures table-level foreign keys", () => {
    expect(model.relations).toContainEqual({
      from: "comments",
      fromColumn: "post_id",
      to: "posts",
      toColumn: "id",
    });
  });
});

describe("toDot", () => {
  const model = parseDDL(DDL);
  it("emits a valid DOT graph with nodes and edges", () => {
    const dot = toDot(model);
    expect(dot).toContain("digraph ERD");
    expect(dot).toContain('"users"');
    expect(dot).toContain('"posts" -> "users"');
  });
});

describe("visualize CLI", () => {
  it("produces JSON by default", () => {
    const out = JSON.parse(visualize(DDL));
    expect(out.tables).toHaveLength(3);
  });
  it("produces DOT with --dot", () => {
    expect(visualize(DDL, "dot")).toContain("digraph ERD");
  });
});

describe("edge cases", () => {
  it("handles empty input", () => {
    expect(parseDDL("").tables).toHaveLength(0);
  });
  it("ignores block comments", () => {
    const m = parseDDL("/* x */ CREATE TABLE t (id INT PRIMARY KEY);");
    expect(m.tables).toHaveLength(1);
  });
});
