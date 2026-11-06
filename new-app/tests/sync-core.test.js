'use strict';
const assert=require('assert');
const MAX=700*1024;
function byteLength(value){return new TextEncoder().encode(JSON.stringify(value)).length}
class MockDoc { constructor(){this.value=null} async runTransaction(fn){const base=this.value&&structuredClone(this.value);const tx={get:async()=>base?{exists:true,data:()=>structuredClone(base)}:{exists:false},set:(_,v)=>{this.next=structuredClone(v)}};await fn(tx);this.value=this.next;this.next=null} }
async function guardedWrite(doc, expected, snapshot){
 const raw=JSON.stringify(snapshot); if(new TextEncoder().encode(raw).length>MAX)throw Error('oversize');
 await doc.runTransaction(async tx=>{const before=await tx.get();if(!before.exists)throw Error('empty');const remote=before.data();if(remote.revision!==expected)throw Error('conflict');tx.set(null,{format:'mara-new-admin-snapshot',version:1,revision:expected+1,snapshot})});
}
(async()=>{
 const doc=new MockDoc(); doc.value={format:'mara-new-admin-snapshot',version:1,revision:0,snapshot:{data:{}}};
 await guardedWrite(doc,0,{data:{safe:true}});assert.equal(doc.value.revision,1);assert.equal(doc.value.snapshot.data.safe,true);
 await assert.rejects(()=>guardedWrite(doc,0,{data:{stale:true}}),/conflict/);assert.equal(doc.value.revision,1);assert.equal(doc.value.snapshot.data.safe,true);
 await assert.rejects(()=>guardedWrite(doc,1,{data:{text:'x'.repeat(MAX)}}),/oversize/);assert(byteLength({data:{small:true}})<MAX);
 console.log('sync-core: PASS — transaction revision conflict and 700KB guard');
})().catch(e=>{console.error(e);process.exit(1)});
