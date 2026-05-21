import { modelFromSdl, findType } from "../ideas/109-graphql-playground/src/introspect.js";

const SAMPLE_SDL = `type Query {
  user(id: ID!): User
  posts(limit: Int): [Post!]!
}

type User {
  id: ID!
  name: String!
  role: Role!
  posts: [Post!]!
}

type Post {
  id: ID!
  title: String!
  author: User!
}

enum Role {
  ADMIN
  EDITOR
  VIEWER
}`;

window.__DEMO_SPEC__ = {
  description:
    "GraphQL SDL을 붙여넣으면 스키마를 빌드하고 표준 introspection을 실행하여 타입/필드/인자/enum을 평탄화한 모델로 보여줍니다.",
  fields: [
    { name: "sdl", type: "textarea", label: "GraphQL SDL", rows: 16, default: SAMPLE_SDL },
  ],
  run(v) {
    let model;
    try {
      model = modelFromSdl(v.sdl || "");
    } catch (e) {
      return [{ label: "스키마 오류", type: "error", value: e.message }];
    }
    const out = [
      {
        label: "루트 타입",
        type: "badge",
        value: `Query: ${model.queryType ?? "-"}${
          model.mutationType ? ` · Mutation: ${model.mutationType}` : ""
        }`,
        tone: "neutral",
      },
      {
        label: "타입 목록",
        type: "list",
        value: model.types.map(
          (t) =>
            `${t.kind} ${t.name}` +
            (t.fields.length ? ` (필드 ${t.fields.length})` : "") +
            (t.enumValues.length ? ` {${t.enumValues.join(", ")}}` : "")
        ),
      },
      { label: "평탄화 모델", type: "json", value: model },
    ];
    const user = findType(model, "User");
    if (user) {
      out.splice(2, 0, {
        label: "User 필드",
        type: "list",
        value: user.fields.map((f) => `${f.name}: ${f.type}`),
      });
    }
    return out;
  },
};
