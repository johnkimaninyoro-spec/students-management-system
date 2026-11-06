const {test,before,after}=require("node:test");
const fs=require("node:fs");
const {initializeTestEnvironment,assertFails,assertSucceeds}=require("@firebase/rules-unit-testing");
const {doc,setDoc,getDoc,deleteDoc}=require("firebase/firestore");
let env,uid;
before(async()=>{const rules=fs.readFileSync("../firestore.rules.candidate","utf8");uid=rules.match(/request\.auth\.uid == .([^\n]+).;/)[1];env=await initializeTestEnvironment({projectId:"demo-mara-school-test",firestore:{host:"127.0.0.1",port:18080,rules}})});
after(async()=>{if(env)await env.cleanup()});
test("admin snapshot allowed; guest teacher and legacy paths denied",async()=>{const admin=env.authenticatedContext(uid).firestore();const teacher=env.authenticatedContext("fictional-teacher").firestore();const guest=env.unauthenticatedContext().firestore();const path="newAppSnapshots/wholeSchool";for(const db of [teacher,guest]){await assertFails(getDoc(doc(db,path)));await assertFails(setDoc(doc(db,path),{fictional:true}));}await assertSucceeds(setDoc(doc(admin,path),{fictional:true,revision:0}));await assertSucceeds(getDoc(doc(admin,path)));for(const db of [admin,teacher,guest]){await assertFails(getDoc(doc(db,"students/fictional")));await assertFails(setDoc(doc(db,"students/fictional"),{fictional:true}));}await assertSucceeds(deleteDoc(doc(admin,path)));});
