// editor.js — guaranteed working version
document.addEventListener("DOMContentLoaded", () => {

    const weekdays = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  
    const weekdaySel = document.getElementById("weekday");
    const modeSel = document.getElementById("modeSel");
    const which = document.getElementById("which");
    const editList = document.getElementById("editList");
    const newText = document.getElementById("newText");
    const addBtn = document.getElementById("addBtn");
  
    // ---- Populate weekday dropdown ----
    weekdaySel.innerHTML = "";
    weekdays.forEach((d, i) => {
      const opt = document.createElement("option");
      opt.value = i;
      opt.textContent = d;
      weekdaySel.appendChild(opt);
    });
  
    // Default to today
    weekdaySel.value = new Date().getDay();
  
    // ---- Storage helpers ----
    function keyFor(day, mode) {
      return `week_${day}_${mode}`;
    }
  
    function load(day, mode) {
      return JSON.parse(localStorage.getItem(keyFor(day, mode)) || "[]");
    }
  
    function save(day, mode, list) {
      localStorage.setItem(keyFor(day, mode), JSON.stringify(list));
    }
  
    // ---- Render list ----
    function render() {
      const day = Number(weekdaySel.value);
      const mode = modeSel.value;
  
      which.textContent = `${weekdays[day]} — ${mode} checklist`;
  
      const list = load(day, mode);
      editList.innerHTML = "";
  
      if (list.length === 0) {
        const empty = document.createElement("p");
        empty.style.color = "#94a3b8";
        empty.textContent = "No items yet.";
        editList.appendChild(empty);
        return;
      }
  
      list.forEach((item, i) => {
        const li = document.createElement("li");
  
        const input = document.createElement("input");
        input.type = "text";
        input.value = item.text;
        input.onchange = () => {
          const l = load(day, mode);
          l[i].text = input.value;
          save(day, mode, l);
        };
  
        const del = document.createElement("button");
        del.textContent = "Delete";
        del.className = "delete";
        del.onclick = () => {
          const l = load(day, mode);
          l.splice(i, 1);
          save(day, mode, l);
          render();
        };
  
        li.appendChild(input);
        li.appendChild(del);
        editList.appendChild(li);
      });
    }
  
    // ---- Add button ----
    addBtn.onclick = () => {
      const day = Number(weekdaySel.value);
      const mode = modeSel.value;
      const value = newText.value.trim();
  
      if (!value) return;
  
      const list = load(day, mode);
      list.push({ text: value, done: false });
      save(day, mode, list);
  
      newText.value = "";
      render();
    };
  
    weekdaySel.onchange = render;
    modeSel.onchange = render;
  
    render();
  });
  