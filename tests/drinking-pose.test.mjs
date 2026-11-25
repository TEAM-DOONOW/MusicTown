import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
const context = { exports: {}, require: () => ({}) };
vm.runInNewContext(
  ts.transpileModule(
    readFileSync(new URL('../src/scene/avatar/drinkingAvatar.ts', import.meta.url), 'utf8'),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  context,
);
const { drinkingArmPose, drinkingCupRim } = context.exports;
test('cup rim reaches the mouth at the peak of a sip', () => {
  const rim = drinkingCupRim(1);
  assert.ok(Math.hypot(rim.x - 256, rim.y - 225) < 2);
});
test('the elbow stays low at the side instead of folding up into the face', () => {
  for (let frame = 0; frame <= 100; frame++) {
    const p = drinkingArmPose(frame / 100);
    // Below the shoulder (y 294) and outside the torso seam, under the hand.
    assert.ok(p.elbowY > 300, `elbow too high at ${frame}`);
    assert.ok(p.elbowX > 305, `elbow inside the torso at ${frame}`);
  }
  const peak = drinkingArmPose(1);
  assert.ok(peak.elbowY > peak.handY + 30, 'the forearm points up to the mouth at the peak');
});
test('hand and elbow move without jumps throughout the sip', () => {
  let previous;
  for (let frame = 0; frame <= 100; frame++) {
    const p = drinkingArmPose(frame / 100);
    if (previous) {
      assert.ok(Math.hypot(p.handX - previous.handX, p.handY - previous.handY) < 3);
      assert.ok(Math.hypot(p.elbowX - previous.elbowX, p.elbowY - previous.elbowY) < 3);
    }
    previous = p;
  }
});
