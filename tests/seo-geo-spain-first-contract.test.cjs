const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
test('Release A Studio exposes Spanish only',()=>{const src=fs.readFileSync('rubik-seo-geo-studio.js','utf8');assert.doesNotMatch(src,/\[\s*['"]en['"]\s*,\s*['"]English/);assert.match(src,/\[\s*\[['"]es['"]/);});
