// Shared helpers (files starting with "_" are not deployed as routes by Vercel)
const clean=(s,max)=>String(s??"").replace(/[\r\n\u2028\u2029\t]+/g," ").replace(/[<>]/g,"").trim().slice(0,max);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function limiter(max,windowMs){const hits=new Map();return ip=>{const now=Date.now(),a=(hits.get(ip)||[]).filter(t=>now-t<windowMs);a.push(now);hits.set(ip,a);return a.length>max}}
function originAllowed(req){
  const o=req.headers.origin;if(!o)return true;
  let host;try{host=new URL(o).host}catch{return false}
  const extra=(process.env.ALLOWED_ORIGINS||"").split(",").map(s=>s.trim()).filter(Boolean);
  return host===req.headers.host||extra.includes(o);
}
module.exports={clean,esc,limiter,originAllowed};
