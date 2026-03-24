# Avaliacao 360 - Sistema de Avaliacao para Tecnicos de Campo

Sistema web para digitalizar o processo de avaliacao 360 graus utilizado por tecnicos de campo. Substitui o formulario em papel por uma interface digital moderna, anonima e acessivel por celular.

## O Problema

Atualmente, os tecnicos de campo preenchem avaliacoes em papel sobre seus supervisores, a empresa e os sistemas/ferramentas de trabalho. Esse processo e lento, dificil de consolidar e nao garante o anonimato completo.

## A Solucao

Uma aplicacao web simples, gratuita e 100% anonima que permite:

- Tecnicos avaliarem seus gestores, a empresa e os sistemas
- Coordenadores e gestores visualizarem os resultados em um painel
- Exportacao de dados para CSV
- Armazenamento gratuito via Google Sheets

## Funcionalidades

- **Formulario anonimo**: Sem coleta de nome, e-mail ou qualquer dado pessoal
- **3 secoes de avaliacao**: Gestor imediato, empresa e sistemas/ferramentas
- **Notas com estrelas**: Sistema de rating de 1 a 5 estrelas
- **Dashboard administrativo**: Painel protegido por senha com graficos e filtros
- **Exportacao CSV**: Download dos dados em formato CSV compativel com Excel
- **Dois modos de operacao**:
  - **Modo Demo**: Dados armazenados localmente no navegador (localStorage)
  - **Modo Google Sheets**: Dados enviados para uma planilha do Google Sheets
- **Mobile-first**: Interface otimizada para celulares
- **Modo escuro**: Design profissional com tema escuro
- **Funciona offline**: localStorage como fallback automatico

## Como Usar

### Para Tecnicos (Formulario)

1. Acesse o link do formulario
2. Selecione sua equipe e o periodo
3. Preencha as avaliacoes com sinceridade
4. Clique em "Enviar Avaliacao"
5. Pronto! Sua avaliacao e completamente anonima

### Para Coordenadores (Dashboard)

1. Acesse a pagina do dashboard
2. Digite o codigo de acesso (padrao: `vivo360`)
3. Visualize as estatisticas, graficos e feedbacks
4. Use os filtros para segmentar por equipe ou periodo
5. Exporte os dados para CSV se necessario

### Configuracao do Google Sheets

1. Crie uma planilha no Google Sheets
2. Va em Extensoes > Apps Script
3. Cole o codigo do arquivo `google-apps-script.js`
4. Implante como App da Web (acesso: qualquer pessoa)
5. Copie a URL gerada
6. Acesse a pagina de configuracao do sistema e cole a URL
7. Teste a conexao e salve

## Estrutura do Projeto

```
avaliacao-360/
  index.html            - Formulario de avaliacao (tecnicos)
  dashboard.html        - Painel administrativo (coordenadores)
  setup.html            - Pagina de configuracao
  css/
    style.css           - Estilos compartilhados
  js/
    config.js           - Configuracao e armazenamento
    form.js             - Logica do formulario
    dashboard.js        - Logica do dashboard
  google-apps-script.js - Codigo para o Google Apps Script
  README.md             - Este arquivo
  .gitignore            - Arquivos ignorados pelo git
```

## Tecnologias

- HTML5, CSS3, JavaScript (Vanilla)
- Google Fonts (Inter)
- localStorage para armazenamento local
- Google Sheets + Apps Script para armazenamento na nuvem
- CSS Grid e Flexbox para layout responsivo
- Zero dependencias externas

## Seguranca e Privacidade

- Nenhum dado pessoal e coletado
- Sem cookies de rastreamento
- Sem fingerprinting
- Anonimato total garantido
- Dashboard protegido por senha

## Demo

Acesse a versao online: https://rodrigolsilvao.github.io/avaliacao-360/

## Licenca

Projeto desenvolvido para uso interno.
