/** Seed data is dated around 17 Apr 2026 (mockup). DEMO_NOW keeps KPIs stable. */
export function now(): Date {
  return process.env.DEMO_NOW ? new Date(process.env.DEMO_NOW) : new Date();
}
