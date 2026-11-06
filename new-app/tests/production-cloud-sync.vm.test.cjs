'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm');
const source=fs.readFileSync(require('path').join(__dirname,'..','cloud-sync.js'),'utf8');
const admin={uid:'8oI8nKYo43ftqUkk0FJ4SdvIa3l1'};
const events={};
function node(){return {hidden:false,disabled:false,textContent:'',onclick:null}}
const nodes=Object.fromEntries(['cloudStatus','cloudSignOut','cloudActions','cloudEmail','cloudPassword','cloudSignIn','cloudInitialize','cloudRetry','cloudLock'].map(x=>[x,node()]));
const body={classList:{set:new Set(),toggle(k,on){on?this.set.add(k):this.set.delete(k)},contains(k){return this.set.has(k)}}};
let authCallback,listener,model=0,txCount=0,remote={format:'mara-new-admin-snapshot',version:1,revision:0,snapshot:{format:'mara-school-demo',version:1,savedAt:'2026-01-01T00:00:00.000Z',data:{n:0}}};
const db={collection(){return {doc(){return {onSnapshot(ok,fail){listener={ok,fail};return ()=>{listener=null}}}}}},async runTransaction(fn){txCount++;let next;await fn({get:async()=>({exists:!!remote,data:()=>structuredClone(remote)}),set:(_,v)=>{next=structuredClone(v)}});remote=next}};
const document={readyState:'complete',body,getElementById:id=>nodes[id]||(nodes[id]=node()),addEventListener:(type,fn)=>{(events[type]||(events[type]=[])).push(fn)},dispatchEvent:e=>{for(const fn of events[e.type]||[])fn(e)}};
const authObject={currentUser:null,onAuthStateChanged:fn=>{authCallback=fn},signInWithEmailAndPassword:async()=>{},signOut:()=>{authObject.currentUser=null;authCallback(null)}};
const context={console,document,CustomEvent:function(type){this.type=type},TextEncoder,queueMicrotask,confirm:()=>true,structuredClone,setTimeout,clearTimeout,
 schoolSnapshot:()=>({format:'mara-school-demo',version:1,savedAt:'2026-01-01T00:00:00.000Z',data:{n:model}}),checkBackup:x=>x,restoreSchool:x=>{model=x.data.n},render:()=>{},
 firebase:{initializeApp:()=>{},auth:()=>authObject,firestore:Object.assign(()=>db,{FieldValue:{serverTimestamp:()=>({'.sv':'timestamp'})}})}
};
(async()=>{
context.window={maraAppReady:Promise.resolve()};vm.createContext(context);vm.runInContext(source,context,{filename:'cloud-sync.js'});await new Promise(r=>setImmediate(r));
authObject.currentUser=admin;authCallback(admin);assert(listener,'authorized user starts listener');
listener.ok({exists:true,data:()=>structuredClone(remote),metadata:{hasPendingWrites:false}});
assert(!body.classList.contains('cloud-locked'),'authorized remote snapshot unlocks records');
model=1;document.dispatchEvent(new context.CustomEvent('mara:autosave'));await new Promise(r=>setImmediate(r));
assert.equal(txCount,1);assert.equal(remote.revision,1);assert.equal(remote.snapshot.data.n,1);
// Two quick autosaves during a write must result in a second queued write, not loss.
let release;const gate=new Promise(r=>release=r);let gated=true;const normal=db.runTransaction.bind(db);db.runTransaction=async fn=>{if(gated){gated=false;await gate}return normal(fn)};
model=2;document.dispatchEvent(new context.CustomEvent('mara:autosave'));await new Promise(r=>setImmediate(r));model=3;document.dispatchEvent(new context.CustomEvent('mara:autosave'));release();await new Promise(r=>setTimeout(r,10));
assert.equal(remote.revision,3);assert.equal(remote.snapshot.data.n,3);assert.equal(txCount,3);
// A pending acknowledgement advances revision but never restores its own snapshot.
listener.ok({exists:true,data:()=>structuredClone(remote),metadata:{hasPendingWrites:true}});assert.equal(model,3);
// Sign-out relocks and clears cached model using the captured blank snapshot.
authCallback(null);assert(body.classList.contains('cloud-locked'));assert.equal(model,0);
console.log('production-cloud-sync.vm: PASS — actual cloud-sync.js lock, transaction init, queued edits, pending acknowledgement, signout clear');
})().catch(e=>{console.error(e);process.exit(1)});
