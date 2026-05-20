// YAML multi-document parser for Kubernetes manifests.
// Produces resources + parse diagnostics without touching a cluster.
import { parseAllDocuments } from "yaml";

/**
 * Parse a YAML string that may contain multiple `---` separated documents.
 * @returns {{ resources: object[], errors: {message:string, doc:number}[] }}
 */
export function parseManifests(yamlText) {
  const resources = [];
  const errors = [];
  const docs = parseAllDocuments(yamlText ?? "");
  docs.forEach((doc, i) => {
    if (doc.errors && doc.errors.length) {
      for (const e of doc.errors) {
        errors.push({ message: e.message, doc: i });
      }
      return;
    }
    const json = doc.toJSON();
    // Skip empty documents (e.g. trailing `---`)
    if (json === null || json === undefined) return;
    resources.push(json);
  });
  return { resources, errors };
}

/** Build a stable human label for a resource. */
export function resourceLabel(resource) {
  const kind = resource?.kind ?? "Unknown";
  const name = resource?.metadata?.name ?? "<unnamed>";
  const ns = resource?.metadata?.namespace;
  return ns ? `${kind}/${name} (ns=${ns})` : `${kind}/${name}`;
}
