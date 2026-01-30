const { SCRIPT_URL, API_KEY } = window.APP_CONFIG;
const $ = (sel) => document.querySelector(sel);

function setStatus(msg, isError=false){
  $("#status").innerHTML = isError ? `<span style="color:#b91c1c;font-weight:900">${msg}</span>` : msg;
}

function makePie(canvas, grades) {
  const data = {
    labels: ["Listening", "Speaking", "Reading", "Writing"],
    datasets: [{
      data: [
        Number(grades.listening || 0),
        Number(grades.speaking || 0),
        Number(grades.reading || 0),
        Number(grades.writing || 0),
      ]
    }]
  };
  return new Chart(canvas, { type:"pie", data, options:{ responsive:true, plugins:{ legend:{position:"bottom"}, tooltip:{callbacks:{label:(c)=>`${c.label}: ${c.raw}/5`}}}}});
}

function renderReports(reports, classId, sessionId) {
  const root = $("#reports");
  root.innerHTML = "";

  if (!reports || !reports.length) {
    setStatus("Nenhum relatório encontrado para esses filtros.", true);
    return;
  }

  setStatus(`Turma <b>${classId}</b> • Sessão <b>${sessionId}</b> • Alunos <b>${reports.length}</b>`);

  reports.forEach(r => {
    const card = document.createElement("div");
    card.className = "card reportCard";

    const top = document.createElement("div");
    top.className = "reportTop";

    const img = document.createElement("img");
    img.className = "avatar";
    img.alt = r.student.name;
    img.src = `assets/students/${r.student.photo || "placeholder.png"}`;
    img.onerror = () => img.src = "assets/students/placeholder.png";

    const info = document.createElement("div");
    info.style.flex = "1";
    info.innerHTML = `
      <h3 style="margin:0;">${r.student.name}</h3>
      <div class="meta">
        <small class="muted">ID: <b>${r.student.studentId}</b> • Média: <b>${r.summary.average}/5</b> • Cambridge: <b>${r.summary.cambridge}</b></small>
      </div>
    `;

    top.appendChild(img);
    top.appendChild(info);

    const body = document.createElement("div");
    body.className = "reportBody";

    const chartWrap = document.createElement("div");
    chartWrap.className = "card";
    chartWrap.style.padding = "12px";
    chartWrap.style.border = "1px solid var(--border)";
    chartWrap.style.boxShadow = "none";
    chartWrap.style.borderRadius = "18px";
    chartWrap.style.background = "rgba(255,255,255,.92)";

    const canvas = document.createElement("canvas");
    canvas.height = 220;
    chartWrap.appendChild(canvas);

    const text = document.createElement("div");
    text.className = "reportText";
    const safe = String(r.summary.textPT || "")
      .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
    // minimal **bold** handling:
    text.innerHTML = safe.replaceAll("\n","<br>").replaceAll("**","<b>");

    body.appendChild(chartWrap);
    body.appendChild(text);

    card.appendChild(top);
    card.appendChild(body);
    root.appendChild(card);

    makePie(canvas, r.grades);
  });
}

async function loadReports(){
  const classId = $("#classId").value.trim();
  const sessionId = $("#sessionId").value.trim();
  if (!classId) return setStatus("Informe a turma (classId). Ex.: 7ano", true);

  setStatus("Carregando…");
  const data = await jsonp(SCRIPT_URL, { action:"getReports", key:API_KEY, classId, sessionId });
  if (!data.ok) throw new Error(data.error || "API error");

  renderReports(data.reports || [], classId, data.sessionId || sessionId || "");
}

(function init(){
  // quick hint showing valid classIds
  const ids = (window.CLASSES||[]).map(c=>c.id).join(", ");
  $("#hint").textContent = ids ? `classId válidos: ${ids}` : "Edite window.CLASSES em assets/js/config.js";

  $("#loadBtn").onclick = () => loadReports().catch(e => setStatus(e.message, true));
})();
