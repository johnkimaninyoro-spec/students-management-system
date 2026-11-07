'use strict';
// Exercises the actual modules.js payment save path without any network or production data.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const src=fs.readFileSync(__dirname+'/../public/modules.js','utf8').replace(/^import .*;\n/gm,'');
const OWNER='QDzGG9f4fPgEBdGKm93gbnOXeC63';
function runPayment(fields){
 const writes=[];let serial=0;
 const el=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){}},querySelectorAll(){return[]}});
 const box={document:{querySelector:()=>el(),querySelectorAll:()=>[]},console,FormData:function(target){return Object.entries(target.fields)},serverTimestamp:()=>({serverTimestamp:true}),collection:(...parts)=>parts,doc:(...parts)=>({id:'r'+(++serial),path:parts.flat(Infinity).join('/')}),writeBatch:()=>({set(ref,data){writes.push({op:'set',ref,data})},update(ref,data){writes.push({op:'update',ref,data})},commit:async()=>{}}),query:()=>({}),orderBy:()=>({}),onSnapshot:()=>()=>{},initializeApp:()=>({}),getAuth:()=>({}),getFirestore:()=>({}),onAuthStateChanged:()=>{},signInWithEmailAndPassword:async()=>{},signOut:async()=>{},window:{print(){}}};
 vm.createContext(box);vm.runInContext(src,box);
 vm.runInContext(`user={uid:${JSON.stringify(OWNER)}};base={classes:[],learners:[{id:'l1',admissionNo:'F-1',firstName:'Fictional',lastName:'Learner'}],staff:[]};records=[];`,box);
 return vm.runInContext(`save({preventDefault(){},target:{fields:${JSON.stringify(fields)},reset(){}}},'payment')`,box).then(()=>writes);
}
test('M-Pesa evidence normalizes only 8–20 alphanumeric references',()=>{
 const box={};vm.createContext(box);vm.runInContext(src.match(/function mpesaRef\([^]*?\n/)[0],box);
 assert.equal(vm.runInContext("mpesaRef(' qwe12rt9 ')",box),'QWE12RT9');
 for(const value of ['ABC1234','MPESA-1234','ABC 12345','A'.repeat(21),'']) assert.equal(vm.runInContext(`mpesaRef(${JSON.stringify(value)})`,box),'',value);
});
test('valid M-Pesa payment writes ledger, immutable audit, and unique reference index in one batch',async()=>{
 const writes=await runPayment({learnerId:'l1',amount:'12.50',transactionRef:'qwe12rt9',reason:'fictional fee payment'});
 assert.equal(writes.length,3);
 const ledger=writes.find(w=>w.data.kind==='ledger').data;
 assert.deepEqual(Object.keys(ledger).sort(),['amountCents','approvedBy','auditId','createdAt','entryType','kind','learnerId','reason','reversalOf','revision','transactionRef','updatedAt'].sort());
 assert.deepEqual({kind:ledger.kind,entryType:ledger.entryType,learnerId:ledger.learnerId,amountCents:ledger.amountCents,transactionRef:ledger.transactionRef,approvedBy:ledger.approvedBy},{kind:'ledger',entryType:'payment',learnerId:'l1',amountCents:1250,transactionRef:'QWE12RT9',approvedBy:OWNER});
 const index=writes.find(w=>w.ref.path.includes('paymentReferenceIndex'));
 assert.match(index.ref.path,/paymentReferenceIndex\/QWE12RT9$/);assert.equal(index.data.entryId,writes.find(w=>w.data.kind==='ledger').ref.id);
 assert.ok(writes.some(w=>w.ref.path.includes('/audit/')&&w.data.action==='created'));
});
test('invalid M-Pesa evidence produces no Firestore write',async()=>{
 for(const transactionRef of ['ABC1234','MPESA-1234','ABC 12345','A'.repeat(21),'']) assert.deepEqual(await runPayment({learnerId:'l1',amount:'1',transactionRef,reason:'fictional fee payment'}),[],transactionRef||'empty');
});
