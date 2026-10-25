/* Sunil AI Assistant: UI for POST /api/chat. Answers come from the server model; nothing is stored. */
(function(){
const $=s=>document.querySelector(s),btn=$("#cbBtn"),panel=$("#cb");if(!btn||!panel)return;
const log=$("#cbm"),inp=$("#cbi"),send=$("#cbSend"),form=$("#cbf"),mic=$("#cbMic");
const FIRST=["Tell me about Sunil","Show me his AI/ML projects","What technologies does he know?","Explain the InsightOS project"];
const MORE=["Tell me about his DataIntel AI platform","What is his internship experience?","Show his GitHub repositories","How can I contact him?","Why should we hire him?","Download or view his resume"];
const RECRUITER=["What roles is Sunil targeting?","What are his strongest technical skills?","Which projects demonstrate his AI/ML capabilities?","What data engineering skills does he have?","Where can I view his resume?","How can I contact him about an opportunity?"];
const cid=(crypto.randomUUID?crypto.randomUUID():String(Date.now())).slice(0,36);
let msgs=[],busy=false,welcomed=false,speaking=null;
const esc=s=>s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
/* safe markdown: escape first, then allow only a few constructs; links limited to http(s) and #anchors */
function inline(t){t=esc(t).replace(/`([^`]+)`/g,"<code>$1</code>").replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>");
 return t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|#[\w-]+)\)/g,(m,a,u)=>`<a href="${u}"${u[0]==="#"?"":' target="_blank" rel="noopener noreferrer"'}>${a}</a>`)}
function md(src){const out=[];let list=null,para=[];
 const flush=()=>{if(para.length){out.push("<p>"+para.map(inline).join("<br>")+"</p>");para=[]}};
 const endList=()=>{if(list){out.push(`</${list}>`);list=null}};
 src.split(/```/).forEach((seg,i)=>{
  if(i%2){endList();flush();out.push("<pre><code>"+esc(seg.replace(/^[\w-]*\n/,"").trim())+"</code></pre>");return}
  seg.split("\n").forEach(line=>{const li=line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
   if(li){flush();const t=/^\s*\d/.test(line)?"ol":"ul";if(list!==t){endList();out.push(`<${t}>`);list=t}out.push("<li>"+inline(li[1])+"</li>")}
   else if(!line.trim()){endList();flush()}else{endList();para.push(line)}});
  endList();flush()});
 return out.join("")}
const plain=s=>s.replace(/[*`#]/g,"").replace(/\[([^\]]+)\]\([^)]+\)/g,"$1");
const bottom=()=>{log.scrollTop=log.scrollHeight};
function bubble(cls,html){const d=document.createElement("div");d.className="cbb "+cls;d.innerHTML=html;log.appendChild(d);bottom();return d}
function chips(list,more){const w=document.createElement("div");w.className="cbq";
 list.forEach(q=>{const b=document.createElement("button");b.type="button";b.textContent=q;b.onclick=()=>{w.remove();ask(q)};w.appendChild(b)});
 if(more){const m=document.createElement("button");m.type="button";m.className="cbmore";m.textContent="Explore more…";m.onclick=()=>{w.remove();chips([...FIRST,...MORE],false)};w.appendChild(m);
  const r=document.createElement("button");r.type="button";r.className="cbmore";r.textContent="Recruiter mode";r.onclick=()=>{w.remove();bubble("a","<p><strong>Recruiter mode</strong>: quick questions for hiring teams.</p>");chips(RECRUITER,false)};w.appendChild(r)}
 log.appendChild(w);bottom()}
function welcome(){welcomed=true;bubble("a","<p>Hey there! 👋 Welcome to my portfolio.</p><p>I’m Sunil’s AI assistant. Ask me about his projects, technical skills, certifications, or experience. I can also help recruiters explore his portfolio.</p>");chips(FIRST,true);log.scrollTop=0}
function open(){panel.hidden=false;panel.classList.remove("min");btn.setAttribute("aria-expanded","true");document.body.classList.add("cb-open");if(!welcomed)welcome();inp.focus()}
function close(){panel.hidden=true;btn.setAttribute("aria-expanded","false");document.body.classList.remove("cb-open");window.speechSynthesis&&speechSynthesis.cancel();btn.focus()}
btn.onclick=()=>panel.hidden?open():close();$("#cbClose").onclick=close;
$("#cbMin").onclick=()=>{const m=panel.classList.toggle("min");$("#cbMin").setAttribute("aria-label",m?"Expand chat":"Minimize chat");if(!m)inp.focus()};
$("#cbNew").onclick=()=>{if(msgs.length&&!confirm("Clear this conversation and start a new one?"))return;msgs=[];log.innerHTML="";welcome();inp.focus()};
panel.addEventListener("keydown",e=>{if(e.key==="Escape")close()});
log.addEventListener("click",e=>{const a=e.target.closest('a[href^="#"]');if(a&&matchMedia("(max-width:640px)").matches)close()});
function sync(){send.disabled=busy||!inp.value.trim();inp.style.height="auto";inp.style.height=Math.min(inp.scrollHeight,110)+"px"}
inp.oninput=sync;inp.onkeydown=e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();form.requestSubmit()}};
form.onsubmit=e=>{e.preventDefault();const t=inp.value.trim();if(!t||busy)return;inp.value="";sync();ask(t)};
if(window.visualViewport){const f=()=>panel.style.setProperty("--vvh",visualViewport.height+"px");visualViewport.addEventListener("resize",f);f()}
async function ask(text,retry){
 if(busy)return;busy=true;sync();
 if(!retry)bubble("u",esc(text));
 const typ=bubble("a cbtyp",'<i></i><i></i><i></i>');typ.setAttribute("role","status");typ.setAttribute("aria-label","Assistant is typing");
  let status=0,data=null,code="";
  const ac=new AbortController(),t=setTimeout(()=>ac.abort(),25000);
  try{
   const r=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},signal:ac.signal,body:JSON.stringify({message:text,conversationId:cid,history:msgs.slice(-8)})});
   status=r.status;data=await r.json();code=data&&typeof data.code==="string"?data.code:""
  }catch(x){}finally{clearTimeout(t)}
 typ.remove();busy=false;
 if(data&&data.ok&&data.reply){msgs.push({role:"user",content:text},{role:"assistant",content:data.reply});reply(data)}
 else{const m=code==="missing_api_key"?"The assistant is not configured yet. Please try again later.":code==="provider_authentication"?"The AI service needs a configuration update. Please try again later.":code==="provider_billing"?"The AI service needs billing attention. Please try again later.":code==="provider_model"?"The AI model configuration needs attention. Please try again later.":code==="provider_overloaded"?"The AI service is busy. Please try again shortly.":code==="provider_timeout"?"The AI service took too long to respond. Please try again.":status===429?"Too many questions right now. Please wait a minute and try again.":status===503?"The assistant is unavailable right now. Please try again later.":"I could not get a response right now.";
  const d=bubble("a err",esc(m)+' You can also reach Sunil through the <a href="#contact">contact section</a>.<br><button type="button">Retry</button>');
  d.querySelector("button").onclick=()=>{d.remove();ask(text,true)}}
 sync()}
function reply(d){const b=bubble("a",md(d.reply));
 if(d.sources&&d.sources.length){const s=document.createElement("div");s.className="cbsrc";
  d.sources.slice(0,3).forEach(x=>{if(!/^(https?:\/\/|#)/.test(x.url))return;const a=document.createElement("a");a.href=x.url;a.textContent=x.title;if(x.url[0]!=="#"){a.target="_blank";a.rel="noopener noreferrer"}s.appendChild(a)});b.appendChild(s)}
 const act=document.createElement("div");act.className="cbact";
 const cp=document.createElement("button");cp.type="button";cp.textContent="Copy";cp.onclick=async()=>{try{await navigator.clipboard.writeText(plain(d.reply));cp.textContent="Copied"}catch(e){cp.textContent="Press Ctrl+C"}setTimeout(()=>cp.textContent="Copy",1500)};act.appendChild(cp);
 if("speechSynthesis"in window){const sp=document.createElement("button");sp.type="button";sp.textContent="Listen";sp.onclick=()=>{if(speaking===sp){speechSynthesis.cancel();speaking=null;sp.textContent="Listen";return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(plain(d.reply));u.onend=()=>{sp.textContent="Listen";speaking=null};speaking=sp;sp.textContent="Stop";speechSynthesis.speak(u)};act.appendChild(sp)}
 b.appendChild(act);bottom()}
/* optional voice input: only starts when the user presses the mic */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
if(SR){mic.hidden=false;let rec=null;mic.onclick=()=>{if(rec){rec.stop();return}rec=new SR();rec.lang="en-US";rec.interimResults=false;mic.classList.add("rec");
 rec.onresult=e=>{inp.value=(inp.value+" "+e.results[0][0].transcript).trim().slice(0,500);sync()};rec.onend=rec.onerror=()=>{mic.classList.remove("rec");rec=null};rec.start()}}
})();
