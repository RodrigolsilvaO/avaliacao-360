// =============================================
// Avaliação 360 - Google Apps Script
// =============================================
// Este código deve ser colado no Google Apps Script
// da planilha que servirá como banco de dados.
//
// Como usar:
// 1. Crie uma planilha no Google Sheets
// 2. Vá em Extensões > Apps Script
// 3. Apague o conteúdo existente e cole este código
// 4. Clique em Implantar > Nova implantação
// 5. Selecione tipo: App da Web
// 6. Executar como: Eu mesmo
// 7. Quem pode acessar: Qualquer pessoa
// 8. Clique em Implantar e autorize
// 9. Copie a URL gerada e configure no sistema
//
// Cabeçalhos da planilha (primeira linha):
// A: Data
// B: Equipe
// C: Período
// D: Gestor - Pontos Positivos
// E: Gestor - Pontos Negativos
// F: Empresa - Comentário
// G: Empresa - Nota
// H: Sistema - Comentário
// I: Sistema - Nota
// J: Satisfação Geral
// =============================================

/**
 * Recebe avaliações via POST e salva na planilha
 * Chamado automaticamente quando o formulário envia dados
 */
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    // Adiciona uma nova linha com os dados da avaliação
    sheet.appendRow([
      new Date(),                    // Data/hora do envio
      data.equipe,                   // Equipe do técnico
      data.periodo,                  // Período avaliado
      data.gestorPositivos,          // Pontos positivos do gestor
      data.gestorNegativos,          // Pontos negativos do gestor
      data.empresaComentario,        // Comentário sobre a empresa
      data.empresaNota,              // Nota da empresa (1-5)
      data.sistemaComentario,        // Comentário sobre sistemas
      data.sistemaNota,              // Nota dos sistemas (1-5)
      data.satisfacaoGeral           // Satisfação geral (1-5)
    ]);

    // Retorna sucesso
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Avaliação salva com sucesso'
      }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Retorna erro caso algo dê errado
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Retorna todas as avaliações via GET
 * Usado pelo dashboard para exibir os dados
 */
function doGet(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = sheet.getDataRange().getValues();

    // Se a planilha estiver vazia ou só tiver cabeçalhos
    if (data.length <= 1) {
      return ContentService
        .createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = data[0];
    var rows = data.slice(1);

    // Converte cada linha em um objeto com os cabeçalhos como chaves
    var result = rows.map(function(row) {
      var obj = {};
      headers.forEach(function(header, i) {
        obj[header] = row[i];
      });
      return obj;
    });

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({
        status: 'error',
        message: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Função auxiliar para configurar os cabeçalhos automaticamente
 * Execute esta função manualmente uma vez para criar os cabeçalhos
 */
function setupHeaders() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var headers = [
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

  // Define os cabeçalhos na primeira linha
  var range = sheet.getRange(1, 1, 1, headers.length);
  range.setValues([headers]);

  // Formata os cabeçalhos (negrito e cor de fundo)
  range.setFontWeight('bold');
  range.setBackground('#8B5CF6');
  range.setFontColor('#FFFFFF');

  // Ajusta a largura das colunas
  sheet.setColumnWidth(1, 150);  // Data
  sheet.setColumnWidth(2, 100);  // Equipe
  sheet.setColumnWidth(3, 120);  // Período
  sheet.setColumnWidth(4, 300);  // Gestor Positivos
  sheet.setColumnWidth(5, 300);  // Gestor Negativos
  sheet.setColumnWidth(6, 300);  // Empresa Comentário
  sheet.setColumnWidth(7, 80);   // Empresa Nota
  sheet.setColumnWidth(8, 300);  // Sistema Comentário
  sheet.setColumnWidth(9, 80);   // Sistema Nota
  sheet.setColumnWidth(10, 100); // Satisfação Geral

  // Congela a primeira linha
  sheet.setFrozenRows(1);

  SpreadsheetApp.getUi().alert('Cabeçalhos configurados com sucesso!');
}
