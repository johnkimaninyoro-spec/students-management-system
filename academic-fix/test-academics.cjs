const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(__dirname+'/modules.js','utf8');
const original=fs.readFileSync(__dirname+'/modules.before.js','utf8');
function renderCheck(src){
 const nodes={};let text='';const target={get innerHTML(){return text},set innerHTML(v){text=v;nodes.subject={onsubmit:null};nodes.term={onsubmit:null};nodes.mark={onsubmit:null};nodes.workflowDraft={};nodes.workflowCorrection={}},insertAdjacentHTML(position,v){assert.equal(position,'beforeend');text+=v;nodes.workflowDraft={};nodes.workflowCorrection={}}};
 const handler=()=>{};const ctx={listenWorkflow(){},legacyAcademics(){target.innerHTML='legacy';nodes.subject.onsubmit=handler;nodes.term.onsubmit=handler;nodes.mark.onsubmit=handler},$:s=>s==='#view'?target:nodes[s.slice(1)],by:()=>[],staffWorkflowMarks:[],staffMarkCorrections:[],base:{learners:[]},sel:()=>'',inp:()=>'',name:()=>'',workflowDraft(){},workflowCorrection(){},document:{querySelectorAll:()=>[]}};
 vm.runInNewContext(src.slice(src.indexOf('function academics()'),src.indexOf('async function workflowDraft')),ctx);ctx.academics();return ['subject','term','mark'].every(k=>nodes[k].onsubmit===handler)&&typeof nodes.workflowDraft.onsubmit==='function';
}
async function draftCheck(src,{learnerClass='classA',subjectClass='classA',score='68'}={}){
 let written=null,notice='',reset=0,prevented=false;const ctx={FormData:class{constructor(){return [['learnerId','learnerA'],['subjectId','subjectA'],['termId','termA'],['score',score]]}},base:{learners:[{id:'learnerA',classId:learnerClass}]},by:()=>[{id:'subjectA',classId:subjectClass}],note:m=>notice=m,doc:()=>({id:'markA'}),collection:()=>({}),db:{},user:{uid:'authorA'},serverTimestamp:()=>1,buildMarkDraft:x=>{assert.equal(x.classId,learnerClass);assert.equal(x.score,Number(score));return {data:x}},writeBatch:()=>({set(r,data){written=data;return {commit:async()=>{}}}})};
 vm.runInNewContext(src.slice(src.indexOf('async function workflowDraft'),src.indexOf('async function workflowMarkAction')),ctx);await ctx.workflowDraft({preventDefault(){prevented=true},target:{reset(){reset++}}});return {written,notice,reset,prevented};
}
(async()=>{let count=0;assert.equal(renderCheck(original),false);count++;assert.equal(renderCheck(source),true);count++;
 const before=await draftCheck(original);assert.equal(before.written,null);count++;
 const good=await draftCheck(source);assert.equal(good.written.classId,'classA');assert.equal(good.notice,'Workflow draft created.');assert.equal(good.reset,1);assert(good.prevented);count++;
 const mismatch=await draftCheck(source,{subjectClass:'otherClass'});assert.equal(mismatch.written,null);count++;
 for(const score of ['-1','101','68.5','abc']){assert.equal((await draftCheck(source,{score})).written,null);count++}
 const code=fs.readFileSync(__dirname+'/staff-role-workflows.js','utf8');const builders=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));const built=builders.buildMarkDraft({id:'markA',authorUid:'authorA',learnerId:'learnerA',classId:'classA',subjectId:'subjectA',termId:'termA',score:68,now:1});assert.equal(built.data.classId,'classA');assert.equal(built.data.status,'draft');count++;
 console.log(`${count} academic regression checks passed. Real Firebase persistence and hosted behavior NOT verified.`);
})().catch(e=>{console.error(e);process.exit(1)});
