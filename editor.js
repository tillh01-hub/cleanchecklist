document.addEventListener('DOMContentLoaded', () => {
  const weekdays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const weekdaySel = document.getElementById('weekday');
  const modeSel = document.getElementById('modeSel');
  const which = document.getElementById('which');
  const editList = document.getElementById('editList');
  const newText = document.getElementById('newText');
  const addBtn = document.getElementById('addBtn');
  const exportBtn = document.getElementById('exportBtn');
  const importFile = document.getElementById('importFile');

  weekdays.forEach((d,i)=> { const o=document.createElement('option'); o.value=i; o.textContent=d; weekdaySel.appendChild(o); });
  weekdaySel.value = new Date().getDay();

  function keyFor(d,m){ return `week_${d}_${m}`; }
  function load(d,m){ return JSON.parse(localStorage.getItem(keyFor(d,m))||'[]'); }
  function save(d,m,list){ localStorage.setItem(keyFor(d,m), JSON.stringify(list)); }

  function render(){
    const day = Number(weekdaySel.value), mode = modeSel.value;
    which.textContent = `${weekdays[day]} — ${mode}`;
    const list = load(day,mode);
    editList.innerHTML = '';
    if(list.length === 0){ const p=document.createElement('div'); p.className='muted'; p.textContent='No items yet.'; editList.appendChild(p); return; }
    list.forEach((it,i)=>{
      const li=document.createElement('li');
      const input=document.createElement('input'); input.type='text'; input.value=it.text;
      input.addEventListener('change', ()=> { const l=load(day,mode); l[i].text = input.value; save(day,mode,l); });
      const del=document.createElement('button'); del.textContent='Delete'; del.className='delete';
      del.addEventListener('click', ()=> { const l=load(day,mode); l.splice(i,1); save(day,mode,l); render(); });
      li.appendChild(input); li.appendChild(del); editList.appendChild(li);
    });
  }

  addBtn.addEventListener('click', ()=> {
    const day = Number(weekdaySel.value), mode = modeSel.value, v = newText.value.trim();
    if(!v) return;
    const l = load(day,mode); l.push({ text: v, done: false }); save(day,mode,l); newText.value = ''; render();
  });

  // Export JSON of entire storage for all weekdays/modes
  exportBtn.addEventListener('click', ()=> {
    const dump = {};
    for(let d=0; d<7; d++){
      ['day','night'].forEach(m=> { dump[`week_${d}_${m}`] = JSON.parse(localStorage.getItem(`week_${d}_${m}`) || '[]'); });
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'checklists-backup.json'; a.click();
    URL.revokeObjectURL(url);
  });

  // Import: merge or replace whole storage
  importFile.addEventListener('change', (e)=> {
    const f = e.target.files[0]; if(!f) return;
    const reader = new FileReader();
    reader.onload = (ev)=> {
      try{
        const data = JSON.parse(ev.target.result);
        // confirm replacement
        if(!confirm('Import will overwrite existing lists with keys present in the file. Proceed?')) return;
        Object.keys(data).forEach(k => { localStorage.setItem(k, JSON.stringify(data[k])); });
        alert('Import complete.');
        render();
      } catch(err){ alert('Invalid file.'); }
    };
    reader.readAsText(f);
    e.target.value = '';
  });

  weekdaySel.addEventListener('change', render);
  modeSel.addEventListener('change', render);

  // initial render
  render();
});
