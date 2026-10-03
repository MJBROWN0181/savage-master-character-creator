import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bugFlightPath } from '../bug-flight.mjs';

test('curved flight stays bounded on phones and desktop and lands upright', () => {
  for (const bounds of [{left:16,top:16,right:280,bottom:620}, {left:30,top:180,right:1300,bottom:680}]) {
    for (const [start,end] of [
      [{x:bounds.left,y:bounds.bottom},{x:bounds.right,y:bounds.top}],
      [{x:bounds.right,y:bounds.top},{x:bounds.left,y:bounds.bottom}],
    ]) {
      const path = bugFlightPath(start,end,bounds);
      assert.deepEqual({x:path[0].x,y:path[0].y},start);
      assert.deepEqual({x:path.at(-1).x,y:path.at(-1).y},end);
      for (const point of path) {
        assert.ok(point.x >= bounds.left && point.x <= bounds.right);
        assert.ok(point.y >= bounds.top && point.y <= bounds.bottom);
        assert.ok(Math.abs(point.bank) <= 9);
      }
      assert.ok(Math.abs(path.at(-1).bank) < 1e-10);
      assert.ok(Math.abs(path[12].bank) > 8);
    }
  }
});
