/* Certificate viewer: shows the real certificate image and links to the original PDF */
(function(){
const P="assets/certificates/";
const CERTS={
 ms:{title:"Microsoft Certified: Fabric Data Engineer Associate (DP-700)",sub:"Issued by Microsoft. Earned August 9, 2026; expires August 10, 2027. Credential ID A65247D2C294BDBA.",slug:"microsoft-fabric-data-engineer-dp700",alt:"Microsoft Certified: Fabric Data Engineer Associate certificate issued to Sunil Kulali"},
 itv:{title:"Master in Data Science & Analytics with Artificial Intelligence",sub:"Course certificate from IT Vedant Education Private Limited. Grade A, issued 18 March 2026.",slug:"it-vedant-data-science-ai",alt:"IT Vedant Master in Data Science and Analytics with Artificial Intelligence certificate issued to Sunil Kulali"},
 ibm:{title:"Python 101 for Data Science (PY0101EN)",sub:"Course certificate: IBM Developer Skills Network course delivered through IT Vedant. Issued February 7, 2025.",slug:"ibm-python-for-data-science",alt:"IBM Python 101 for Data Science certificate issued to Sunil Kulali",
  verify:"https://courses.itvedant.skillsnetwork.site/certificates/0fbf1b367e5a4fc1a71ad9d9a861ccf5"}
};
const dlg=document.getElementById("cv");if(!dlg)return;let opener=null;
function link(href,text,dl){const a=document.createElement("a");a.className="btn";a.href=href;a.textContent=text;
 if(dl)a.setAttribute("download","");else{a.target="_blank";a.rel="noopener noreferrer"}return a}
function open(id,from){const c=CERTS[id];if(!c)return;opener=from;
 document.getElementById("cvt").textContent=c.title;document.getElementById("cvs").textContent=c.sub;
 const i=document.getElementById("cvi");i.src=P+c.slug+".jpeg";i.alt=c.alt;
 const a=document.getElementById("cva");a.textContent="";
 a.append(link(P+c.slug+".pdf","Open original PDF"),link(P+c.slug+".pdf","Download PDF",true));
 if(c.verify)a.append(link(c.verify,"Verify online"));
 dlg.showModal();document.body.style.overflow="hidden";document.getElementById("cvx").focus()}
document.addEventListener("click",e=>{const b=e.target.closest("[data-cert]");if(b)open(b.dataset.cert,b)});
document.getElementById("cvx").onclick=()=>dlg.close();
dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
dlg.addEventListener("close",()=>{document.body.style.overflow="";document.getElementById("cvi").removeAttribute("src");if(opener)opener.focus()});
})();
