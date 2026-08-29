import { describe, expect, it } from 'vitest';
import { reviewSurfaceRenders } from './review-surface';

describe('reviewSurfaceRenders', () => {
  it('renders ENGLISH, which is the only district the surface was built for', () => {
    expect(reviewSurfaceRenders('ENGLISH').renders).toBe(true);
  });
  it('REFUSES MATHS — the page would show an id and a notes box', () => {
    const v = reviewSurfaceRenders('MATHS');
    expect(v.renders).toBe(false);
    expect(v.why).toContain('verdict on nothing');
  });
  it('refuses VR and NVR for the same reason', () => {
    expect(reviewSurfaceRenders('VR').renders).toBe(false);
    expect(reviewSurfaceRenders('NVR').renders).toBe(false);
  });
  it('refuses an absent district rather than defaulting open', () => {
    expect(reviewSurfaceRenders(null).renders).toBe(false);
    expect(reviewSurfaceRenders(undefined).renders).toBe(false);
  });
});
