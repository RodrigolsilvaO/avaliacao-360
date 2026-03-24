/* =============================================
   Avaliação 360 - Lógica do Dashboard
   Painel administrativo para coordenadores
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  checkAuthentication();
});

/* =============================================
   Autenticação simples
   ============================================= */
function checkAuthentication() {
  const overlay = document.getElementById('passwordOverlay');
  const dashboard = document.getElementById('dashboardContent');
  const passwordInput = document.getElementById('passwordInput');
  const passwordForm = document.getElementById('passwordForm');
  const errorMsg = document.getElementById('passwordError');

  // Verifica se já autenticou nesta sessão
  if (sessionStorage.getItem('av360_authenticated') === 'true') {
    overlay.style.display = 'none';
    dashboard.style.display = 'block';
    initDashboard();
    return;
  }

  overlay.style.display = 'flex';
  dashboard.style.display = 'none';

  passwordForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const password = passwordInput.value;
    const correctPassword = Config.getPassword();

    if (password === correctPassword) {
      sessionStorage.setItem('av360_authenticated', 'true');
      overlay.style.display = 'none';
      dashboard.style.display = 'block';
      initDashboard();
    } else {
      errorMsg.classList.add('visible');
      passwordInput.value = '';
      passwordInput.focus();
      setTimeout(() => errorMsg.classList.remove('visible'), 3000);
    }
  });

  // Foco automático no campo de senha
  passwordInput.focus();
}

/* =============================================
   Inicialização do dashboard
   ============================================= */
function initDashboard() {
  populateFilters();
  setupFilterListeners();
  updateModeIndicator();
  loadData();
}

/* =============================================
   Preenche os filtros
   ============================================= */
function populateFilters() {
  // Filtro de equipes
  const equipeFilter = document.getElementById('filterEquipe');
  if (equipeFilter) {
    Config.EQUIPES.forEach(eq => {
      const option = document.createElement('option');
      option.value = eq.value;
      option.textContent = eq.label;
      equipeFilter.appendChild(option);
    });
  }

  // Filtro de períodos
  const periodoFilter = document.getElementById('filterPeriodo');
  if (periodoFilter) {
    const periodos = Config.getPeriodos();
    periodos.forEach(p => {
      const option = document.createElement('option');
      option.value = p.value;
      option.textContent = p.label;
      periodoFilter.appendChild(option);
    });
  }
}

/* =============================================
   Listeners dos filtros
   ============================================= */
function setupFilterListeners() {
  const filterEquipe = document.getElementById('filterEquipe');
  const filterPeriodo = document.getElementById('filterPeriodo');

  if (filterEquipe) filterEquipe.addEventListener('change', loadData);
  if (filterPeriodo) filterPeriodo.addEventListener('change', loadData);
}

/* =============================================
   Carrega e exibe os dados
   ============================================= */
async function loadData() {
  const filters = {
    equipe: document.getElementById('filterEquipe')?.value || 'todas',
    periodo: document.getElementById('filterPeriodo')?.value || 'todos'
  };

  let evaluations;

  // Tenta buscar do Google Sheets se estiver configurado
  if (Config.getMode() === 'sheets' && Config.getScriptUrl()) {
    try {
      const sheetsData = await SheetsAPI.fetchEvaluations();
      // Converte formato do Google Sheets para o formato local
      evaluations = sheetsData.map(row => ({
        timestamp: row['Data'] || row['timestamp'],
        equipe: row['Equipe'] || row['equipe'],
        periodo: row['Período'] || row['periodo'],
        gestorPositivos: row['Gestor - Pontos Positivos'] || row['gestorPositivos'],
        gestorNegativos: row['Gestor - Pontos Negativos'] || row['gestorNegativos'],
        empresaComentario: row['Empresa - Comentário'] || row['empresaComentario'],
        empresaNota: row['Empresa - Nota'] || row['empresaNota'],
        sistemaComentario: row['Sistema - Comentário'] || row['sistemaComentario'],
        sistemaNota: row['Sistema - Nota'] || row['sistemaNota'],
        satisfacaoGeral: row['Satisfação Geral'] || row['satisfacaoGeral']
      }));

      // Aplica filtros manualmente
      if (filters.equipe && filters.equipe !== 'todas') {
        evaluations = evaluations.filter(e => e.equipe === filters.equipe);
      }
      if (filters.periodo && filters.periodo !== 'todos') {
        evaluations = evaluations.filter(e => e.periodo === filters.periodo);
      }
      evaluations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.warn('Falha ao buscar do Google Sheets, usando dados locais:', error);
      evaluations = Storage.getFilteredEvaluations(filters);
    }
  } else {
    evaluations = Storage.getFilteredEvaluations(filters);
  }

  const stats = Storage.getStatistics(evaluations);

  updateStatCards(stats);
  renderBarChart(stats.porEquipe);
  renderStarDistribution(stats.distribuicaoEstrelas, stats.total);
  renderEvaluationList(evaluations);

  // Armazena referência para exportação
  window._currentEvaluations = evaluations;
}

/* =============================================
   Atualiza os cards de estatísticas
   ============================================= */
function updateStatCards(stats) {
  const totalEl = document.getElementById('statTotal');
  const mediaEl = document.getElementById('statMedia');
  const mesEl = document.getElementById('statMes');

  if (totalEl) totalEl.textContent = stats.total;
  if (mediaEl) {
    mediaEl.textContent = stats.total > 0 ? `${stats.mediaGeral} ${Utils.renderStars(Math.round(stats.mediaGeral))}` : '-';
  }
  if (mesEl) mesEl.textContent = stats.esteMes;
}

/* =============================================
   Renderiza o gráfico de barras por equipe
   ============================================= */
function renderBarChart(porEquipe) {
  const container = document.getElementById('chartBars');
  if (!container) return;

  const equipes = Object.values(porEquipe);

  if (equipes.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state__icon">📊</div><div class="empty-state__text">Sem dados para exibir</div></div>';
    return;
  }

  let html = '';
  equipes.forEach(eq => {
    const percentage = (parseFloat(eq.media) / 5) * 100;
    html += `
      <div class="chart-bar">
        <div class="chart-bar__label">${eq.label}</div>
        <div class="chart-bar__track">
          <div class="chart-bar__fill" style="width: ${percentage}%">
            <span class="chart-bar__value">${eq.media} ${Utils.renderStars(Math.round(eq.media))} (${eq.total})</span>
          </div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;

  // Animação de entrada (reseta e aplica width)
  requestAnimationFrame(() => {
    container.querySelectorAll('.chart-bar__fill').forEach(fill => {
      const width = fill.style.width;
      fill.style.width = '0%';
      requestAnimationFrame(() => {
        fill.style.width = width;
      });
    });
  });
}

/* =============================================
   Renderiza a distribuição de estrelas
   ============================================= */
function renderStarDistribution(distribuicao, total) {
  const container = document.getElementById('starDistribution');
  if (!container) return;

  if (total === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state__icon">\u2B50</div><div class="empty-state__text">Sem dados para exibir</div></div>';
    return;
  }

  let html = '';
  // De 5 a 1 estrela
  for (let i = 5; i >= 1; i--) {
    const count = distribuicao[i] || 0;
    const percentage = total > 0 ? (count / total) * 100 : 0;
    const starsText = Utils.renderStars(i);

    html += `
      <div class="star-dist-row">
        <div class="star-dist-row__stars">${starsText}</div>
        <div class="star-dist-row__bar">
          <div class="star-dist-row__fill" style="width: ${percentage}%"></div>
        </div>
        <div class="star-dist-row__count">${count}</div>
      </div>
    `;
  }

  container.innerHTML = html;
}

/* =============================================
   Renderiza a lista de avaliações
   ============================================= */
function renderEvaluationList(evaluations) {
  const container = document.getElementById('evaluationList');
  if (!container) return;

  if (!evaluations || evaluations.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📝</div>
        <div class="empty-state__text">Nenhuma avaliação encontrada</div>
      </div>
    `;
    return;
  }

  let html = '';
  evaluations.forEach(ev => {
    html += `
      <div class="evaluation-item fade-in">
        <div class="evaluation-item__header">
          <div class="evaluation-item__meta">
            <span class="evaluation-item__badge">${Utils.getEquipeLabel(ev.equipe)}</span>
            <span class="evaluation-item__date">${Utils.formatDateBR(ev.timestamp)}</span>
            <span class="evaluation-item__date">${Utils.getPeriodoLabel(ev.periodo)}</span>
          </div>
          <div class="evaluation-item__stars" title="Satisfação Geral: ${ev.satisfacaoGeral}">
            ${Utils.renderStars(ev.satisfacaoGeral)}
          </div>
        </div>

        <div class="evaluation-item__section">
          <div class="evaluation-item__section-title">Gestor - Pontos Positivos</div>
          <div class="evaluation-item__text">${escapeHtml(ev.gestorPositivos || '-')}</div>
        </div>

        <div class="evaluation-item__section">
          <div class="evaluation-item__section-title">Gestor - Pontos Negativos</div>
          <div class="evaluation-item__text">${escapeHtml(ev.gestorNegativos || '-')}</div>
        </div>

        <div class="evaluation-item__section">
          <div class="evaluation-item__section-title">Empresa ${Utils.renderStars(ev.empresaNota)}</div>
          <div class="evaluation-item__text">${escapeHtml(ev.empresaComentario || '-')}</div>
        </div>

        <div class="evaluation-item__section">
          <div class="evaluation-item__section-title">Sistemas/Ferramentas ${Utils.renderStars(ev.sistemaNota)}</div>
          <div class="evaluation-item__text">${escapeHtml(ev.sistemaComentario || '-')}</div>
        </div>
      </div>
    `;
  });

  container.innerHTML = html;
}

/* =============================================
   Exportação para CSV
   ============================================= */
function exportCSV() {
  const evaluations = window._currentEvaluations || Storage.getAllEvaluations();

  if (!evaluations || evaluations.length === 0) {
    alert('Não há dados para exportar.');
    return;
  }

  const csv = Storage.exportToCSV(evaluations);
  if (csv) {
    const timestamp = new Date().toISOString().split('T')[0];
    Utils.downloadFile(csv, `avaliacoes-360_${timestamp}.csv`, 'text/csv;charset=utf-8');
  }
}

/* =============================================
   Indicador de modo
   ============================================= */
function updateModeIndicator() {
  const indicator = document.getElementById('modeIndicator');
  if (!indicator) return;

  const mode = Config.getMode();
  if (mode === 'sheets' && Config.getScriptUrl()) {
    indicator.className = 'mode-badge mode-badge--sheets';
    indicator.innerHTML = '\u2601 Google Sheets';
  } else {
    indicator.className = 'mode-badge mode-badge--demo';
    indicator.innerHTML = '\u26a0 Modo Demo';
  }
}

/* =============================================
   Utilitário de segurança (anti-XSS)
   ============================================= */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* =============================================
   Sair do dashboard (limpa sessão)
   ============================================= */
function logout() {
  sessionStorage.removeItem('av360_authenticated');
  location.reload();
}
