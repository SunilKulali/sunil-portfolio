/* Feedback modal: validation, accessible star rating, submit to /api/feedback */
(function(){
const ENDPOINT="/api/feedback",TXT=["","Needs Improvement","Fair","Good","Very Good","Excellent"];
const $=s=>document.querySelector(s),dlg=$("#fb");if(!dlg)return;
const f=$("#ff"),stars=[...document.querySelectorAll("#fstars button")];
let rating=0,busy=false,key=null,opener=null;
const newKey=()=>(crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(36).slice(2));
function open(e){opener=e&&e.currentTarget||$("#fbBtn");$("#fok").hidden=true;f.hidden=false;dlg.showModal();document.body.style.overflow="hidden";$("#fn").focus()}
function close(){dlg.close()}
dlg.addEventListener("close",()=>{document.body.style.overflow="";if(opener)opener.focus()});
dlg.addEventListener("click",e=>{if(e.target===dlg)close()});
$("#fbBtn").onclick=open;$("#fbx").onclick=close;$("#fclose").onclick=close;
$("#fbLink").onclick=e=>{e.preventDefault();open(e)};
/* rating: radio group with roving tabindex, arrow keys, click again to clear */
function paint(n,preview){stars.forEach(b=>b.classList.toggle("on",+b.dataset.v<=n));if(!preview){stars.forEach(b=>{b.setAttribute("aria-checked",String(+b.dataset.v===rating));b.tabIndex=(rating?+b.dataset.v===rating:b.dataset.v==="1")?0:-1});$("#frt").textContent=rating?TXT[rating]:""}else $("#frt").textContent=TXT[n]}
stars.forEach(b=>{const v=+b.dataset.v;
 b.onclick=()=>{key=null;rating=rating===v?0:v;paint(rating)};
 b.onmouseenter=()=>paint(v,true);b.onmouseleave=()=>paint(rating);
 b.onkeydown=e=>{const d={ArrowRight:1,ArrowUp:1,ArrowLeft:-1,ArrowDown:-1}[e.key];if(!d)return;e.preventDefault();key=null;rating=Math.min(5,Math.max(1,(rating||v)+d));paint(rating);stars[rating-1].focus()}});
const msg=$("#fm"),cnt=$("#fcnt");msg.oninput=()=>{cnt.textContent=msg.value.length+" / 2000"};
const EMAIL=/^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;
const setErr=(id,field,m)=>{$("#e-"+id).textContent=m||"";if(field){m?field.setAttribute("aria-invalid","true"):field.removeAttribute("aria-invalid")}};
function validate(){const errs=[];
 const n=$("#fn").value.trim(),em=$("#fe").value.trim(),m=msg.value.trim(),cat=f.querySelector('input[name=fbcat]:checked');
 setErr("fn",$("#fn"),n?(n.length>80?"Please keep your name under 80 characters.":""):"Please enter your name.");if($("#e-fn").textContent)errs.push($("#fn"));
 setErr("fe",$("#fe"),!em?"Please enter your email address.":(em.length>254||!EMAIL.test(em)?"That email address doesn’t look right.":""));if($("#e-fe").textContent)errs.push($("#fe"));
 setErr("fc",null,cat?"":"Please choose a category.");if(!cat)errs.push(f.querySelector('input[name=fbcat]'));
 setErr("fm",msg,!m?"Please enter your feedback.":(m.length>2000?"Please keep it under 2,000 characters.":""));if($("#e-fm").textContent)errs.push(msg);
 return{errs,data:{name:n,email:em,category:cat&&cat.value,rating:rating||null,message:m,followUp:$("#fu").checked}}}
f.addEventListener("input",()=>{if(key)key=null});f.addEventListener("change",()=>{if(key)key=null});
f.addEventListener("submit",async e=>{e.preventDefault();if(busy)return;
 const b=$("#fbanner");b.hidden=true;const v=validate();if(v.errs.length){v.errs[0].focus();return}
 busy=true;key=key||newKey();const btn=$("#fsend");btn.disabled=true;btn.setAttribute("aria-busy","true");btn.classList.add("busy");$("#fsl").textContent="Sending\u2026";
 let ok=false,status=0,code="";const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),12000);
 try{const r=await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...v.data,key,website:$("#fw").value}),signal:ac.signal});
  status=r.status;const result=await r.json();ok=r.ok&&result.ok===true;code=typeof result.code==="string"?result.code:""
 }catch(x){}finally{clearTimeout(timer);busy=false;btn.disabled=false;btn.removeAttribute("aria-busy");btn.classList.remove("busy");$("#fsl").textContent="Send Feedback \u2192"}
 if(ok){f.reset();rating=0;paint(0);cnt.textContent="0 / 2000";key=null;f.hidden=true;$("#fok").hidden=false;$("#fokt").focus()}
 else{const messages={email_not_configured:"Feedback delivery is not configured yet. Please try again later.",email_configuration:"Feedback sender or recipient configuration needs attention. Please try again later.",email_authentication:"Feedback delivery needs an account configuration update. Please try again later.",email_sender_configuration:"Feedback delivery needs a sender configuration update. Please try again later.",email_provider_rate_limited:"The email service is busy. Please try again shortly.",email_timeout:"Feedback delivery timed out. You can safely retry this submission.",email_unavailable:"The email service is temporarily unavailable. You can safely retry this submission.",email_provider_error:"Feedback delivery failed. You can safely retry this submission.",idempotency_conflict:"This submission changed while retrying. Please submit it again."};
  b.textContent=messages[code]||(status===429?"Too many submissions. Please try again in a little while.":"We could not submit your feedback right now. Please try again.");b.hidden=false}
});
})();
