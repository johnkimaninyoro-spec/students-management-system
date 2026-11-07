'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/../public/modules.js','utf8').replace(/^import .*;\n/gm,'');
const OWNER='QDzGG9f4fPgEBdGKm93gbnOXeC63';
function deferred(){let resolve,reject;let promise=new Promise((a,b)=>{resolve=a;reject=b});return {promise,resolve,reject}}
function app(){
  const nodes={},commits=[],prints=[];let nextCommit;
  const el=()=>({innerHTML:'',textContent:'',onclick:null,onsubmit:null,disabled:false,classList:{toggle(){},add(){},remove(){}},querySelectorAll(){return[]}});
  const x={document:{querySelector:s=>nodes[s]||(nodes[s]=el()),querySelectorAll:()=>[]},console,FormData:function(){},window:{print:()=>prints.push('print')},serverTimestamp:()=>({}),collection:()=>({}),doc:(...a)=>({id:'d'+a.length}),writeBatch:()=>({set(){},update(){},commit(){nextCommit=deferred();commits.push(nextCommit);return nextCommit.promise}}),query:()=>({}),orderBy:()=>({}),onSnapshot:()=>()=>{},initializeApp:()=>({}),getAuth:()=>({}),getFirestore:()=>({}),onAuthStateChanged:()=>{},signInWithEmailAndPassword:async()=>{},signOut:async()=>{}};
  vm.createContext(x);vm.runInContext(src,x);
  vm.runInContext(`user={uid:'${OWNER}'};view='reports';base={classes:[{id:'c1',name:'1A'}],learners:[{id:'l1',admissionNo:'ONE',firstName:'One',lastName:'Only',classId:'c1'}],staff:[]};records=[{id:'t1',kind:'term',label:'T1'},{id:'s1',kind:'subject',label:'Math',classId:'c1'},{id:'m1',kind:'mark',learnerId:'l1',subjectId:'s1',termId:'t1',score:82,status:'published'},{id:'charge',kind:'ledger',learnerId:'l1',entryType:'charge',amountCents:1000}];reportSelection={learnerId:'l1',termId:'t1'}`,x);
  return {x,nodes,commits,prints,getCommit:()=>nextCommit};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('actual report audit listener rerender preserves the selected report and prints only after the same scoped commit',async()=>{
  const {x,nodes,commits,prints,getCommit}=app();
  vm.runInContext('reports()',x);
  assert.match(nodes['#selectedReport'].innerHTML,/ONE — One Only/);
  nodes['#printSelected'].onclick();
  assert.equal(commits.length,1,'one audit commit starts');
  assert.match(nodes['#selectedReport'].innerHTML,/Preparing print/);
  vm.runInContext("records=records.concat([{id:'audit-listener-rerender',kind:'printAccess'}]);reports()",x);
  assert.match(nodes['#selectedReport'].innerHTML,/ONE — One Only/,'listener rerender rebuilds current report');
  assert.match(nodes['#selectedReport'].innerHTML,/Preparing print/,'pending state remains visible');
  getCommit().resolve();await flush();
  assert.deepEqual(prints,['print']);
});
test('duplicate clicks do not create duplicate pending print commits',()=>{
  const {x,nodes,commits}=app();vm.runInContext('reports()',x);
  nodes['#printSelected'].onclick();nodes['#printSelected'].onclick();
  assert.equal(commits.length,1);
});
test('session invalidation or navigation while audit commit is pending cancels printing',async()=>{
  for(const cancellation of ['clearAuthState()','changeView(\'dashboard\')']){
    const {x,nodes,prints,getCommit}=app();vm.runInContext('reports()',x);nodes['#printSelected'].onclick();
    vm.runInContext(cancellation,x);getCommit().resolve();await flush();
    assert.deepEqual(prints,[],cancellation);
  }
});
