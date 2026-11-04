import {scoreTrader,type Evidence} from "./scoring";
export type CopyCandidate={id:string;name:string;platform:string;profileUrl:string;evidence:Evidence};
export function rankCopyCandidates(candidates:CopyCandidate[],now=new Date()){
 return candidates.map(candidate=>({candidate,assessment:scoreTrader(candidate.evidence,now)}))
 .sort((a,b)=>(b.assessment.score??-1)-(a.assessment.score??-1));
}
export function filterCopyCandidates(candidates:CopyCandidate[],query:string){
 const q=query.trim().toLowerCase();
 return candidates.filter(c=>!q||[c.name,c.platform,c.profileUrl].some(s=>s.toLowerCase().includes(q)));
}
