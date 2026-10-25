const test=require("node:test"),assert=require("node:assert");
const handler=require("../api/chat.js"),{validate,normalize,sources,SYSTEM}=handler;
const mk=(body,h={})=>{const r={status:0,json:null};return[{method:"POST",headers:{"x-forwarded-for":String(Math.random()),host:"site.test",...h},body},{status(c){r.status=c;return this},json(j){r.json=j;return this}},r]};
const ok=t=>async()=>({ok:true,json:async()=>({content:[{type:"text",text:t}]})});
test("validate accepts a normal message",()=>assert.ok(validate({message:"Explain InsightOS",conversationId:"abc"}).value));
test("rejects empty / too long / bad history / bad id",()=>{
 assert.ok(validate({message:"  "}).error);assert.ok(validate({message:"a".repeat(501)}).error);
 assert.ok(validate({message:"hi",history:[{role:"system",content:"x"}]}).error);assert.ok(validate({message:"hi",history:new Array(9).fill({role:"user",content:"x"})}).error);
 assert.ok(validate({message:"hi",conversationId:"x".repeat(65)}).error)});
test("normalize alternates roles and starts with user",()=>{
 const m=normalize([{role:"assistant",content:"hello"},{role:"user",content:"a"},{role:"user",content:"b"}],"c");
 assert.deepEqual(m.map(x=>x.role),["user"]);assert.ok(m[0].content.includes("a")&&m[0].content.includes("c"))});
test("sources link the right repositories",()=>{
 assert.ok(sources("tell me about loan approval").some(s=>s.url.endsWith("loan-approval-app")));
 assert.ok(sources("insightos").some(s=>s.url.endsWith("plusedataai")));
 assert.ok(!sources("healthcare data lake").some(s=>s.url.startsWith("https://github.com")))});
test("system prompt contains the verified knowledge and rules",()=>{assert.ok(SYSTEM.includes("plusedataai")&&SYSTEM.includes("Never invent"))});
test("405 for GET, 403 for foreign origin, 413 oversized",async()=>{
 let[q,s,r]=mk({message:"hi"});q.method="GET";await handler(q,s);assert.equal(r.status,405);
 [q,s,r]=mk({message:"hi"},{origin:"https://evil.example"});await handler(q,s);assert.equal(r.status,403);
 [q,s,r]=mk({message:"hi"},{"content-length":"99999"});await handler(q,s);assert.equal(r.status,413)});
test("400 for invalid body",async()=>{process.env.ANTHROPIC_API_KEY="k";const[q,s,r]=mk({message:""});await handler(q,s);assert.equal(r.status,400)});
test("503 when API key missing",async()=>{delete process.env.ANTHROPIC_API_KEY;const[q,s,r]=mk({message:"hi"});await handler(q,s);assert.equal(r.status,503)});
test("returns the model reply with sources and never leaks the key",async()=>{
 process.env.ANTHROPIC_API_KEY="sk-secret-123";process.env.CHAT_MODEL="test-model";let sent;
 global.fetch=async(u,o)=>{sent={u,o,b:JSON.parse(o.body)};return ok("InsightOS is an AI BI platform. See [repo](https://github.com/SunilKulali/plusedataai)")()};
 const[q,s,r]=mk({message:"Explain InsightOS",history:[{role:"user",content:"hi"},{role:"assistant",content:"hello"}]});await handler(q,s);
 assert.equal(r.status,200);assert.ok(r.json.reply.includes("InsightOS"));assert.ok(r.json.sources.length>0);
 assert.equal(sent.u,"https://api.anthropic.com/v1/messages");assert.equal(sent.b.model,"test-model");assert.ok(sent.b.system.includes("KNOWLEDGE BASE"));
 assert.equal(sent.b.messages.at(-1).content,"Explain InsightOS");assert.ok(!JSON.stringify(r.json).includes("sk-secret-123"))});
test("provider failures map to actionable JSON statuses without leaking details",async()=>{
 process.env.ANTHROPIC_API_KEY="sk-never-log-this";
 for(const [providerStatus,expectedStatus,expectedCode] of [[401,503,"provider_authentication"],[402,503,"provider_billing"],[429,429,"provider_rate_limit"]]){
  global.fetch=async()=>({ok:false,status:providerStatus,json:async()=>({error:{type:"api_error",message:"sk-never-log-this"}})});
  const logs=[],old=console.error;console.error=(...args)=>logs.push(args);
  try{const[q,s,r]=mk({message:"hi"});await handler(q,s);assert.equal(r.status,expectedStatus);assert.equal(r.json.code,expectedCode);assert.ok(!JSON.stringify(logs).includes("sk-never-log-this"))}finally{console.error=old}
 }
});
test("maps Anthropic insufficient-credit errors to a billing configuration response",async()=>{
 process.env.ANTHROPIC_API_KEY="sk-never-log-this";
 global.fetch=async()=>({ok:false,status:400,json:async()=>({error:{type:"invalid_request_error",message:"Your credit balance is too low to access the API"}})});
 const logs=[],old=console.error;console.error=(...args)=>logs.push(args);
 try{const[q,s,r]=mk({message:"hi"});await handler(q,s);assert.equal(r.status,503);assert.equal(r.json.code,"provider_billing");assert.ok(!JSON.stringify(logs).includes("credit balance"));assert.ok(!JSON.stringify(logs).includes("sk-never-log-this"))}finally{console.error=old}
});
test("502 on provider error and on empty reply",async()=>{
 process.env.ANTHROPIC_API_KEY="k";global.fetch=async()=>({ok:false,status:500,json:async()=>({error:{type:"api_error"}})});let[q,s,r]=mk({message:"hi"});await handler(q,s);assert.equal(r.status,502);
 global.fetch=ok("   ");[q,s,r]=mk({message:"hi"});await handler(q,s);assert.equal(r.status,502)});
test("504 on timeout",async()=>{process.env.ANTHROPIC_API_KEY="k";global.fetch=async()=>{const e=new Error("x");e.name="AbortError";throw e};
 const[q,s,r]=mk({message:"hi"});await handler(q,s);assert.equal(r.status,504)});
test("rate limits repeated requests from one IP",async()=>{process.env.ANTHROPIC_API_KEY="k";global.fetch=ok("fine");let last;
 for(let i=0;i<12;i++){const[q,s,r]=mk({message:"hi"},{"x-forwarded-for":"7.7.7.7"});await handler(q,s);last=r.status}assert.equal(last,429)});
