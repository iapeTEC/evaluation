const { SCRIPT_URL, API_KEY } = window.APP_CONFIG;

const SKILLS = ["Listening", "Speaking", "Reading", "Writing"];
const $ = (sel) => document.querySelector(sel);

let students = [];
let gradesState = {}; // { studentId: {Listening:1..5,...} }

let current = { studentId:null, studentName:null, skill:null };

function qs(name){
  return new URLSearchParams(location.search).get(name) || "";
}

const classId = qs("classId");
const classObj = (window.CLASSES || []).find(c => c.id === classId);

function setHeader(){
  $("#pageTitle").textContent = "Avaliação";
  $("#pageSub").textContent = classObj ? `${classObj.label} • ${classObj.subtitle||""}` : `Turma: ${classId || "(não definida)"}`;
  $("#classBadge").textContent = classObj ? classObj.label : (classId || "Sem turma");
}

function todaySessionDefault() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}-${classId || "TURMA"}-AULA`;
}

function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem("gradesState_v2") || "{}");
    gradesState = saved && typeof saved === "object" ? saved : {};
  } catch { gradesState = {}; }
}
function saveLocal(){ localStorage.setItem("gradesState_v2", JSON.stringify(gradesState)); }

function setStatus(msg, isError=false){
  $("#status").innerHTML = isError ? `<span style="color:#b91c1c;font-weight:900">${msg}</span>` : msg;
}

function ensureState(studentId) {
  if (!gradesState[studentId]) gradesState[studentId] = { Listening:"", Speaking:"", Reading:"", Writing:"" };
  return gradesState[studentId];
}

function openModal(student, skill){
  current = { studentId: student.studentId, studentName: student.name, skill };
  $("#modalSkill").textContent = skill;
  $("#modalStudent").textContent = student.name;

  const list = $("#levelList");
  list.innerHTML = "";

  const desc = (window.RUBRIC && window.RUBRIC[skill]) ? window.RUBRIC[skill] : [];
  for (let i=1;i<=5;i++){
    const item = document.createElement("div");
    item.className = "levelItem";
    item.innerHTML = `
      <div class="levelNum">${i}</div>
      <div class="levelTxt">
        <b>Nível ${i}</b>
        <p>${desc[i-1] || ""}</p>
      </div>
    `;
    item.onclick = () => {
      const stState = ensureState(current.studentId);
      stState[skill] = i;
      gradesState[current.studentId] = stState;
      saveLocal();
      closeModal();
      render();
    };
    list.appendChild(item);
  }

  $("#modalOverlay").classList.add("show");
}
function closeModal(){ $("#modalOverlay").classList.remove("show"); }

function render(){
  const grid = $("#studentsGrid");
  grid.innerHTML = "";

  students.forEach(st => {
    const stState = ensureState(st.studentId);

    const card = document.createElement("div");
    card.className = "card student";

    const img = document.createElement("img");
    img.className = "avatar";
    img.alt = st.name;
    img.src = `assets/students/${st.photo || "placeholder.png"}`;
    img.onerror = () => img.src = "assets/students/placeholder.png";

    const body = document.createElement("div");
    body.style.flex = "1";

    const h3 = document.createElement("h3");
    h3.textContent = st.name;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<small class="muted">ID: <b>${st.studentId}</b></small>`;

    const skills = document.createElement("div");
    skills.className = "skills4";

    SKILLS.forEach(skill => {
      const btn = document.createElement("div");
      const val = stState[skill] ? String(stState[skill]) : "—";
      btn.className = "skillBtn " + (stState[skill] ? "ok" : "unset");
      btn.innerHTML = `<div class="label">${skill}</div><div class="value">${val}</div>`;
      btn.onclick = () => openModal(st, skill);
      skills.appendChild(btn);
    });

    body.appendChild(h3);
    body.appendChild(meta);
    body.appendChild(skills);

    card.appendChild(img);
    card.appendChild(body);

    grid.appendChild(card);
  });
}

function validateAll(){
  const missing = [];
  for (const st of students){
    const stState = ensureState(st.studentId);
    for (const skill of SKILLS){
      if (!stState[skill]) missing.push(`${st.name} → ${skill}`);
    }
  }
  return missing;
}

async function loadStudents(){
  if (!classId) { setStatus("Defina a turma (classId). Volte e escolha uma turma.", true); return; }
  setStatus("Carregando alunos…");
  const data = await jsonp(SCRIPT_URL, { action:"listStudents", key:API_KEY, classId });
  if (!data.ok) throw new Error(data.error || "API error");
  students = data.students || [];
  setStatus(`Alunos: <b>${students.length}</b>`);
  render();
}

async function finalize(){
  const teacher = $("#teacher").value.trim();
  const sessionId = $("#sessionId").value.trim();
  if (!teacher) return setStatus("Preencha Teacher.", true);
  if (!sessionId) return setStatus("Preencha Session ID.", true);

  const missing = validateAll();
  if (missing.length){
    return setStatus(`Faltam notas em: <br>${missing.slice(0,8).join("<br>")}${missing.length>8?"<br>…":""}`, true);
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
  setStatus("Enviando…");

  try{
    const form = document.getElementById("postForm");
    form.action = SCRIPT_URL;
    form.key.value = API_KEY;
    form.classId.value = classId;
    form.sessionId.value = sessionId;
    form.teacher.value = teacher;
    form.grades.value = JSON.stringify(payloadGrades);
    form.submit();

    setStatus("✅ Enviado! Confirmando…");
    setTimeout(async () => {
      try{
        const check = await jsonp(SCRIPT_URL, { action:"getReports", key:API_KEY, classId, sessionId });
        if (check.ok && (check.reports||[]).length){
          setStatus(`✅ Gravado! Turma <b>${classId}</b> • Sessão <b>${sessionId}</b> • ${check.reports.length} aluno(s).`);
        } else {
          setStatus(`Enviado, mas ainda não apareceu no relatório. Recarregue e tente novamente.`, true);
        }
      } catch(err){
        setStatus(`Enviado, mas falhou ao confirmar: ${err.message}`, true);
      }
    }, 900);

  } catch(err){
    setStatus(`Erro ao enviar: ${err.message}`, true);
  } finally {
    $("#finalizeBtn").disabled = false;
  }
}

(function init(){
  setHeader();
  loadLocal();

  $("#sessionId").value = todaySessionDefault();
  $("#reloadBtn").onclick = () => loadStudents().catch(e => setStatus(e.message, true));
  $("#finalizeBtn").onclick = finalize;

  $("#modalClose").onclick = closeModal;
  $("#modalOverlay").addEventListener("click", (ev) => {
    if (ev.target && ev.target.id === "modalOverlay") closeModal();
  });

  loadStudents().catch(e => setStatus(e.message, true));
})();
