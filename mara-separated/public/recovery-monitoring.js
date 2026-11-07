/** Pure metadata health report; never includes archive payloads or executes restores. */
export const PROJECT_ID='mara-school-test';
export const NAMESPACE='testWorkspaces/modules-v1';
const HASH=/^[a-f0-9]{64}$/;
export function buildRecoveryHealthReport({snapshots=[]}={}) {
  const issues=[], rows=[];
  for (const snapshot of snapshots) {
    const m=snapshot.manifest||{}, chunks=Array.isArray(snapshot.chunks)?snapshot.chunks:[];
    const expected=Number.isInteger(m.expectedChunks)&&m.expectedChunks>=1?m.expectedChunks:0;
    const indexes=chunks.map(x=>x?.index), complete=expected>0&&indexes.length===expected&&new Set(indexes).size===expected&&indexes.every(x=>Number.isInteger(x)&&x>=0&&x<expected);
    const provenanceOk=m.projectId===PROJECT_ID&&m.namespace===NAMESPACE;
    if(!complete) issues.push({id:snapshot.id,level:'critical',code:'incomplete-or-invalid-chunk-slots'});
    if(!HASH.test(m.sourceHash||'')) issues.push({id:snapshot.id,level:'critical',code:'invalid-source-hash'});
    if(!provenanceOk) issues.push({id:snapshot.id,level:'warning',code:'provenance-mismatch'});
    if(m.completionVerification!=='server-required-not-run') issues.push({id:snapshot.id,level:'warning',code:'unexpected-completion-marker'});
    if(m.state!=='staging') issues.push({id:snapshot.id,level:'warning',code:'unexpected-snapshot-state'});
    rows.push({id:snapshot.id,state:m.state,expectedChunks:expected,observedChunks:chunks.length,completeSlots:complete,sourceHashPrefix:typeof m.sourceHash==='string'?m.sourceHash.slice(0,12):'',totalRecords:m.totalRecords,provenanceOk});
  }
  const counts={snapshots:rows.length,critical:issues.filter(x=>x.level==='critical').length,warning:issues.filter(x=>x.level==='warning').length};
  return {status:counts.critical?'critical':counts.warning?'warning':'healthy',counts,snapshots:rows,issues};
}
/** Browser view; caller supplies Firestore functions so this module remains metadata-only. */
export function mountRecoveryMonitoring({container,db,user,ownerUid,onSnapshot,collection,query,orderBy,note}={}) {
  if(!container||!db||!user||user.uid!==ownerUid||!onSnapshot||!collection)return false;
  const title=document.createElement('h3'), detail=document.createElement('p'), output=document.createElement('pre');
  title.textContent='Staging restore drill monitoring'; detail.textContent='Metadata only — no restore control is available in this browser.'; output.setAttribute('aria-live','polite');container.replaceChildren(title,detail,output);
  const show=docs=>{const snapshots=docs.map(d=>({id:d.id,manifest:d.data(),chunks:[]}));const report=buildRecoveryHealthReport({snapshots});output.textContent=JSON.stringify(report,null,2);};
  try{return onSnapshot(query?query(collection(db,'restoreDrillsRuns'),orderBy?.('startedAt','desc')):collection(db,'restoreDrillsRuns'),s=>show(s.docs),e=>{output.textContent='Recovery metadata unavailable.';note?.(e.message,true);});}catch(e){output.textContent='Recovery metadata unavailable.';note?.(e.message,true);return false;}
}
