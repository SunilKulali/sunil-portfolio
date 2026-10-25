// Vercel serverless function: POST /api/feedback  (email only, no database)
const {createHash}=require("node:crypto");
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
  if(!message)return{error:"Message is required"};
  if(message.length>2000)return{error:"Message is too long"};
  if(typeof b.followUp!=="boolean")return{error:"Invalid follow-up value"};
  return{value:{name,email,category:b.category,rating,message,followUp:b.followUp}};
}
function build(d,site){
  const rate=d.rating?`${d.rating} / 5 (${LABELS[d.rating]})`:"Not provided",fu=d.followUp?"Yes":"No";
  const text=`New Portfolio Feedback\n\nName: ${d.name}\nEmail: ${d.email}\nCategory: ${d.category}\nRating: ${rate}\n\nMessage:\n${d.message}\n\nFollow-up Permission: ${fu}\nWebsite: ${site}`;
  const row=(k,v)=>`<tr><td style="padding:6px 14px 6px 0;color:#6b7390;vertical-align:top">${k}</td><td style="padding:6px 0;color:#12152a">${esc(v)}</td></tr>`;
  const html=`<div style="font:15px/1.6 system-ui,sans-serif;max-width:560px;margin:auto;border:1px solid #e3e6f5;border-radius:14px;overflow:hidden"><div style="background:linear-gradient(135deg,#7c5cff,#4aa8ff);color:#fff;padding:18px 22px;font-size:18px;font-weight:600">New Portfolio Feedback</div><div style="padding:20px 22px"><table style="border-collapse:collapse">${row("Name",d.name)}${row("Email",d.email)}${row("Category",d.category)}${row("Rating",rate)}${row("Follow-up",fu)}</table><p style="margin:16px 0 6px;color:#6b7390">Message</p><div style="white-space:pre-wrap;background:#f4f5fb;border-radius:10px;padding:14px;color:#12152a">${esc(d.message)}</div><p style="margin:16px 0 0;color:#6b7390;font-size:13px">Website: ${esc(site)}</p></div></div>`;
  return{text,html};
}
const limited=limiter(3,6e5),seen=new Map(); // Resend idempotency provides cross-instance retry safety
const fail=(res,status,error,code)=>res.status(status).json({ok:false,error,code});
function logFailure(reason,details={}){
  // Do not log request bodies, feedback text, addresses, headers, credentials, or provider messages.
  console.error("[feedback] delivery failure",{reason,...details});
}
const safeCode=s=>typeof s==="string"&&/^[a-z0-9_-]{1,64}$/i.test(s)?s:"unknown";
async function handler(req,res){
  if(req.method!=="POST")return fail(res,405,"Method not allowed","method_not_allowed");
  if(!originAllowed(req))return fail(res,403,"Origin not allowed","origin_not_allowed");
  if(+(req.headers["content-length"]||0)>10240)return fail(res,413,"Request too large","request_too_large");
  let body;
  try{body=typeof req.body==="string"?JSON.parse(req.body):req.body}catch{return fail(res,400,"Invalid JSON request","invalid_json")}
  if(body&&body.website)return res.status(200).json({ok:true}); // honeypot (bots)
  const v=validate(body);if(v.error)return fail(res,400,v.error,"invalid_request");
  const key=typeof body.key==="string"?body.key.slice(0,64):"";
  const d=v.value,site=process.env.SITE_URL||"https://protfolio-sunil-kulali.vercel.app/";
  const {text,html}=build(d,site);
  const mail={from:process.env.RESEND_FROM?.trim(),to:[process.env.NOTIFY_TO?.trim()],reply_to:d.email,subject:`[Portfolio Feedback] ${d.category} — ${d.name}`.slice(0,150),text,html};
  const fingerprint=createHash("sha256").update(JSON.stringify(mail)).digest("hex");
  if(key&&seen.has(key)){
    if(seen.get(key)===fingerprint)return res.status(200).json({ok:true,duplicate:true});
    return fail(res,409,"This submission changed after its first attempt. Please submit it again.","idempotency_conflict");
  }
  const missing=["RESEND_API_KEY","RESEND_FROM","NOTIFY_TO"].filter(name=>!process.env[name]?.trim());
  if(missing.length){logFailure("missing_configuration",{missing});return fail(res,503,"Feedback delivery is not configured","email_not_configured")}
  const from=process.env.RESEND_FROM.trim(),to=process.env.NOTIFY_TO.trim();
  const fromMatch=from.match(/^(?:[^<>]*<([^<>]+)>|([^<>]+))$/),fromAddress=fromMatch?.[1]||fromMatch?.[2];
  const invalid=[];if(!fromAddress||!EMAIL.test(fromAddress))invalid.push("RESEND_FROM");if(!EMAIL.test(to))invalid.push("NOTIFY_TO");
  if(invalid.length){logFailure("invalid_configuration",{invalid});return fail(res,503,"Feedback sender or recipient configuration needs attention","email_configuration")}
  const ip=String(req.headers["x-forwarded-for"]||"").split(",")[0].trim()||"unknown";
  if(limited(ip))return fail(res,429,"Too many submissions","rate_limited");
  const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),8000);
  try{
    const r=await fetch("https://api.resend.com/emails",{method:"POST",signal:ac.signal,headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY.trim()}`,"Content-Type":"application/json",...(key?{"Idempotency-Key":key}:{})},body:JSON.stringify(mail)});
    if(!r.ok){
      let providerCode="unknown";
      try{const e=await r.json();providerCode=safeCode(e?.name||e?.error?.name||e?.error?.code)}catch{}
      logFailure("provider_rejected",{status:r.status,providerCode});
      if(r.status===401)return fail(res,503,"Feedback delivery credentials need attention","email_authentication");
      if(r.status===403||r.status===422)return fail(res,503,"Feedback sender configuration needs attention","email_sender_configuration");
      if(r.status===429)return fail(res,503,"Feedback delivery is temporarily busy","email_provider_rate_limited");
      if(r.status===409)return fail(res,409,"This feedback submission could not be safely retried. Please start a new submission.","idempotency_conflict");
      return fail(res,502,"Feedback delivery failed","email_provider_error");
    }
    if(key){seen.set(key,fingerprint);if(seen.size>500)seen.delete(seen.keys().next().value)}
    return res.status(200).json({ok:true});
  }catch(e){
    const timeout=e&&e.name==="AbortError";
    logFailure(timeout?"provider_timeout":"provider_network_error");
    return timeout?fail(res,504,"Feedback delivery timed out","email_timeout"):fail(res,502,"Feedback delivery is unavailable","email_unavailable");
  }finally{clearTimeout(timer)}
}
module.exports=handler;module.exports.validate=validate;module.exports.build=build;
