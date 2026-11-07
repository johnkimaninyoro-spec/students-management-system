'use strict';
// Executes the browser save() path with Firebase/DOM stubs and inspects its actual batch payloads.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/../public/modules.js','utf8').replace(/^import .*;\n/gm,'');
const OWNER='QDzGG9f4fPgEBdGKm93gbnOXeC63';
function run(kind,fields,{records=[],presenceStates=[]}={}){
 const writes=[];let n=0;
 const el=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return[]}});
 const box={document:{querySelector:()=>el(),querySelectorAll:()=>[]},console,
  FormData:function(target){return Object.entries(target.fields)},
  serverTimestamp:()=>({__serverTimestamp:true}),collection:(...p)=>p,doc:(...p)=>({id:'r'+(++n),path:p.flat(Infinity).join('/')}),
  writeBatch:()=>({set(ref,data){writes.push({op:'set',ref,data})},update(ref,data){writes.push({op:'update',ref,data})},commit:async()=>{}}),
  query:()=>({}),orderBy:()=>({}),onSnapshot:()=>()=>{},initializeApp:()=>({}),getAuth:()=>({}),getFirestore:()=>({}),onAuthStateChanged:()=>{},signInWithEmailAndPassword:async()=>{},signOut:async()=>{},window:{print(){}}};
 vm.createContext(box);vm.runInContext(src,box);
 vm.runInContext(`user={uid:${JSON.stringify(OWNER)}};records=${JSON.stringify(records)};presenceStates=${JSON.stringify(presenceStates)};base={classes:[],learners:[],staff:[]};`,box);
 return vm.runInContext(`save({preventDefault(){},target:{fields:${JSON.stringify(fields)},reset(){}}},${JSON.stringify(kind)})`,box).then(()=>writes);
}
function candidate(writes){return writes.find(x=>x.op==='set'&&x.data.kind).data}
function audit(writes){return writes.find(x=>x.ref.path.includes('/audit/')).data}
function assertInitial(writes,kind,fields){const d=candidate(writes),a=audit(writes);assert.deepEqual(Object.keys(d).sort(),['auditId','createdAt','kind','revision','updatedAt',...Object.keys(fields)].sort());assert.equal(d.kind,kind);assert.equal(d.revision,1);assert.equal(d.auditId,'a1');assert.equal(d.createdAt.__serverTimestamp,true);assert.equal(d.updatedAt.__serverTimestamp,true);assert.equal(a.action,'created');assert.equal(a.revision,1);assert.equal(a.reason,'initial typed event');assert.equal(a.actor,OWNER);assert.equal(a.at.__serverTimestamp,true)}
test('actual save serialization round-trips all boarding create payloads with timestamps and audit',async()=>{
 let w=await run('rollCall',{allocationId:'a1',date:'2026-03-02',present:'false'});assertInitial(w,'rollCall',{allocationId:'a1',date:'2026-03-02',present:false});assert.equal(candidate(w).present,false);
 w=await run('leaveApproval',{learnerId:'l1',leaveDate:'2026-03-02',reason:'Family visit'});assertInitial(w,'leaveApproval',{learnerId:'l1',leaveDate:'2026-03-02',reason:'Family visit',status:'approved'});assert.equal(candidate(w).status,'approved');
 w=await run('departure',{approvalId:'p1',date:'2026-03-03'},{records:[{id:'p1',kind:'leaveApproval',learnerId:'l1'}]});assertInitial(w,'departure',{approvalId:'p1',date:'2026-03-03',learnerId:'l1'});assert.ok(w.some(x=>x.ref.path.includes('/departureIndex/p1')));assert.ok(w.some(x=>x.ref.path.includes('/learnerPresenceState/l1')&&x.op==='set'));
 w=await run('return',{departureId:'d1',date:'2026-03-04'},{records:[{id:'d1',kind:'departure',learnerId:'l1'}],presenceStates:[{id:'l1',state:'away',departureId:'d1',lastDate:'2026-03-03'}]});assertInitial(w,'return',{departureId:'d1',date:'2026-03-04',learnerId:'l1'});assert.ok(w.some(x=>x.ref.path.includes('/returnIndex/d1')));assert.ok(w.some(x=>x.ref.path.includes('/learnerPresenceState/l1')&&x.op==='update'));
});
