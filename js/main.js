PR.forEach((p,i)=>{$("#pg").insertAdjacentHTML("beforeend",`<button class="card proj" data-i="${i}"><span class="art">${art(p,i)}</span><span class="b" style="display:block"><h3>${esc(p.id)}</h3><span style="color:var(--c);font-size:.8rem">${p.cat}</span><p>${p.sum}</p><span class="pills">${p.tech.slice(0,5).map(t=>`<span>${esc(t)}</span>`).join("")}</span></span></button>`)});
const dlg=$("#dlg");
$("#pg").addEventListener("click",e=>{const b=e.target.closest(".proj");if(!b)return;const i=+b.dataset.i,p=PR[i];
$("#dart").innerHTML=art(p,i);
$("#dbody").innerHTML=`<h3 id="dt" style="font-size:1.6rem">${esc(p.id)}</h3><span style="color:var(--c)">${p.cat}</span>
<h4>Problem</h4><p>${p.prob}</p><h4>Solution</h4><p>${p.sol}</p>
<h4>How it works</h4><div class="steps" role="tablist">${p.flow.map((f,k)=>`<button data-k="${k}" class="${k?"":"on"}">${esc(f)}</button>`).join("")}</div>
<h4>Implementation</h4><ul>${p.impl.map(x=>`<li>${x}</li>`).join("")}</ul>
<h4>Stack</h4><div class="pills">${p.tech.map(t=>`<span>${esc(t)}</span>`).join("")}</div>
${p.repo?`<p><a class="btn" href="${p.repo}" target="_blank" rel="noopener noreferrer">Source code</a></p>`:""}`;
let k=0;clearInterval(window.tm);window.tm=setInterval(()=>{const s=document.querySelectorAll(".steps button");if(!s.length||!dlg.open)return clearInterval(window.tm);s.forEach(x=>x.classList.remove("on"));k=(k+1)%s.length;s[k].classList.add("on")},1600);
dlg.showModal()});
$("#dbody").addEventListener("click",e=>{const b=e.target.closest(".steps button");if(b){clearInterval(window.tm);document.querySelectorAll(".steps button").forEach(x=>x.classList.toggle("on",x===b))}});
$("#close").onclick=()=>dlg.close();dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
// skills
const cats=["All",...new Set(SK.map(s=>s[0]))];let cat="All";
$("#cats").innerHTML=cats.map(c=>`<button class="chip" aria-pressed="${c==="All"}">${esc(c)}</button>`).join("");
function draw(){const q=$("#q").value.toLowerCase();$("#sk").innerHTML=SK.filter(s=>(cat==="All"||s[0]===cat)&&s[1].toLowerCase().includes(q)).map(s=>`<button class="sk" aria-expanded="false" data-n="${esc(s[1])}">${esc(s[1])}</button>`).join("")||"<p>No matching skills.</p>"}
$("#cats").onclick=e=>{const b=e.target.closest(".chip");if(!b)return;cat=b.textContent;document.querySelectorAll(".chip").forEach(c=>c.setAttribute("aria-pressed",c===b));draw()};
$("#q").oninput=draw;
$("#sk").onclick=e=>{const b=e.target.closest(".sk");if(!b)return;const s=SK.find(x=>x[1]===b.dataset.n);document.querySelectorAll(".sk").forEach(x=>x.setAttribute("aria-expanded",x===b));
$("#skd").innerHTML=`<strong style="color:var(--t)">${esc(s[1])}</strong>: ${s[2]}${s[3].length?` <br>Used in: ${s[3].map(esc).join(", ")}.`:""}`};
draw();
// roles
const R=["AI Engineer","Generative AI Engineer","Machine Learning Engineer","Data Engineer","Data Analyst"];let ri=0;
if(!matchMedia("(prefers-reduced-motion:reduce)").matches)setInterval(()=>{ri=(ri+1)%R.length;$("#role").textContent=R[ri]},2200);
$("#avail").textContent=CONFIG.availText;
// nav
$("#menu").onclick=()=>{const o=$("#nav").classList.toggle("open");$("#menu").setAttribute("aria-expanded",o)};
$("#links").onclick=e=>{if(e.target.tagName==="A"){$("#nav").classList.remove("open");$("#menu").setAttribute("aria-expanded","false")}};
$("#theme").onclick=()=>{const d=document.documentElement,cur=d.dataset.theme||"dark";d.dataset.theme=cur==="dark"?"light":"dark"};
const ls=[...document.querySelectorAll("#links a")];
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)ls.forEach(a=>a.classList.toggle("on",a.getAttribute("href")==="#"+e.target.id))}),{rootMargin:"-45% 0px -50% 0px"});
document.querySelectorAll("section").forEach(s=>io.observe(s));
addEventListener("scroll",()=>{const h=document.documentElement;$("#bar").style.width=(h.scrollTop/(h.scrollHeight-h.clientHeight)*100)+"%"},{passive:true});
