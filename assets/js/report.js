// ==== CONFIG ====
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyVxTa4luMJVA5ogoVqm1A0JA-q7eyrHkp-C0eNQVq0dmFD7q6TgpT24U5HVNh8AUa2OQ/exec"; // .../exec
const API_KEY = "AIzaSyBuxhNxlYcLM88G6BggpNO8XG8w2BY9vSE";

const $ = (sel) => document.querySelector(sel);

function setStatus(msg, isError=false) {
  const el = $("#status");
  el.innerHTML = isError ? `<span style="color:#b91c1c;font-weight:800">${msg}</span>` : msg;
}

async function apiGet(params) {
  const url = new URL(SCRIPT_URL);
  Object.entries(params).forEach(([k,v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { method:"GET" });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error || "API error");
  return data;
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

  // Sem setar cores fixas (Chart.js define padrão).
  return new Chart(canvas, {
    type: "pie",
    data,
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.label}: ${ctx.raw}/5`
          }
        }
      }
    }
  });
}

function renderReports(reports, sessionId) {
  const root = $("#reports");
  root.innerHTML = "";

  if (!reports || !reports.length) {
    setStatus("Nenhum relatório encontrado para essa sessão.", true);
    return;
  }

  setStatus(`Sessão carregada: <b>${sessionId}</b> • Alunos: <b>${reports.length}</b>`);

  reports.forEach((r, idx) => {
    const card = document.createElement("div");
    card.className = "card reportCard";

    const top = document.createElement("div");
    top.className = "reportTop";

    const img = document.createElement("img");
    img.className = "avatar";
    img.alt = r.student.name;
    img.src = `assets/students/${r.student.photo || "placeholder.jpg"}`;
    img.onerror = () => { img.src = "assets/students/placeholder.jpg"; };

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
    chartWrap.style.borderRadius = "14px";
    chartWrap.style.background = "#fff";

    const canvas = document.createElement("canvas");
    canvas.height = 220;

    chartWrap.appendChild(canvas);

    const text = document.createElement("div");
    text.className = "reportText";
    text.innerHTML = r.summary.textPT
      .replaceAll("\n", "<br/>")
      .replaceAll("**", "<b>"); // simples, só pra negrito (não é parser markdown)

    body.appendChild(chartWrap);
    body.appendChild(text);

    card.appendChild(top);
    card.appendChild(body);

    root.appendChild(card);

    // cria o pie depois do canvas no DOM
    makePie(canvas, r.grades);
  });
}

async function loadReports() {
  const sessionId = $("#sessionId").value.trim();

  setStatus("Carregando relatórios…");
  try {
    const data = await apiGet({ action:"getReports", key:API_KEY, sessionId });
    renderReports(data.reports || [], data.sessionId || sessionId || "");
  } catch (err) {
    setStatus(`Erro: ${err.message}`, true);
  }
}

(function init(){
  $("#loadBtn").onclick = loadReports;
  loadReports();
})();
