// Vercel serverless function: POST /api/visitor  (no database; email only)
const TYPES=["Recruiter / Hiring Manager","AI or Software Engineer","Startup Founder","Data Professional","Student","Other"];
const PURPOSES=["Explore AI projects","Review my resume","Discuss a job opportunity","Explore a collaboration","General browsing"];
const clean=(s,max)=>String(s??"").replace(/[\r\n\u2028\u2029\t]+/g," ").replace(/[<>]/g,"").trim().slice(0,max);
const esc=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function validate(b){
  if(!b||typeof b!=="object")return{error:"Invalid request"};
  if(b.consent!==true)return{error:"Consent is required"};
  const name=clean(b.name,80),city=clean(b.city,80);
  if(!name)return{error:"Name is required"};
  const type=b.type?String(b.type):"Other",purpose=b.purpose?String(b.purpose):"";
  if(!TYPES.includes(type))return{error:"Invalid visitor type"};
  if(purpose&&!PURPOSES.includes(purpose))return{error:"Invalid purpose"};
  return{value:{name,city,type,purpose}};
}
const hits=new Map(); // best-effort per instance; use Vercel KV/Upstash for strict limits
function limited(ip){const now=Date.now(),a=(hits.get(ip)||[]).filter(t=>now-t<6e5);a.push(now);hits.set(ip,a);return a.length>5}
async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({ok:false});
  const len=+(req.headers["content-length"]||0);if(len>4096)return res.status(413).json({ok:false});
  const ip=String(req.headers["x-forwarded-for"]||"").split(",")[0].trim()||"unknown";
  if(limited(ip))return res.status(429).json({ok:false,error:"Too many requests"});
  const body=typeof req.body==="string"?(()=>{try{return JSON.parse(req.body)}catch{return null}})():req.body;
  if(body&&body.website)return res.status(200).json({ok:true}); // honeypot: bots
  const v=validate(body);if(v.error)return res.status(400).json({ok:false,error:v.error});
  const {RESEND_API_KEY,RESEND_FROM,NOTIFY_TO}=process.env;
  if(!RESEND_API_KEY||!RESEND_FROM||!NOTIFY_TO)return res.status(503).json({ok:false,error:"Email not configured"});
  const d=v.value,time=new Date().toISOString();
  const text=`Someone new has entered your AI portfolio.\n\nName: ${d.name}\nLocation: ${d.city||"not shared"}\nVisitor Type: ${d.type}\nPurpose: ${d.purpose||"not shared"}\nTime: ${time}\n\nPortfolio: https://protfolio-sunil-kulali.vercel.app/`;
  try{
    const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({from:RESEND_FROM,to:[NOTIFY_TO],subject:`New Portfolio Visitor — ${d.type}`,text,html:`<pre style="font:14px/1.6 system-ui">${esc(text)}</pre>`})});
    if(!r.ok)return res.status(502).json({ok:false,error:"Email provider rejected the request"});
    return res.status(200).json({ok:true});
  }catch{return res.status(502).json({ok:false,error:"Email delivery failed"})}
}
module.exports=handler;module.exports.validate=validate;
