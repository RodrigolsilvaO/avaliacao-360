/* =============================================
   Avaliação 360 - Configuração e Armazenamento
   Módulo compartilhado entre formulário e dashboard
   ============================================= */

const Config = {
  // Chaves de armazenamento local
  STORAGE_KEYS: {
    EVALUATIONS: 'av360_evaluations',
    SCRIPT_URL: 'av360_script_url',
    MODE: 'av360_mode', // 'demo' ou 'sheets'
    DASHBOARD_PASSWORD: 'av360_password'
  },

  // Senha padrão do dashboard
  DEFAULT_PASSWORD: 'vivo360',

  // Equipes disponíveis
  EQUIPES: [
    { value: 'equipe_a', label: 'Equipe A' },
    { value: 'equipe_b', label: 'Equipe B' },
    { value: 'equipe_c', label: 'Equipe C' },
    { value: 'equipe_d', label: 'Equipe D' },
    { value: 'equipe_v', label: 'Equipe V - VIP' },
    { value: 'equipe_f', label: 'Equipe F' }
  ],

  // Períodos (gera meses automaticamente)
  getPeriodos() {
    const meses = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const periodos = [];
    const anoAtual = new Date().getFullYear();

    // Gerar meses do ano atual e do próximo
    for (let ano = anoAtual; ano <= anoAtual + 1; ano++) {
      for (let mes = 0; mes < 12; mes++) {
        periodos.push({
          value: `${ano}-${String(mes + 1).padStart(2, '0')}`,
          label: `${meses[mes]} ${ano}`
        });
      }
    }
    return periodos;
  },

  // Verifica o modo atual (demo ou sheets)
  getMode() {
    return localStorage.getItem(this.STORAGE_KEYS.MODE) || 'demo';
  },

  // Define o modo
  setMode(mode) {
    localStorage.setItem(this.STORAGE_KEYS.MODE, mode);
  },

  // Obtém a URL do Google Apps Script
  getScriptUrl() {
    return localStorage.getItem(this.STORAGE_KEYS.SCRIPT_URL) || '';
  },

  // Salva a URL do Google Apps Script
  setScriptUrl(url) {
    localStorage.setItem(this.STORAGE_KEYS.SCRIPT_URL, url);
  },

  // Obtém a senha do dashboard
  getPassword() {
    return localStorage.getItem(this.STORAGE_KEYS.DASHBOARD_PASSWORD) || this.DEFAULT_PASSWORD;
  }
};

/* =============================================
   Módulo de armazenamento local (modo demo)
   ============================================= */
const Storage = {
  // Salva uma nova avaliação
  saveEvaluation(data) {
    const evaluations = this.getAllEvaluations();
    // Adiciona timestamp e ID único
    data.id = this._generateId();
    data.timestamp = new Date().toISOString();
    evaluations.push(data);
    localStorage.setItem(Config.STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));
    return data;
  },

  // Obtém todas as avaliações
  getAllEvaluations() {
    try {
      const stored = localStorage.getItem(Config.STORAGE_KEYS.EVALUATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Erro ao ler avaliações do localStorage:', e);
      return [];
    }
  },

  // Filtra avaliações por equipe e/ou período
  getFilteredEvaluations(filters = {}) {
    let evaluations = this.getAllEvaluations();

    if (filters.equipe && filters.equipe !== 'todas') {
      evaluations = evaluations.filter(e => e.equipe === filters.equipe);
    }

    if (filters.periodo && filters.periodo !== 'todos') {
      evaluations = evaluations.filter(e => e.periodo === filters.periodo);
    }

    // Ordena por data mais recente
    evaluations.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return evaluations;
  },

  // Calcula estatísticas
  getStatistics(evaluations) {
    if (!evaluations || evaluations.length === 0) {
      return {
        total: 0,
        mediaGeral: 0,
        mediaEmpresa: 0,
        mediaSistema: 0,
        porEquipe: {},
        distribuicaoEstrelas: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        esteMes: 0
      };
    }

    const total = evaluations.length;

    // Média geral de satisfação
    const somaGeral = evaluations.reduce((acc, e) => acc + (parseInt(e.satisfacaoGeral) || 0), 0);
    const mediaGeral = (somaGeral / total).toFixed(1);

    // Média empresa
    const somaEmpresa = evaluations.reduce((acc, e) => acc + (parseInt(e.empresaNota) || 0), 0);
    const mediaEmpresa = (somaEmpresa / total).toFixed(1);

    // Média sistema
    const somaSistema = evaluations.reduce((acc, e) => acc + (parseInt(e.sistemaNota) || 0), 0);
    const mediaSistema = (somaSistema / total).toFixed(1);

    // Médias por equipe
    const porEquipe = {};
    Config.EQUIPES.forEach(eq => {
      const avaliacoesDaEquipe = evaluations.filter(e => e.equipe === eq.value);
      if (avaliacoesDaEquipe.length > 0) {
        const soma = avaliacoesDaEquipe.reduce((acc, e) => acc + (parseInt(e.satisfacaoGeral) || 0), 0);
        porEquipe[eq.value] = {
          label: eq.label,
          media: (soma / avaliacoesDaEquipe.length).toFixed(1),
          total: avaliacoesDaEquipe.length
        };
      }
    });

    // Distribuição de estrelas (satisfação geral)
    const distribuicaoEstrelas = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    evaluations.forEach(e => {
      const nota = parseInt(e.satisfacaoGeral);
      if (nota >= 1 && nota <= 5) {
        distribuicaoEstrelas[nota]++;
      }
    });

    // Avaliações deste mês
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    const esteMes = evaluations.filter(e => {
      const dataAval = new Date(e.timestamp);
      const mesAval = `${dataAval.getFullYear()}-${String(dataAval.getMonth() + 1).padStart(2, '0')}`;
      return mesAval === mesAtual;
    }).length;

    return {
      total,
      mediaGeral,
      mediaEmpresa,
      mediaSistema,
      porEquipe,
      distribuicaoEstrelas,
      esteMes
    };
  },

  // Exporta avaliações para CSV
  exportToCSV(evaluations) {
    if (!evaluations || evaluations.length === 0) return null;

    const headers = [
      'Data',
      'Equipe',
      'Período',
      'Gestor - Pontos Positivos',
      'Gestor - Pontos Negativos',
      'Empresa - Comentário',
      'Empresa - Nota',
      'Sistema - Comentário',
      'Sistema - Nota',
      'Satisfação Geral'
    ];

    const rows = evaluations.map(e => [
      this._formatDate(e.timestamp),
      this._getEquipeLabel(e.equipe),
      e.periodo,
      `"${(e.gestorPositivos || '').replace(/"/g, '""')}"`,
      `"${(e.gestorNegativos || '').replace(/"/g, '""')}"`,
      `"${(e.empresaComentario || '').replace(/"/g, '""')}"`,
      e.empresaNota,
      `"${(e.sistemaComentario || '').replace(/"/g, '""')}"`,
      e.sistemaNota,
      e.satisfacaoGeral
    ]);

    // BOM para codificação UTF-8 no Excel
    const bom = '\uFEFF';
    const csv = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    return csv;
  },

  // Gera ID único simples
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  // Formata data para exibição
  _formatDate(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Obtém o label da equipe pelo valor
  _getEquipeLabel(value) {
    const equipe = Config.EQUIPES.find(e => e.value === value);
    return equipe ? equipe.label : value;
  }
};

/* =============================================
   Módulo de integração com Google Sheets
   ============================================= */
const SheetsAPI = {
  // Envia avaliação para o Google Sheets
  async sendEvaluation(data) {
    const url = Config.getScriptUrl();
    if (!url) {
      throw new Error('URL do Google Apps Script não configurada');
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        mode: 'no-cors', // Google Apps Script requer no-cors
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      // Com no-cors, não conseguimos ler a resposta, mas a requisição foi enviada
      return { status: 'success' };
    } catch (error) {
      console.error('Erro ao enviar para Google Sheets:', error);
      throw error;
    }
  },

  // Busca avaliações do Google Sheets
  async fetchEvaluations() {
    const url = Config.getScriptUrl();
    if (!url) {
      throw new Error('URL do Google Apps Script não configurada');
    }

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Erro na resposta');
      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar dados do Google Sheets:', error);
      throw error;
    }
  },

  // Testa a conexão com o Google Sheets
  async testConnection() {
    try {
      const data = await this.fetchEvaluations();
      return { success: true, message: `Conectado! ${Array.isArray(data) ? data.length : 0} registros encontrados.` };
    } catch (error) {
      return { success: false, message: `Erro: ${error.message}` };
    }
  }
};

/* =============================================
   Utilitários
   ============================================= */
const Utils = {
  // Renderiza estrelas como texto
  renderStars(rating) {
    const filled = parseInt(rating) || 0;
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += i <= filled ? '\u2605' : '\u2606';
    }
    return stars;
  },

  // Descrição textual da nota
  getRatingText(rating) {
    const textos = {
      1: 'Muito Insatisfeito',
      2: 'Insatisfeito',
      3: 'Neutro',
      4: 'Satisfeito',
      5: 'Muito Satisfeito'
    };
    return textos[rating] || '';
  },

  // Formata data ISO para exibição PT-BR
  formatDateBR(isoString) {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Download de arquivo
  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  // Obtém label da equipe
  getEquipeLabel(value) {
    const equipe = Config.EQUIPES.find(e => e.value === value);
    return equipe ? equipe.label : value || '-';
  },

  // Obtém label do período
  getPeriodoLabel(value) {
    const periodos = Config.getPeriodos();
    const periodo = periodos.find(p => p.value === value);
    return periodo ? periodo.label : value || '-';
  }
};
