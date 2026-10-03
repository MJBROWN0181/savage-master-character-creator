import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validMapHeader,validateMapFile,MAP_FILE_LIMIT} from '../map-files.mjs';
test('maps accept supported raster headers and reject disguised files and mismatched MIME types',async()=>{
  const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,13,73,72,68,82]);
  assert.equal(validMapHeader(png,'image/png'),true);assert.equal(validMapHeader(png,'image/jpeg'),false);
  assert.equal(validMapHeader(new TextEncoder().encode('<svg>active content</svg>'),'image/png'),false);
  assert.equal(validMapHeader(new TextEncoder().encode('<svg>active content</svg>'),'image/svg+xml'),false);
  await assert.doesNotReject(()=>validateMapFile(new Blob([png],{type:'image/png'})));
  await assert.rejects(()=>validateMapFile(new Blob([png],{type:'application/pdf'})));
  await assert.rejects(()=>validateMapFile({size:MAP_FILE_LIMIT+1}));
});
