/**
 * The NVR district's generator architecture (BUILD-DISTRICT-NVR §3–4):
 * grammar → templates → checks → sampling → the serving door. Everything
 * here is pure and deterministic; the database and the app wrap it.
 */
export * from './grammar';
export * from './config';
export * from './misconceptions';
export * from './templates';
export * from './checks';
export * from './samples';
export * from './serving';
export * from './svg';
