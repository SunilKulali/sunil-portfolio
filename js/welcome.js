(function(){
const W={endpoint:"/api/visitor",geocode:""};/* geocode: optional URL returning {city} for ?lat=&lon= */
const $=s=>document.querySelector(s),ov=$("#wl"),rm=matchMedia("(prefers-reduced-motion:reduce)").matches;
const pg=[$("#nav"),$("main"),$("footer"),$("#bar")];
try{if(sessionStorage.getItem("wl")){ov.remove();$("#toast").remove();return}}catch(e){}
pg.forEach(e=>e&&e.setAttribute("inert",""));document.body.style.overflow="hidden";$("#wn").focus();
const err=m=>{$("#we").textContent=m||""};
function toast(m){const t=$("#toast");t.textContent=m;t.hidden=false;setTimeout(()=>t.hidden=true,6000)}
function enter(msg){
 ov.classList.add("busy");
 setTimeout(()=>{ov.classList.add("out");pg.forEach(e=>e&&e.removeAttribute("inert"));document.body.style.overflow="";
  try{sessionStorage.setItem("wl","1")}catch(e){}
  if(msg)toast(msg);setTimeout(()=>ov.remove(),rm?0:650);window.scrollTo(0,0)},rm?0:1300)}
$("#sk2").onclick=()=>enter();
ov.addEventListener("keydown",e=>{if(e.key==="Escape")enter()});
/* location: explain first, ask the browser only after confirmation */
$("#wg").onclick=()=>{const b=$("#lx");b.hidden=false;
 b.innerHTML='<p style="margin:0;color:inherit">Your browser will ask for permission. I only use your position to look up an approximate city, which you confirm before anything is sent. Coordinates are never saved or emailed.</p><div class="wrow"><button type="button" class="btn pri" id="lgo" style="color:#fff">Continue</button><button type="button" class="btn" id="lno" style="color:#f5f7ff">Cancel</button></div>';
 $("#lno").onclick=()=>{b.hidden=true};$("#lgo").onclick=locate;$("#lgo").focus()};
function locate(){const b=$("#lx");
 if(!navigator.geolocation){b.textContent="Location isn’t available in this browser. Please type your city.";return}
 b.textContent="Waiting for your browser…";
 navigator.geolocation.getCurrentPosition(async p=>{
  if(!W.geocode){b.textContent="I couldn’t look up a city automatically. Please type it instead.";return}
  try{const r=await fetch(W.geocode+"?lat="+p.coords.latitude.toFixed(2)+"&lon="+p.coords.longitude.toFixed(2));const d=await r.json();
   if(!r.ok||!d.city)throw 0;
   b.innerHTML="";const q=document.createElement("p");q.style.margin="0";q.textContent="Is your approximate location "+d.city+"?";
   const row=document.createElement("div");row.className="wrow";
   row.innerHTML='<button type="button" class="btn pri" style="color:#fff">Yes, use it</button><button type="button" class="btn" style="color:#f5f7ff">No</button>';
   b.append(q,row);row.children[0].onclick=()=>{$("#wc").value=d.city.slice(0,80);b.hidden=true};row.children[1].onclick=()=>{b.hidden=true}
  }catch(e){b.textContent="I couldn’t look up a city automatically. Please type it instead."}
 },()=>{b.textContent="No problem. You can type your city instead, or skip it."},{timeout:8000,maximumAge:600000});
}
$("#wf").addEventListener("submit",async e=>{e.preventDefault();err();
 const n=$("#wn").value.trim(),c=$("#wc").value.trim(),t=$("#wt").value,p=$("#wp").value;
 ["wn","wc","wk"].forEach(i=>$("#"+i).removeAttribute("aria-invalid"));
 if(!n&&!c&&!t&&!p){err("Nothing to send. Add a detail, or choose “Explore without sharing details”.");return}
 if(!n){$("#wn").setAttribute("aria-invalid","true");err("Please enter your name to send your details.");$("#wn").focus();return}
 if(n.length>80||c.length>80){err("Please keep name and city under 80 characters.");return}
 if(!$("#wk").checked){$("#wk").setAttribute("aria-invalid","true");err("Please tick the box to agree to send your details, or skip.");$("#wk").focus();return}
 const btn=$("#ws");btn.disabled=true;btn.textContent="Sending…";
 let ok=false;try{const ac=new AbortController(),tm=setTimeout(()=>ac.abort(),10000);
  const r=await fetch(W.endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:n,city:c,type:t,purpose:p,consent:true,website:$("#wh2").value}),signal:ac.signal});
  clearTimeout(tm);ok=r.ok&&(await r.json()).ok===true}catch(x){}
 enter(ok?"Welcome, "+n+". Thanks for introducing yourself.":"Your details couldn’t be delivered, but you’re welcome to keep browsing.")});
})();
