// ==== CONFIG ====
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyVxTa4luMJVA5ogoVqm1A0JA-q7eyrHkp-C0eNQVq0dmFD7q6TgpT24U5HVNh8AUa2OQ/exec"; // .../exec
const API_KEY = "AIzaSyBuxhNxlYcLM88G6BggpNO8XG8w2BY9vSE";

// Competências fixas
const SKILLS = ["Listening", "Speaking", "Reading", "Writing"];

// Estado local (para não perder cliques se recarregar)
let students = [];
let gradesState = {}; // { studentId: {Listening:1..5, ...} }

const $ = (sel) => document.querySelector(sel);

function todaySessionDefault() {
  // Ex: 2026-01-30
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-AULA`;
}

function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem("gradesState") || "{}");
    gradesState = saved && typeof saved === "object" ? saved : {};
  } catch { gradesState = {}; }
}

function saveLocal() {
  localStorage.setItem("gradesState", JSON.stringify(gradesState));
}

function setStatus(msg, isError=false) {
  const el = $("#status");
  el.innerHTML = isError ? `<span style="color:#b91c1c;font-weight:800">${msg}</span>` : msg;
}

async function apiGet(params) {
  const url = new URL(SCRIPT_URL);
  Object.entries(params).forEach(([k,v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { method:"GET" });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "API error");
  return data;
}

async function apiPost(payload) {
  const res = await fetch(SCRIPT_URL, {
    method:"POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "API error");
  return data;
}

function ensureState(studentId) {
  if (!gradesState[studentId]) {
    gradesState[studentId] = { Listening:"", Speaking:"", Reading:"", Writing:"" };
  }
  return gradesState[studentId];
}

function render() {
  const grid = $("#studentsGrid");
  grid.innerHTML = "";

  students.forEach(st => {
    const stState = ensureState(st.studentId);

    const card = document.createElement("div");
    card.className = "card student";

    const img = document.createElement("img");
    img.className = "avatar";
    img.alt = st.name;
    img.src = `assets/students/${st.photo || "placeholder.jpg"}`;
    img.onerror = () => { img.src = "assets/students/placeholder.jpg"; };

    const body = document.createElement("div");
    body.style.flex = "1";

    const h3 = document.createElement("h3");
    h3.textContent = st.name;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<small class="muted">ID: <b>${st.studentId}</b></small>`;

    const skills = document.createElement("div");
    skills.className = "skills";

    SKILLS.forEach(skill => {
      const box = document.createElement("div");
      box.className = "skillBox";

      const top = document.createElement("div");
      top.className = "title";

      const title = document.createElement("strong");
      title.textContent = skill;

      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = stState[skill] ? `Nível ${stState[skill]}` : "Sem nota";

      top.appendChild(title);
      top.appendChild(badge);

      const levels = document.createElement("div");
      levels.className = "levels";

      for (let i = 1; i <= 5; i++) {
        const btn = document.createElement("button");
        btn.className = "levelBtn" + (Number(stState[skill]) === i ? " active" : "");
        btn.textContent = String(i);
        btn.onclick = () => {
          stState[skill] = i;
          gradesState[st.studentId] = stState;
          saveLocal();
          render();
        };
        levels.appendChild(btn);
      }

      box.appendChild(top);
      box.appendChild(levels);
      skills.appendChild(box);
    });

    body.appendChild(h3);
    body.appendChild(meta);
    body.appendChild(skills);

    card.appendChild(img);
    card.appendChild(body);

    grid.appendChild(card);
  });
}

function validateAll() {
  const missing = [];
  for (const st of students) {
    const stState = ensureState(st.studentId);
    for (const skill of SKILLS) {
      if (!stState[skill]) missing.push(`${st.name} → ${skill}`);
    }
  }
  return missing;
}

async function loadStudents() {
  setStatus("Carregando alunos…");
  const data = await apiGet({ action:"listStudents", key:API_KEY });
  students = data.students || [];
  if (!students.length) setStatus("Nenhum aluno encontrado na aba Students.", true);
  else setStatus(`Alunos carregados: <b>${students.length}</b>`);
  render();
}

async function finalize() {
  const teacher = $("#teacher").value.trim();
  const sessionId = $("#sessionId").value.trim();

  if (!teacher) return setStatus("Preencha o campo Teacher.", true);
  if (!sessionId) return setStatus("Preencha o Session ID.", true);

  const missing = validateAll();
  if (missing.length) {
    const preview = missing.slice(0, 8).join("<br/>");
    return setStatus(`Faltam notas em:<br/>${preview}${missing.length>8 ? "<br/>…":""}`, true);
  }

  const payloadGrades = students.map(st => {
    const stState = ensureState(st.studentId);
    return {
      studentId: st.studentId,
      listening: stState.Listening,
      speaking: stState.Speaking,
      reading: stState.Reading,
      writing: stState.Writing
    };
  });

  $("#finalizeBtn").disabled = true;
  setStatus("Enviando para a planilha…");

  try {
    const res = await apiPost({
      action: "submitGrades",
      key: API_KEY,
      sessionId,
      teacher,
      grades: payloadGrades
    });

    setStatus(`✅ Salvo com sucesso: <b>${res.saved}</b> registros (sessionId: <b>${res.sessionId}</b>)`);
    // Mantém local; se quiser “limpar” após enviar:
    // localStorage.removeItem("gradesState"); gradesState={}; render();
  } catch (err) {
    setStatus(`Erro ao salvar: ${err.message}`, true);
  } finally {
    $("#finalizeBtn").disabled = false;
  }
}

(function init(){
  loadLocal();
  $("#sessionId").value = todaySessionDefault();
  $("#reloadBtn").onclick = loadStudents;
  $("#finalizeBtn").onclick = finalize;

  loadStudents().catch(err => setStatus(`Erro: ${err.message}`, true));
})();
