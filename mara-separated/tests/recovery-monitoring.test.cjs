const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

async function loadMonitoring() {
  const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'recovery-monitoring.js'), 'utf8');
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}
const hash = 'a'.repeat(64);
const good = { id: 'restore_a', manifest: { projectId: 'mara-school-test', namespace: 'testWorkspaces/modules-v1', sourceHash: hash, expectedChunks: 2, state: 'staging', completionVerification: 'server-required-not-run', totalRecords: 7 }, chunks: [{ index: 1 }, { index: 0 }] };

test('recovery health report is deterministic, payload-free, and healthy for fixed slots', async () => {
  const m = await loadMonitoring();
  const report = m.buildRecoveryHealthReport({ snapshots: [good] });
  assert.equal(report.status, 'healthy');
  assert.deepEqual(report.counts, { snapshots: 1, critical: 0, warning: 0 });
  assert.deepEqual(report.snapshots[0], { id: 'restore_a', state: 'staging', expectedChunks: 2, observedChunks: 2, completeSlots: true, sourceHashPrefix: 'aaaaaaaaaaaa', totalRecords: 7, provenanceOk: true });
  assert.equal(JSON.stringify(report).includes('payload'), false);
  assert.deepEqual(report, m.buildRecoveryHealthReport({ snapshots: [good] }));
});

test('recovery health report detects provenance, hash, slot and state failures', async () => {
  const m = await loadMonitoring();
  const report = m.buildRecoveryHealthReport({ snapshots: [{ id: 'bad', manifest: { projectId: 'wrong', namespace: 'other', sourceHash: 'bad', expectedChunks: 2, state: 'complete', completionVerification: 'claimed', totalRecords: 1 }, chunks: [{ index: 0 }, { index: 0 }] }] });
  assert.equal(report.status, 'critical');
  assert.equal(report.counts.critical, 2);
  assert.equal(report.counts.warning, 3);
  assert.deepEqual(report.issues.map(x => x.code), ['incomplete-or-invalid-chunk-slots', 'invalid-source-hash', 'provenance-mismatch', 'unexpected-completion-marker', 'unexpected-snapshot-state']);
});
