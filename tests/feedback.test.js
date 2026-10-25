const test=require("node:test"),assert=require("node:assert");
const handler=require("../api/feedback.js"),{validate}=handler;
const fs=require("node:fs");
const ok={name:"Asha",email:"asha@example.com",category:"AI Projects",rating:5,message:"Great projects, loved InsightOS!",followUp:true};
const mk=(body,h={})=>{const r={status:0,json:null};return[{method:"POST",headers:{"x-forwarded-for":String(Math.random()),host:"site.test",...h},body},{status(c){r.status=c;return this},json(j){r.json=j;return this}},r]};
const env=()=>Object.assign(process.env,{RESEND_API_KEY:"k",RESEND_FROM:"Portfolio <sender@example.com>",NOTIFY_TO:"x@y.com"});
test("accepts a valid submission",()=>assert.ok(validate(ok).value));
test("accepts short feedback without a minimum length",()=>{for(const message of["Good","Nice","Fix colors"])assert.equal(validate({...ok,message}).value.message,message)});
test("accepts non-gmail and no rating",()=>assert.ok(validate({...ok,rating:undefined,email:"a@corp.co.in"}).value));
test("rejects empty name",()=>assert.ok(validate({...ok,name:"  "}).error));
for(const e of["nope","a@b","a b@c.com","a@c.com\r\nBcc: x@y.z","x".repeat(260)+"@a.com"])test("rejects email "+JSON.stringify(e).slice(0,20),()=>assert.ok(validate({...ok,email:e}).error));
test("rejects bad category",()=>assert.ok(validate({...ok,category:"Spam"}).error));
for(const r of[0,6,2.5,"3"])test("rejects rating "+r,()=>assert.ok(validate({...ok,rating:r}).error));
test("requires non-empty feedback and accepts the 2,000-character maximum",()=>{
 for(const message of["","   "])assert.equal(validate({...ok,message}).error,"Message is required");
 assert.equal(validate({...ok,message:"a".repeat(2000)}).value.message.length,2000);
 assert.equal(validate({...ok,message:"a".repeat(2001)}).error,"Message is too long");
});
test("feedback markup allows short required text and caps it at 2,000 characters",()=>{
 const html=fs.readFileSync(require.resolve("../index.html"),"utf8"),textarea=html.match(/<textarea[^>]*id="fm"[^>]*>/)?.[0]||"";
 assert.match(textarea,/required/);assert.match(textarea,/maxlength="2000"/);assert.doesNotMatch(textarea,/minlength=/);
 const client=fs.readFileSync(require.resolve("../js/feedback.js"),"utf8");assert.doesNotMatch(client,/length\s*<\s*10|at least 10 characters/);
});
test("rejects non-boolean followUp",()=>assert.ok(validate({...ok,followUp:"yes"}).error));
test("strips newlines from name (header injection)",()=>assert.equal(validate({...ok,name:"A\r\nBcc: x"}).value.name,"A Bcc: x"));
test("405 for GET",async()=>{const[q,s,r]=mk(ok);q.method="GET";await handler(q,s);assert.equal(r.status,405)});
test("403 for foreign origin",async()=>{const[q,s,r]=mk(ok,{origin:"https://evil.example"});await handler(q,s);assert.equal(r.status,403)});
test("413 for oversized request",async()=>{const[q,s,r]=mk(ok,{"content-length":"99999"});await handler(q,s);assert.equal(r.status,413)});
test("400 for invalid body",async()=>{env();const[q,s,r]=mk({...ok,email:"bad"});await handler(q,s);assert.equal(r.status,400)});
test("503 when any required email setting is missing",async()=>{const saved={};for(const key of["RESEND_API_KEY","RESEND_FROM","NOTIFY_TO"])saved[key]=process.env[key];
 try{for(const missing of["RESEND_API_KEY","RESEND_FROM","NOTIFY_TO"]){env();delete process.env[missing];const logs=[],old=console.error;console.error=(...args)=>logs.push(args);
  try{const[q,s,r]=mk(ok);await handler(q,s);assert.equal(r.status,503);assert.equal(r.json.code,"email_not_configured");assert.ok(!JSON.stringify(logs).includes("asha@example.com"))}finally{console.error=old}}
 }finally{for(const key of Object.keys(saved)){if(saved[key]===undefined)delete process.env[key];else process.env[key]=saved[key]}}
});
test("rejects malformed sender and recipient configuration without calling Resend",async()=>{env();for(const [key,value] of[["RESEND_FROM","Portfolio <not-an-email>"],["NOTIFY_TO","not-an-email"]]){
 const original=process.env[key];process.env[key]=value;let called=false;global.fetch=async()=>{called=true;return{ok:true}};const logs=[],old=console.error;console.error=(...args)=>logs.push(args);
 try{const[q,s,r]=mk(ok);await handler(q,s);assert.equal(r.status,503);assert.equal(r.json.code,"email_configuration");assert.equal(called,false);assert.ok(!JSON.stringify(logs).includes("not-an-email"))}finally{console.error=old;process.env[key]=original}}
});
test("sends escaped short email with reply_to, idempotency key, and provider acceptance",async()=>{env();let sent,headers,url;global.fetch=async(u,o)=>{url=u;headers=o.headers;sent=JSON.parse(o.body);return{ok:true}};
 const[q,s,r]=mk({...ok,key:"test-feedback-key-001",message:"Nice"});await handler(q,s);
 assert.equal(r.status,200);assert.equal(url,"https://api.resend.com/emails");assert.equal(headers["Idempotency-Key"],"test-feedback-key-001");assert.equal(sent.to[0],"x@y.com");assert.equal(sent.reply_to,"asha@example.com");
 assert.match(sent.subject,/^\[Portfolio Feedback\] AI Projects — Asha$/);assert.ok(!sent.html.includes("<script>"));assert.ok(sent.text.includes("Rating: 5 / 5 (Excellent)"))});
test("502 on provider failure and safe retry with an identical idempotent request",async()=>{env();const body={...ok,key:"k1"};let attempts=0,firstRequest;
 global.fetch=async(u,o)=>{attempts++;const current={url:u,headers:o.headers,body:o.body};if(firstRequest)assert.deepEqual(current,firstRequest);else firstRequest=current;return attempts===1?{ok:false,status:500,json:async()=>({name:"internal_error",message:"private recipient details"})}:{ok:true}};
 const logs=[],old=console.error;console.error=(...args)=>logs.push(args);
 try{let[q,s,r]=mk(body);await handler(q,s);assert.equal(r.status,502);assert.equal(r.json.code,"email_provider_error");
  [q,s,r]=mk(body);await handler(q,s);assert.equal(r.status,200);assert.equal(attempts,2);assert.ok(!JSON.stringify(logs).includes("private recipient details"));assert.ok(!JSON.stringify(logs).includes("asha@example.com"))}finally{console.error=old}});
test("maps provider auth, sender, and rate errors to safe actionable codes",async()=>{env();for(const [status,code] of[[401,"email_authentication"],[403,"email_sender_configuration"],[422,"email_sender_configuration"],[429,"email_provider_rate_limited"]]){
 global.fetch=async()=>({ok:false,status,json:async()=>({name:"provider_error",message:"must not be returned to the visitor"})});const logs=[],old=console.error;console.error=(...args)=>logs.push(args);
 try{const[q,s,r]=mk(ok);await handler(q,s);assert.equal(r.status,503);assert.equal(r.json.code,code);assert.ok(!JSON.stringify(r.json).includes("must not"));assert.ok(!JSON.stringify(logs).includes("asha@example.com"))}finally{console.error=old}}
});
test("duplicate key is not emailed twice",async()=>{env();let n=0;global.fetch=async()=>{n++;return{ok:true}};
 for(let i=0;i<2;i++){const[q,s]=mk({...ok,key:"dup"});await handler(q,s)}assert.equal(n,1)});
test("rate limits repeated submissions from one IP",async()=>{env();global.fetch=async()=>({ok:true});let last;
 for(let i=0;i<5;i++){const[q,s,r]=mk({...ok,key:"r"+i},{"x-forwarded-for":"9.9.9.9"});await handler(q,s);last=r.status}assert.equal(last,429)});
