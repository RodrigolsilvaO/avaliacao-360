/* =============================================
   Avaliacao 360 - Configuracao e Armazenamento
   Modulo compartilhado entre formulario e dashboard
   ============================================= */

const Config = {
  // Chaves de armazenamento local
  STORAGE_KEYS: {
    EVALUATIONS: 'av360_evaluations',
    FORMSPREE_ENDPOINT: 'av360_formspree_endpoint',
    MODE: 'av360_mode', // 'demo' ou 'formspree'
    DASHBOARD_PASSWORD: 'av360_password'
  },

  // Senha padrao do dashboard
  DEFAULT_PASSWORD: 'vivo360',

  // Equipes disponiveis
  EQUIPES: [
    { value: 'equipe_a', label: 'Equipe A' },
    { value: 'equipe_b', label: 'Equipe B' },
    { value: 'equipe_c', label: 'Equipe C' },
    { value: 'equipe_d', label: 'Equipe D' },
    { value: 'equipe_v', label: 'Equipe V - VIP' },
    { value: 'equipe_f', label: 'Equipe F' }
  ],

  // Periodos (gera meses automaticamente)
  getPeriodos() {
    const meses = [
      'Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const periodos = [];
    const anoAtual = new Date().getFullYear();

    // Gerar meses do ano atual e do proximo
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

  // Verifica o modo atual (demo ou formspree)
  getMode() {
    return localStorage.getItem(this.STORAGE_KEYS.MODE) || 'demo';
  },

  // Define o modo
  setMode(mode) {
    localStorage.setItem(this.STORAGE_KEYS.MODE, mode);
  },

  // Obtem a senha do dashboard
  getPassword() {
    return localStorage.getItem(this.STORAGE_KEYS.DASHBOARD_PASSWORD) || this.DEFAULT_PASSWORD;
  }
};

/* =============================================
   Modulo de armazenamento local (modo demo)
   ============================================= */
const Storage = {
  // Salva uma nova avaliacao
  saveEvaluation(data) {
    const evaluations = this.getAllEvaluations();
    // Adiciona timestamp e ID unico
    data.id = this._generateId();
    data.timestamp = new Date().toISOString();
    evaluations.push(data);
    localStorage.setItem(Config.STORAGE_KEYS.EVALUATIONS, JSON.stringify(evaluations));
    return data;
  },

  // Obtem todas as avaliacoes
  getAllEvaluations() {
    try {
      const stored = localStorage.getItem(Config.STORAGE_KEYS.EVALUATIONS);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Erro ao ler avaliacoes do localStorage:', e);
      return [];
    }
  },

  // Importa avaliacoes de JSON (para dados exportados do Formspree)
  importEvaluations(jsonData) {
    try {
      let imported;
      if (typeof jsonData === 'string') {
        imported = JSON.parse(jsonData);
      } else {
        imported = jsonData;
      }

      if (!Array.isArray(imported)) {
        imported = [imported];
      }

      const existing = this.getAllEvaluations();
      const existingIds = new Set(existing.map(e => e.id));

      let addedCount = 0;
      imported.forEach(item => {
        // Atribui ID se nao tiver
        if (!item.id) {
          item.id = this._generateId();
        }
        // Evita duplicatas
        if (!existingIds.has(item.id)) {
          if (!item.timestamp) {
            item.timestamp = new Date().toISOString();
          }
          existing.push(item);
          existingIds.add(item.id);
          addedCount++;
        }
      });

      localStorage.setItem(Config.STORAGE_KEYS.EVALUATIONS, JSON.stringify(existing));
      return { success: true, added: addedCount, total: existing.length };
    } catch (e) {
      console.error('Erro ao importar dados:', e);
      return { success: false, error: e.message };
    }
  },

  // Filtra avaliacoes por equipe e/ou periodo
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

  // Calcula estatisticas
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

    // Media geral de satisfacao
    const somaGeral = evaluations.reduce((acc, e) => acc + (parseInt(e.satisfacaoGeral) || 0), 0);
    const mediaGeral = (somaGeral / total).toFixed(1);

    // Media empresa
    const somaEmpresa = evaluations.reduce((acc, e) => acc + (parseInt(e.empresaNota) || 0), 0);
    const mediaEmpresa = (somaEmpresa / total).toFixed(1);

    // Media sistema
    const somaSistema = evaluations.reduce((acc, e) => acc + (parseInt(e.sistemaNota) || 0), 0);
    const mediaSistema = (somaSistema / total).toFixed(1);

    // Medias por equipe
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

    // Distribuicao de estrelas (satisfacao geral)
    const distribuicaoEstrelas = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    evaluations.forEach(e => {
      const nota = parseInt(e.satisfacaoGeral);
      if (nota >= 1 && nota <= 5) {
        distribuicaoEstrelas[nota]++;
      }
    });

    // Avaliacoes deste mes
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

  // Exporta avaliacoes para CSV
  exportToCSV(evaluations) {
    if (!evaluations || evaluations.length === 0) return null;

    const headers = [
      'Data',
      'Equipe',
      'Periodo',
      'Gestor - Pontos Positivos',
      'Gestor - Pontos Negativos',
      'Empresa - Comentario',
      'Empresa - Nota',
      'Sistema - Comentario',
      'Sistema - Nota',
      'Satisfacao Geral'
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

    // BOM para codificacao UTF-8 no Excel
    const bom = '\uFEFF';
    const csv = bom + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    return csv;
  },

  // Gera ID unico simples
  _generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  // Formata data para exibicao
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

  // Obtem o label da equipe pelo valor
  _getEquipeLabel(value) {
    const equipe = Config.EQUIPES.find(e => e.value === value);
    return equipe ? equipe.label : value;
  }
};

/* =============================================
   Modulo de integracao com Formspree
   ============================================= */
const FormspreeAPI = {
  getEndpoint() {
    return localStorage.getItem(Config.STORAGE_KEYS.FORMSPREE_ENDPOINT) || '';
  },

  setEndpoint(endpoint) {
    localStorage.setItem(Config.STORAGE_KEYS.FORMSPREE_ENDPOINT, endpoint);
  },

  isConfigured() {
    return !!this.getEndpoint();
  },

  async submit(data) {
    const endpoint = this.getEndpoint();
    if (!endpoint) throw new Error('Formspree nao configurado');

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao enviar para Formspree');
    }
    return response.json();
  },

  async testConnection() {
    const endpoint = this.getEndpoint();
    if (!endpoint) {
      return { success: false, message: 'Endpoint nao configurado' };
    }

    try {
      // Envia um dado de teste
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: 'Teste de Conexao - Avaliacao 360',
          teste: true,
          mensagem: 'Este e um teste de conexao do sistema Avaliacao 360.'
        })
      });

      if (response.ok) {
        return { success: true, message: 'Conexao bem-sucedida! O Formspree esta configurado corretamente.' };
      } else {
        const errorData = await response.json().catch(() => ({}));
        return { success: false, message: `Erro: ${errorData.error || response.statusText}` };
      }
    } catch (error) {
      return { success: false, message: `Erro de conexao: ${error.message}` };
    }
  }
};

/* =============================================
   Utilitarios
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

  // Descricao textual da nota
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

  // Formata data ISO para exibicao PT-BR
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

  // Obtem label da equipe
  getEquipeLabel(value) {
    const equipe = Config.EQUIPES.find(e => e.value === value);
    return equipe ? equipe.label : value || '-';
  },

  // Obtem label do periodo
  getPeriodoLabel(value) {
    const periodos = Config.getPeriodos();
    const periodo = periodos.find(p => p.value === value);
    return periodo ? periodo.label : value || '-';
  }
};
