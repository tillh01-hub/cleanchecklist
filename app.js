// app.js — no categories; animated checkmarks, swipe, drag, weekly auto-reset, haptics
document.addEventListener('DOMContentLoaded', () => {
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

  // WEEKLY AUTO-RESET (ISO week number)
  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  }
  const currentWeek = getWeekNumber(new Date());
  const lastWeek = Number(localStorage.getItem('wc_last_week') || 0);
  if(lastWeek !== currentWeek){
    // clear all week_<d>_<mode> keys
    ['day','night'].forEach(m=>{
      for(let i=0;i<7;i++) localStorage.removeItem(`week_${i}_${m}`);
    });
    localStorage.setItem('wc_last_week', currentWeek);
    localStorage.removeItem('wc_selected_mode');
    mode = "";
  }

  // storage helpers
  function keyFor(dIdx, m){ return `week_${dIdx}_${m}`; }
  function loadList(){ return JSON.parse(localStorage.getItem(keyFor(todayIndex, mode)) || "[]"); }
  function saveList(list){ localStorage.setItem(keyFor(todayIndex, mode), JSON.stringify(list)); }

  const vibrate = (t=20) => { if(navigator.vibrate) navigator.vibrate(t); };

  function showPrompt(){ prompt.style.display=''; checklistSection.style.display='none'; }
  function showChecklist(){
    prompt.style.display='none'; checklistSection.style.display='';
    title.innerText = `${weekdays[todayIndex]} — ${mode.toUpperCase()}`;
    subtext.innerText = `Checklist for ${weekdays[todayIndex]} (${mode})`;
    render();
  }

  function setMode(m){
    mode = m;
    localStorage.setItem('wc_selected_mode', m);
    showChecklist();
  }

  dayBtn.addEventListener('click', ()=> setMode('day'));
  nightBtn.addEventListener('click', ()=> setMode('night'));
  changeMode.addEventListener('click', ()=> { localStorage.removeItem('wc_selected_mode'); location.reload(); });

  // create item element
  function createItemElement(item, idx){
    const li = document.createElement('li');
    li.dataset.index = idx;

    // checkbox wrap (animated check)
    const cbWrap = document.createElement('div'); cbWrap.className = 'checkboxWrap';
    if(item.done) cbWrap.classList.add('checked');

    const checkSvg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    checkSvg.setAttribute('viewBox','0 0 24 24');
    checkSvg.classList.add('checkmark');
    checkSvg.innerHTML = `<use href="#icon-check"></use>`;
    cbWrap.appendChild(checkSvg);

    cbWrap.addEventListener('click', ()=>{
      item.done = !item.done;
      if(item.done) cbWrap.classList.add('checked'); else cbWrap.classList.remove('checked');
      saveList(listData);
      render();
      vibrate(20);
    });

    const text = document.createElement('div'); text.className='text'; text.textContent = item.text;

    if(item.done) li.classList.add('done');

    li.appendChild(cbWrap); li.appendChild(text);

    attachDragAndSwipe(li, idx);

    return li;
  }

  // render
  let listData = [];
  function render(){
    listData = loadList();
    listEl.innerHTML = '';
    if(!listData || listData.length === 0){
      const e = document.createElement('div'); e.style.color='#9a9a9a'; e.style.padding='12px';
      e.textContent = 'No items — add some in the editor.';
      listEl.appendChild(e);
      return;
    }
    listData.forEach((it, idx) => listEl.appendChild(createItemElement(it, idx)));
  }

  // drag & swipe handlers
  function attachDragAndSwipe(li, index){
    // DRAG
    li.draggable = true;
    li.addEventListener('dragstart', (e)=>{
      li.classList.add('dragging');
      e.dataTransfer?.setData('text/plain', index.toString());
      li.animate([{ transform:'scale(1)' }, { transform:'scale(1.02)' }, { transform:'scale(1)' }], {duration:300, easing:'cubic-bezier(.2,.9,.2,1)'});
    });
    li.addEventListener('dragend', ()=>{
      li.classList.remove('dragging');
      // compute new order from DOM
      const nodes = Array.from(listEl.querySelectorAll('li'));
      const newList = nodes.map(n => {
        const txt = n.querySelector('.text').textContent;
        const done = n.classList.contains('done') || n.querySelector('.checkboxWrap')?.classList.contains('checked');
        return { text: txt, done };
      });
      listData = newList;
      saveList(listData);
      render();
      vibrate(10);
    });

    li.addEventListener('dragover', (e)=>{
      e.preventDefault();
      const target = e.currentTarget;
      const rect = target.getBoundingClientRect();
      const before = (e.clientY - rect.top) < rect.height/2;
      const dragging = listEl.querySelector('.dragging');
      if(!dragging || dragging === target) return;
      if(before) listEl.insertBefore(dragging, target); else listEl.insertBefore(dragging, target.nextSibling);
    });

    // SWIPE (touch)
    let startX = 0, currentX = 0;
    const threshold = 60;
    li.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      li.style.transition = ''; // cancel transitions while swiping
    }, {passive:true});

    li.addEventListener('touchmove', (e) => {
      currentX = e.touches[0].clientX - startX;
      li.style.transform = `translateX(${currentX}px)`;
      if(currentX > threshold) li.classList.add('swipe-right'); else li.classList.remove('swipe-right');
      if(currentX < -threshold) li.classList.add('swipe-left'); else li.classList.remove('swipe-left');
    }, {passive:true});

    li.addEventListener('touchend', (e) => {
      li.style.transition = 'transform 350ms cubic-bezier(.2,.9,.25,1)';
      if(currentX > threshold){
        // mark done
        listData[index].done = true;
        saveList(listData);
        vibrate(30);
      } else if(currentX < -threshold){
        // remove
        listData.splice(index,1);
        saveList(listData);
        vibrate(40);
      } else {
        li.style.transform = 'translateX(0)';
      }
      setTimeout(()=>{ li.classList.remove('swipe-right','swipe-left'); render(); }, 260);
      startX = 0; currentX = 0;
    });
  }

  // init
  if(mode) showChecklist(); else showPrompt();
});
