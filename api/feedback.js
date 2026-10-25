// Vercel serverless function: POST /api/feedback  (email only, no database)
const {clean,esc,limiter,originAllowed}=require("./_lib");
const CATEGORIES=["Portfolio Design","AI Projects","Data Analytics","Technical Suggestion","Bug Report","Job Opportunity","Collaboration","Other"];
const LABELS={1:"Needs Improvement",2:"Fair",3:"Good",4:"Very Good",5:"Excellent"};
const EMAIL=/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
function validate(b){
  if(!b||typeof b!=="object"||Array.isArray(b))return{error:"Invalid request"};
  const name=clean(b.name,80);if(!name)return{error:"Name is required"};
  const email=String(b.email??"").trim();
  if(email.length>254||!EMAIL.test(email))return{error:"A valid email is required"};
  if(!CATEGORIES.includes(b.category))return{error:"Invalid category"};
  let rating=null;
  if(b.rating!==undefined&&b.rating!==null&&b.rating!==""){
    if(!Number.isInteger(b.rating)||b.rating<1||b.rating>5)return{error:"Rating must be 1 to 5"};
    rating=b.rating;
  }
  const message=String(b.message??"").replace(/\r\n/g,"\n").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,"").trim();
  if(message.length<10)return{error:"Message is too short"};
  if(message.length>2000)return{error:"Message is too long"};
  if(typeof b.followUp!=="boolean")return{error:"Invalid follow-up value"};
  return{value:{name,email,category:b.category,rating,message,followUp:b.followUp}};
}
function build(d,time,site){
  const rate=d.rating?`${d.rating} / 5 (${LABELS[d.rating]})`:"Not provided",fu=d.followUp?"Yes":"No";
  const text=`New Portfolio Feedback\n\nName: ${d.name}\nEmail: ${d.email}\nCategory: ${d.category}\nRating: ${rate}\n\nMessage:\n${d.message}\n\nFollow-up Permission: ${fu}\nSubmitted At: ${time}\nWebsite: ${site}`;
  const row=(k,v)=>`<tr><td style="padding:6px 14px 6px 0;color:#6b7390;vertical-align:top">${k}</td><td style="padding:6px 0;color:#12152a">${esc(v)}</td></tr>`;
  const html=`<div style="font:15px/1.6 system-ui,sans-serif;max-width:560px;margin:auto;border:1px solid #e3e6f5;border-radius:14px;overflow:hidden"><div style="background:linear-gradient(135deg,#7c5cff,#4aa8ff);color:#fff;padding:18px 22px;font-size:18px;font-weight:600">New Portfolio Feedback</div><div style="padding:20px 22px"><table style="border-collapse:collapse">${row("Name",d.name)}${row("Email",d.email)}${row("Category",d.category)}${row("Rating",rate)}${row("Follow-up",fu)}${row("Submitted",time)}</table><p style="margin:16px 0 6px;color:#6b7390">Message</p><div style="white-space:pre-wrap;background:#f4f5fb;border-radius:10px;padding:14px;color:#12152a">${esc(d.message)}</div><p style="margin:16px 0 0;color:#6b7390;font-size:13px">Website: ${esc(site)}</p></div></div>`;
  return{text,html};
}
const limited=limiter(3,6e5),seen=new Map(); // in-memory per instance; use Vercel KV/Upstash for strict limits
async function handler(req,res){
  if(req.method!=="POST")return res.status(405).json({ok:false});
  if(!originAllowed(req))return res.status(403).json({ok:false});
  if(+(req.headers["content-length"]||0)>10240)return res.status(413).json({ok:false});
  const ip=String(req.headers["x-forwarded-for"]||"").split(",")[0].trim()||"unknown";
  if(limited(ip))return res.status(429).json({ok:false,error:"Too many submissions"});
  const body=typeof req.body==="string"?(()=>{try{return JSON.parse(req.body)}catch{return null}})():req.body;
  if(body&&body.website)return res.status(200).json({ok:true}); // honeypot (bots)
  const v=validate(body);if(v.error)return res.status(400).json({ok:false,error:v.error});
  const key=typeof body.key==="string"?body.key.slice(0,64):"";
  if(key&&seen.has(key))return res.status(200).json({ok:true,duplicate:true});
  const {RESEND_API_KEY,RESEND_FROM,NOTIFY_TO}=process.env;
  if(!RESEND_API_KEY||!RESEND_FROM||!NOTIFY_TO)return res.status(503).json({ok:false,error:"Email not configured"});
  const d=v.value,{text,html}=build(d,new Date().toISOString(),process.env.SITE_URL||"https://protfolio-sunil-kulali.vercel.app/");
  try{
    const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"},
      body:JSON.stringify({from:RESEND_FROM,to:[NOTIFY_TO],reply_to:d.email,subject:`[Portfolio Feedback] ${d.category} — ${d.name}`.slice(0,150),text,html})});
    if(!r.ok)return res.status(502).json({ok:false,error:"Email provider rejected the request"});
    if(key){seen.set(key,1);if(seen.size>500)seen.delete(seen.keys().next().value)}
    return res.status(200).json({ok:true});
  }catch{return res.status(502).json({ok:false,error:"Email delivery failed"})}
}
module.exports=handler;module.exports.validate=validate;module.exports.build=build;
