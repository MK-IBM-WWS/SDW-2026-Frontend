import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { cosineSimilarity, rankTariffs, selectResults, validDescription } from '../src/native/search.ts';

test('cosine handles identity, opposite direction, zero and dimension mismatch',()=>{
 assert.equal(cosineSimilarity([1,0],[1,0]),1);
 assert.equal(cosineSimilarity([1,0],[-1,0]),-1);
 assert.equal(cosineSimilarity([0,0],[1,0]),0);
 assert.throws(()=>cosineSimilarity([1],[1,0]));
});
test('threshold is applied before TopK; raw cosine and normalized scores remain explicit',()=>{
 const items=[1,2,3].map(tariff_id=>({tariff_id}));
 const ranked=rankTariffs(items,{1:[0.8,0.6],2:[1,0],3:[0,1]},[1,0]);
 assert.deepEqual(ranked.map(row=>row.tariff_id),[2,1,3]);
 assert.deepEqual(selectResults(ranked,0.4,1).map(row=>row.tariff_id),[2]);
 assert.deepEqual(selectResults(ranked,0.95,10).map(row=>row.tariff_id),[2]);
 assert.equal(ranked[1].cosine,0.8);
 assert.equal(ranked[1].score,0.9);
 assert.equal(selectResults(ranked,0.7,10).length,2);
});
test('descriptions reject Cyrillic, short and oversized text',()=>{
 assert.equal(validDescription('A photo of a striped tiger walking in the wild, for cloud image recognition.'),true);
 assert.equal(validDescription('Cloud '.repeat(20)),false);
 assert.equal(validDescription('Тариф с описанием на русском языке для облачного сервера и модели.'),false);
 assert.equal(validDescription('tiger'),false);
});
test('native configuration pins API and HTTP capability to the same LAN origin',()=>{
 const target=JSON.parse(readFileSync('src/native/target_config.json'));
 const capability=JSON.parse(readFileSync('src-tauri/capabilities/default.json'));
 assert.equal(capability.permissions[1].allow[0].url,`${target.apiOrigin}/api/native/**`);
 assert.equal(new URL(target.apiOrigin).hostname.startsWith('127.'),false);
});

test('automatic refresh runs every 15 seconds, skips overlaps and aborts on cleanup',async t=>{
 const {startPolling,REFRESH_INTERVAL_MS}=await import('../src/native/polling.ts');
 assert.equal(REFRESH_INTERVAL_MS,15000);
 t.mock.timers.enable({apis:['setInterval']});
 let calls=0,release,signal;
 const stop=startPolling(async current=>{calls++;signal=current;await new Promise(resolve=>{release=resolve;});});
 assert.equal(calls,1);
 t.mock.timers.tick(15000);assert.equal(calls,1);
 release();await Promise.resolve();await Promise.resolve();
 t.mock.timers.tick(15000);assert.equal(calls,2);
 stop();assert.equal(signal.aborted,true);release();
 t.mock.timers.tick(30000);assert.equal(calls,2);
});
