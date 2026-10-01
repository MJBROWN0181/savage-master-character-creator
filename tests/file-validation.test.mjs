import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const source=await readFile(new URL('../design/file-validation.js',import.meta.url),'utf8');
const validate=runInNewContext(source+';validateDemoFile',{Uint8Array});
test('rejects a script disguised as an image or PDF',async()=>{
  assert.equal(await validate(new Blob(['<script>alert(1)</script>'],{type:'image/png'})),false);
  assert.equal(await validate(new Blob(['fake PDF'],{type:'application/pdf'})),false);
});
test('accepts supported image headers and rejects active SVG',async()=>{
  assert.equal(await validate(new Blob([new Uint8Array([137,80,78,71,13,10,26,10])],{type:'image/png'})),true);
  assert.equal(await validate(new Blob(['<svg onload="alert(1)"></svg>'],{type:'image/svg+xml'})),false);
});
test('rejects binary executable bytes labelled as plain text',async()=>{
  assert.equal(await validate(new Blob(['MZbinary'],{type:'text/plain'})),false);
  assert.equal(await validate(new Blob(['Session notes'],{type:'text/plain'})),true);
});
