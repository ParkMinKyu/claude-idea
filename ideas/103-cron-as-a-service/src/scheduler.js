// In-memory scheduler that fires HTTP jobs at their cron times.
// Real product uses a durable queue (BullMQ) + Postgres for job persistence.
import { parseCron, nextRun } from "./cron.js";

export function createScheduler({ now = () => new Date(), executor } = {}) {
  const jobs = new Map();

  function addJob({ id, cron, url, method = "POST" }) {
    const parsed = parseCron(cron); // throws on invalid expression
    const job = { id, cron, url, method, parsed, nextAt: nextRun(parsed, now()) };
    jobs.set(id, job);
    return job;
  }

  /** Fire all jobs whose nextAt is <= the given tick time, then reschedule them. */
  async function tick(at = now()) {
    const fired = [];
    for (const job of jobs.values()) {
      if (job.nextAt && job.nextAt.getTime() <= at.getTime()) {
        const result = executor ? await executor(job) : { dispatched: true };
        fired.push({ id: job.id, at: job.nextAt, result });
        job.nextAt = nextRun(job.parsed, at);
      }
    }
    return fired;
  }

  return { addJob, tick, jobs };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sched = createScheduler({
    executor: async (job) => {
      const res = await fetch(job.url, { method: job.method });
      return { status: res.status };
    },
  });
  sched.addJob({ id: "demo", cron: "*/5 * * * *", url: "https://example.com/ping" });
  setInterval(async () => {
    const fired = await sched.tick();
    if (fired.length) console.log("fired:", fired);
  }, 30_000);
  console.log("cron scheduler started");
}
