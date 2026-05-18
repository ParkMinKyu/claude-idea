import { faker } from '@faker-js/faker';

export interface Endpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  status: number;
  delayMs?: number;
  errorRate?: number; // 0..1
  response: unknown; // static JSON or template with {{faker.x.y}}
}

export interface Project {
  slug: string;
  endpoints: Endpoint[];
  createdAt: number;
}

// In-memory store; in production back with Redis.
const projects = new Map<string, Project>();

export function createProject(slug: string, endpoints: Endpoint[]): Project {
  if (projects.has(slug)) throw new Error('slug exists');
  const p: Project = { slug, endpoints, createdAt: Date.now() };
  projects.set(slug, p);
  return p;
}

export function getProject(slug: string): Project | undefined {
  return projects.get(slug);
}

export function clearAll(): void {
  projects.clear();
}

const tmplRe = /\{\{faker\.(\w+)\.(\w+)\}\}/g;

export function renderTemplate(value: unknown, seed?: number): unknown {
  if (seed !== undefined) faker.seed(seed);
  if (typeof value === 'string') {
    return value.replace(tmplRe, (_, ns, fn) => {
      const mod = (faker as unknown as Record<string, Record<string, () => unknown>>)[ns];
      if (mod && typeof mod[fn] === 'function') return String(mod[fn]());
      return '';
    });
  }
  if (Array.isArray(value)) return value.map((v) => renderTemplate(v));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = renderTemplate(v);
    return out;
  }
  return value;
}

export function matchEndpoint(
  project: Project,
  method: string,
  path: string
): Endpoint | undefined {
  return project.endpoints.find((e) => e.method === method && e.path === path);
}
