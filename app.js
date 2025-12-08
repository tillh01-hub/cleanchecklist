// app.js — Weekly auto-reset + Day/Night + drag + mobile-friendly
document.addEventListener("DOMContentLoaded", () => {

    const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const dayBtn = document.getElementById("dayBtn");
    const nightBtn = document.getElementById("nightBtn");
    const prompt = document.getElementById("prompt");
    const checklistSection = document.getElementById("checklistSection");
    const title = document.getElementById("title");
    const subtext = document.getElementById("subtext");
    const listEl = document.getElementById("list");
    const changeMode = document.getElementById("changeMode");
  
    const todayIndex = new Date().getDay();
    let mode = localStorage.getItem("wc_selected_mode") || "";
  
    // ------------------- Weekly Auto-Reset -------------------
    function getWeekNumber(d) {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
      return weekNum;
    }
  
    const today = new Date();
    const currentWeek = getWeekNumber(today);
    const lastWeek = localStorage.getItem("wc_last_week");
  
    if(Number(lastWeek) !== currentWeek){
      // New week → remove all saved lists
      const modes = ["day","night"];
      for(let i=0;i<7;i++){
        modes.forEach(m => localStorage.removeItem(`week_${i}_${m}`));
      }
      localStorage.setItem("wc_last_week", currentWeek);
      localStorage.removeItem("wc_selected_mode");
      mode = "";
    }
  
    // ------------------- Storage Helpers -------------------
    function keyFor(dayIndex, mode){ return `week_${dayIndex}_${mode}`; }
    function loadList(){ return JSON.parse(localStorage.getItem(keyFor(todayIndex, mode)) || "[]"); }
    function saveList(list){ localStorage.setItem(keyFor(todayIndex, mode), JSON.stringify(list)); }
  
    // ------------------- Show/Hide Sections -------------------
    function showPrompt(){ prompt.style.display=""; checklistSection.style.display="none"; }
    function showChecklist(){
      prompt.style.display="none";
      checklistSection.style.display="";
      title.innerText=`${weekdays[todayIndex]} — ${mode.toUpperCase()}`;
      subtext.innerText=`Checklist for ${weekdays[todayIndex]} (${mode})`;
      renderList();
    }
  
    function setMode(m){ mode=m; localStorage.setItem("wc_selected_mode", m); showChecklist(); }
  
    // ------------------- Render Checklist -------------------
    function renderList(){
      const list=loadList(); listEl.innerHTML="";
      if(list.length===0){
        const empty=document.createElement("div");
        empty.style.color="#94a3b8"; empty.style.padding="10px";
        empty.textContent="No items for this day/mode. Add some in the editor!";
        listEl.appendChild(empty); return;
      }
      list.forEach((item,i)=>{
        const li=document.createElement("li");
        li.className="item"+(item.done?" done":"");
        li.draggable=true; li.dataset.index=i;
  
        const cb=document.createElement("input");
        cb.type="checkbox"; cb.checked=item.done;
        cb.addEventListener("change",()=>{ const l=loadList(); l[i].done=cb.checked; saveList(l); renderList(); });
  
        const span=document.createElement("div");
        span.className="text"; span.textContent=item.text;
  
        li.appendChild(cb); li.appendChild(span);
        listEl.appendChild(li);
      });
      enableDrag();
    }
  
    // ------------------- Drag & Drop -------------------
    function enableDrag(){
      const items=listEl.querySelectorAll(".item"); let dragEl=null;
      items.forEach(item=>{
        item.addEventListener("dragstart", e=>{ dragEl=item; item.classList.add("dragging"); e.dataTransfer?.setData("text/plain","drag"); });
        item.addEventListener("dragend", ()=>{ if(dragEl) dragEl.classList.remove("dragging"); dragEl=null; });
        item.addEventListener("dragover", e=>{
          e.preventDefault();
          const target=e.currentTarget; if(target===dragEl)return;
          const rect=target.getBoundingClientRect();
          const before=(e.clientY-rect.top)<rect.height/2;
          if(before) target.parentNode.insertBefore(dragEl,target); 
          else target.parentNode.insertBefore(dragEl,target.nextSibling);
        });
        item.addEventListener("drop", e=>{
          e.preventDefault();
          const newOrder=Array.from(listEl.querySelectorAll(".item")).map(n=>({
            text:n.querySelector(".text").textContent,
            done:n.querySelector("input").checked
          }));
          saveList(newOrder); renderList();
        });
      });
    }
  
    // ------------------- Buttons -------------------
    dayBtn.addEventListener("click", ()=>setMode("day"));
    nightBtn.addEventListener("click", ()=>setMode("night"));
    changeMode.addEventListener("click", showPrompt);
  
    // ------------------- Init -------------------
    if(mode) showChecklist();
    else showPrompt();
  });
  