/* =============================================
   Avaliação 360 - Lógica do Formulário
   Página principal para técnicos de campo
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
  initForm();
});

function initForm() {
  populateDropdowns();
  setupStarRatings();
  setupFormSubmission();
  updateModeIndicator();
}

/* =============================================
   Preenche os selects de equipe e período
   ============================================= */
function populateDropdowns() {
  // Dropdown de equipes
  const equipeSelect = document.getElementById('equipe');
  if (equipeSelect) {
    Config.EQUIPES.forEach(eq => {
      const option = document.createElement('option');
      option.value = eq.value;
      option.textContent = eq.label;
      equipeSelect.appendChild(option);
    });
  }

  // Dropdown de períodos
  const periodoSelect = document.getElementById('periodo');
  if (periodoSelect) {
    const periodos = Config.getPeriodos();
    // Seleciona o mês atual por padrão
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;

    periodos.forEach(p => {
      const option = document.createElement('option');
      option.value = p.value;
      option.textContent = p.label;
      if (p.value === mesAtual) {
        option.selected = true;
      }
      periodoSelect.appendChild(option);
    });
  }
}

/* =============================================
   Configura o sistema de estrelas interativo
   ============================================= */
function setupStarRatings() {
  const starGroups = document.querySelectorAll('.star-rating');

  starGroups.forEach(group => {
    const inputs = group.querySelectorAll('input[type="radio"]');
    const valueDisplay = group.parentElement.querySelector('.star-value');

    inputs.forEach(input => {
      input.addEventListener('change', () => {
        const rating = parseInt(input.value);
        if (valueDisplay) {
          valueDisplay.textContent = Utils.getRatingText(rating);
        }
        // Remove estado de erro ao selecionar
        group.classList.remove('error');
        group.closest('.form-group')?.classList.remove('error');
      });
    });
  });
}

/* =============================================
   Configura o envio do formulário
   ============================================= */
function setupFormSubmission() {
  const form = document.getElementById('evaluationForm');
  const submitBtn = document.getElementById('submitBtn');

  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validação
    if (!validateForm()) return;

    // Desabilita o botão para evitar duplicatas
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Enviando...';

    // Coleta os dados
    const data = collectFormData();

    try {
      // Salva localmente (sempre, como backup)
      Storage.saveEvaluation({ ...data });

      // Se estiver no modo Google Sheets, envia também para lá
      if (Config.getMode() === 'sheets' && Config.getScriptUrl()) {
        try {
          await SheetsAPI.sendEvaluation(data);
        } catch (sheetsError) {
          // Se falhar no Sheets, os dados já estão salvos localmente
          console.warn('Falha ao enviar para Google Sheets (dados salvos localmente):', sheetsError);
        }
      }

      // Mostra tela de sucesso
      showSuccessScreen();
    } catch (error) {
      console.error('Erro ao salvar avaliação:', error);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Enviar Avaliação';
      alert('Erro ao enviar. Por favor, tente novamente.');
    }
  });
}

/* =============================================
   Validação do formulário
   ============================================= */
function validateForm() {
  let isValid = true;

  // Limpa erros anteriores
  document.querySelectorAll('.form-group.error').forEach(el => {
    el.classList.remove('error');
  });

  // Valida equipe
  const equipe = document.getElementById('equipe');
  if (!equipe.value) {
    markError(equipe, 'Selecione sua equipe');
    isValid = false;
  }

  // Valida período
  const periodo = document.getElementById('periodo');
  if (!periodo.value) {
    markError(periodo, 'Selecione o período');
    isValid = false;
  }

  // Valida textarea do gestor - pontos positivos
  const gestorPositivos = document.getElementById('gestorPositivos');
  if (!gestorPositivos.value.trim()) {
    markError(gestorPositivos, 'Preencha os pontos positivos');
    isValid = false;
  }

  // Valida textarea do gestor - pontos negativos
  const gestorNegativos = document.getElementById('gestorNegativos');
  if (!gestorNegativos.value.trim()) {
    markError(gestorNegativos, 'Preencha os pontos negativos');
    isValid = false;
  }

  // Valida comentário da empresa
  const empresaComentario = document.getElementById('empresaComentario');
  if (!empresaComentario.value.trim()) {
    markError(empresaComentario, 'Preencha sua avaliação da empresa');
    isValid = false;
  }

  // Valida nota da empresa
  const empresaNota = document.querySelector('input[name="empresaNota"]:checked');
  if (!empresaNota) {
    const starGroup = document.getElementById('starsEmpresa');
    if (starGroup) {
      starGroup.classList.add('error');
      starGroup.closest('.form-group')?.classList.add('error');
    }
    isValid = false;
  }

  // Valida comentário do sistema
  const sistemaComentario = document.getElementById('sistemaComentario');
  if (!sistemaComentario.value.trim()) {
    markError(sistemaComentario, 'Preencha sua avaliação dos sistemas');
    isValid = false;
  }

  // Valida nota do sistema
  const sistemaNota = document.querySelector('input[name="sistemaNota"]:checked');
  if (!sistemaNota) {
    const starGroup = document.getElementById('starsSistema');
    if (starGroup) {
      starGroup.classList.add('error');
      starGroup.closest('.form-group')?.classList.add('error');
    }
    isValid = false;
  }

  // Valida satisfação geral
  const satisfacaoGeral = document.querySelector('input[name="satisfacaoGeral"]:checked');
  if (!satisfacaoGeral) {
    const starGroup = document.getElementById('starsGeral');
    if (starGroup) {
      starGroup.classList.add('error');
      starGroup.closest('.form-group')?.classList.add('error');
    }
    isValid = false;
  }

  // Scrolla até o primeiro erro
  if (!isValid) {
    const firstError = document.querySelector('.form-group.error');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  return isValid;
}

/* Marca um campo como inválido */
function markError(element, message) {
  const group = element.closest('.form-group');
  if (group) {
    group.classList.add('error');
    const errorMsg = group.querySelector('.error-message');
    if (errorMsg) {
      errorMsg.textContent = message;
    }
  }
}

/* =============================================
   Coleta os dados do formulário
   ============================================= */
function collectFormData() {
  return {
    equipe: document.getElementById('equipe').value,
    periodo: document.getElementById('periodo').value,
    gestorPositivos: document.getElementById('gestorPositivos').value.trim(),
    gestorNegativos: document.getElementById('gestorNegativos').value.trim(),
    empresaComentario: document.getElementById('empresaComentario').value.trim(),
    empresaNota: document.querySelector('input[name="empresaNota"]:checked')?.value || '',
    sistemaComentario: document.getElementById('sistemaComentario').value.trim(),
    sistemaNota: document.querySelector('input[name="sistemaNota"]:checked')?.value || '',
    satisfacaoGeral: document.querySelector('input[name="satisfacaoGeral"]:checked')?.value || ''
  };
}

/* =============================================
   Tela de sucesso após envio
   ============================================= */
function showSuccessScreen() {
  const form = document.getElementById('evaluationForm');
  const success = document.getElementById('successScreen');

  if (form) form.style.display = 'none';
  if (success) success.classList.add('visible');

  // Scroll para o topo
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Reinicia o formulário para nova avaliação */
function resetForm() {
  const form = document.getElementById('evaluationForm');
  const success = document.getElementById('successScreen');

  if (success) success.classList.remove('visible');
  if (form) {
    form.style.display = 'block';
    form.reset();
    // Reseleciona o mês atual
    const agora = new Date();
    const mesAtual = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`;
    const periodoSelect = document.getElementById('periodo');
    if (periodoSelect) periodoSelect.value = mesAtual;
  }

  // Limpa displays de valor das estrelas
  document.querySelectorAll('.star-value').forEach(el => {
    el.textContent = '';
  });

  // Reabilita o botão de envio
  const submitBtn = document.getElementById('submitBtn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = 'Enviar Avaliação';
  }

  // Limpa erros
  document.querySelectorAll('.form-group.error').forEach(el => {
    el.classList.remove('error');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* =============================================
   Indicador de modo (demo/sheets)
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

/* Remove erros ao interagir com campos */
document.addEventListener('input', (e) => {
  const group = e.target.closest('.form-group');
  if (group && group.classList.contains('error')) {
    group.classList.remove('error');
  }
});

document.addEventListener('change', (e) => {
  const group = e.target.closest('.form-group');
  if (group && group.classList.contains('error')) {
    group.classList.remove('error');
  }
});
