import assert from 'node:assert/strict';
import { getCoverContentLift, getFadeReadingMetrics } from '../utils/hero-layout-metrics.ts';

const coverLift = getCoverContentLift({
  hasBackgroundImage: true,
  hasForegroundImage: false,
  verticalAlign: 'bottom',
});

assert.equal(coverLift > 0, true);

const coverLiftWithCutout = getCoverContentLift({
  hasBackgroundImage: true,
  hasForegroundImage: true,
  verticalAlign: 'bottom',
});

assert.equal(coverLiftWithCutout, 0);
assert.equal(
  getCoverContentLift({
    hasBackgroundImage: true,
    hasForegroundImage: false,
    verticalAlign: 'center',
  }),
  0,
);

const rightFadeMetrics = getFadeReadingMetrics('right', 920);
assert.equal(rightFadeMetrics.panelMaxWidth, 496.8);
assert.equal(rightFadeMetrics.zoneCoverage, 0.78);
assert.equal(rightFadeMetrics.panelEdgeInset, 72);
assert.equal(rightFadeMetrics.zoneStrongStop, 0.3);
assert.equal(rightFadeMetrics.zoneFadeStop, 0.7);

const topFadeMetrics = getFadeReadingMetrics('top', 920);
assert.equal(topFadeMetrics.panelMaxWidth, 680.8);
assert.equal(topFadeMetrics.zoneCoverage, 0.66);
assert.equal(topFadeMetrics.panelEdgeInset, 42);
assert.equal(topFadeMetrics.zoneStrongStop, 0.28);
assert.equal(topFadeMetrics.zoneFadeStop, 0.7);

console.log('hero-layout-metrics.test.ts passed');
