export const OLD_SPEC = {
  openapi: "3.0.0",
  info: { title: "Demo", version: "1.0.0" },
  paths: {
    "/users": {
      get: {
        parameters: [{ name: "page", in: "query", required: false }],
        responses: { "200": {}, "400": {} },
      },
      post: {
        parameters: [{ name: "body", in: "body", required: true }],
        responses: { "201": {} },
      },
    },
    "/legacy": {
      get: { responses: { "200": {} } },
    },
  },
};

export const NEW_SPEC = {
  openapi: "3.0.0",
  info: { title: "Demo", version: "2.0.0" },
  paths: {
    "/users": {
      get: {
        // page now required (breaking), new optional `limit` (non-breaking),
        // 2xx response removed (breaking), new 500 (info)
        parameters: [
          { name: "page", in: "query", required: true },
          { name: "limit", in: "query", required: false },
        ],
        responses: { "400": {}, "500": {} },
      },
      post: {
        parameters: [{ name: "body", in: "body", required: true }],
        responses: { "201": {} },
      },
    },
    // /legacy removed (breaking), /reports added (non-breaking)
    "/reports": {
      get: { responses: { "200": {} } },
    },
  },
};
