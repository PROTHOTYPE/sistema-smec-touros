import { Demand, Sector, SectorStats } from '../../types';

/**
 * Sanitiza strings dinâmicas contra ataques de Cross-Site Scripting (Stored/Reflected XSS)
 * antes da interpolação no documento HTML/PDF.
 */
export const escapeHtml = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * Valida URLs de imagem (permite apenas https://, http:// ou data:image/) e escapa atributos.
 */
const sanitizeImageUrl = (url?: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    /^https?:\/\//i.test(trimmed) ||
    /^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/i.test(trimmed)
  ) {
    return escapeHtml(trimmed);
  }
  return '';
};

interface GenerateReportHtmlProps {
  sector: Sector;
  year: number;
  demands: Demand[];
  stats: SectorStats;
  municipioNome?: string;
  secretariaNome?: string;
  dataEmissao?: string;
  logoPrefeituraUrl?: string;
  logoSmecUrl?: string;
  executiveLeaderName?: string;
  executiveLeaderRole?: string;
}

export const generateReportHtml = ({
  sector,
  year,
  demands,
  stats,
  municipioNome = 'PREFEITURA MUNICIPAL DE TOUROS',
  secretariaNome = 'SECRETARIA MUNICIPAL DE EDUCAÇÃO E CULTURA',
  dataEmissao = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
  logoPrefeituraUrl,
  logoSmecUrl,
  executiveLeaderName = 'Titular da Pasta (A definir)',
  executiveLeaderRole = 'Secretaria Municipal de Educação e Cultura',
}: GenerateReportHtmlProps): string => {
  const concluidas = demands.filter(d => d.status === 'concluida');
  const parciais = demands.filter(d => d.status === 'parcial');
  const naoConcluidas = demands.filter(d => d.status === 'nao_concluida');
  const oficios = demands.filter(d => d.originType === 'oficio_formal');

  const safeSectorName = escapeHtml(sector.name);
  const safeSectorCode = escapeHtml(sector.code);
  const safeCoordinatorName = escapeHtml(sector.coordinatorName);
  const safeCoordinatorRole = escapeHtml(sector.coordinatorRole);
  const safeSectorDescription = escapeHtml(sector.description);
  const safeSectorEmail = escapeHtml(sector.email);
  const safeSectorPhone = escapeHtml(sector.phone);
  const safeMunicipioNome = escapeHtml(municipioNome);
  const safeSecretariaNome = escapeHtml(secretariaNome);
  const safeDataEmissao = escapeHtml(dataEmissao);
  const safeExecutiveLeaderName = escapeHtml(executiveLeaderName);
  const safeExecutiveLeaderRole = escapeHtml(executiveLeaderRole);
  const safeYear = escapeHtml(year);
  const safeLogoPrefeitura = sanitizeImageUrl(logoPrefeituraUrl);
  const safeLogoSmec = sanitizeImageUrl(logoSmecUrl);

  const formatOriginLabel = (origin: string) => {
    switch (origin) {
      case 'oficio_formal':
        return 'Ofício Formal (Admin/RH)';
      case 'atribuida_admin':
        return 'Atribuída por Admin/RH';
      case 'direta_setor':
        return 'Ação Direta do Setor';
      default:
        return escapeHtml(origin);
    }
  };

  const formatPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgente': return 'Urgente';
      case 'alta': return 'Alta';
      case 'media': return 'Média';
      default: return 'Baixa';
    }
  };

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data: https: http:; font-src 'self' data:;">
  <title>Relatório Anual de Gestão - ${safeSectorName} (${safeYear})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 14mm 14mm 14mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.45;
      font-size: 10.5pt;
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    .page-header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      flex-wrap: nowrap;
      width: 100%;
      border-bottom: 2.5px solid #1e40af;
      padding-bottom: 12px;
      margin-bottom: 16px;
    }
    .header-logo-left, .header-logo-right {
      width: 55px;
      height: 55px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .header-logo-img {
      width: 55px;
      height: 55px;
      object-fit: contain;
    }
    .header-titles {
      flex: 1;
      text-align: center;
      padding: 0 8px;
    }
    .header-titles h1 {
      font-size: 13pt;
      margin: 0 0 2px 0;
      color: #0f172a;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    .header-titles h2 {
      font-size: 11pt;
      margin: 0 0 2px 0;
      color: #1e40af;
      font-weight: 700;
      text-transform: uppercase;
    }
    .header-titles h3 {
      font-size: 9.5pt;
      margin: 0;
      color: #475569;
      font-weight: 600;
    }
    .report-badge {
      display: inline-block;
      background-color: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
      padding: 3px 12px;
      border-radius: 9999px;
      font-size: 9pt;
      font-weight: 700;
      margin-top: 6px;
    }
    .meta-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 16px;
      display: grid;
      grid-template-columns: 2fr 1.2fr;
      gap: 12px;
    }
    .meta-box p {
      margin: 2px 0;
      font-size: 9pt;
    }
    .meta-box strong {
      color: #1e293b;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-bottom: 18px;
    }
    .stat-card {
      background-color: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      text-align: center;
    }
    .stat-value {
      font-size: 15pt;
      font-weight: 800;
      color: #1e40af;
      margin-bottom: 1px;
    }
    .stat-label {
      font-size: 7.5pt;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
    }
    .stat-success .stat-value { color: #15803d; }
    .stat-warning .stat-value { color: #b45309; }
    .stat-danger .stat-value { color: #b91c1c; }

    .section-title {
      font-size: 10.5pt;
      font-weight: 800;
      color: #0f172a;
      border-left: 4px solid #1e40af;
      padding-left: 8px;
      margin-top: 18px;
      margin-bottom: 10px;
      text-transform: uppercase;
      letter-spacing: 0.2px;
    }
    .section-title.warning { border-left-color: #f59e0b; }
    .section-title.danger { border-left-color: #ef4444; }
    .section-title.purple { border-left-color: #1e40af; }

    table.data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 8.5pt;
    }
    table.data-table th {
      background-color: #f1f5f9;
      color: #1e293b;
      font-weight: 700;
      text-align: left;
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      font-size: 8pt;
    }
    table.data-table td {
      padding: 6px 8px;
      border: 1px solid #cbd5e1;
      vertical-align: top;
    }
    table.data-table tr:nth-child(even) td {
      background-color: #f8fafc;
    }
    .tag {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
    }
    .tag-concluida { background: #dcfce7; color: #15803d; }
    .tag-parcial { background: #fef3c7; color: #b45309; }
    .tag-nao-concluida { background: #fee2e2; color: #b91c1c; }
    
    .detail-card {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 9px 12px;
      margin-bottom: 8px;
      page-break-inside: avoid;
    }
    .detail-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 4px;
      font-size: 9pt;
    }
    .detail-title {
      font-weight: 700;
      color: #0f172a;
    }
    .detail-protocol {
      color: #64748b;
      font-weight: 600;
      font-family: monospace;
      font-size: 8pt;
    }
    .detail-text {
      font-size: 8.5pt;
      color: #334155;
      margin: 3px 0;
    }
    .detail-highlight {
      background-color: #f0fdf4;
      border-left: 3px solid #15803d;
      padding: 5px 8px;
      margin-top: 5px;
      border-radius: 0 4px 4px 0;
      font-size: 8.2pt;
      color: #14532d;
    }
    .detail-bottleneck {
      background-color: #fffbeb;
      border-left: 3px solid #f59e0b;
      padding: 5px 8px;
      margin-top: 5px;
      border-radius: 0 4px 4px 0;
      font-size: 8.2pt;
      color: #78350f;
    }
    .detail-impediment {
      background-color: #fef2f2;
      border-left: 3px solid #ef4444;
      padding: 5px 8px;
      margin-top: 5px;
      border-radius: 0 4px 4px 0;
      font-size: 8.2pt;
      color: #7f1d1d;
    }

    .signature-section {
      margin-top: 35px;
      page-break-inside: avoid;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 35px;
      text-align: center;
    }
    .signature-line {
      border-top: 1px solid #475569;
      margin-bottom: 5px;
    }
    .signature-name {
      font-weight: 700;
      font-size: 9pt;
      color: #0f172a;
    }
    .signature-role {
      font-size: 8pt;
      color: #64748b;
    }
    .footer-note {
      text-align: center;
      margin-top: 24px;
      font-size: 7.5pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
  </style>
</head>
<body>

  <!-- Cabeçalho Oficial com Logos -->
  <div class="page-header">
    <div class="header-logo-left">
      ${safeLogoPrefeitura 
        ? `<img src="${safeLogoPrefeitura}" class="header-logo-img" alt="Prefeitura de Touros" />` 
        : `<svg width="48" height="48" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#1e40af" /><text x="50" y="55" font-size="28" fill="#fde047" text-anchor="middle" font-weight="bold">PMT</text></svg>`}
    </div>

    <div class="header-titles">
      <h1>${safeMunicipioNome}</h1>
      <h2>${safeSecretariaNome}</h2>
      <h3>ESTADO DO RIO GRANDE DO NORTE — SISTEMA SMEC GESTÃO</h3>
      <div class="report-badge">RELATÓRIO ANUAL DE PRESTAÇÃO DE CONTAS • EXERCÍCIO ${safeYear}</div>
    </div>

    <div class="header-logo-right">
      ${safeLogoSmec 
        ? `<img src="${safeLogoSmec}" class="header-logo-img" alt="SMEC Touros" />` 
        : `<svg width="48" height="48" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="#0284c7" /><text x="50" y="55" font-size="24" fill="#ffffff" text-anchor="middle" font-weight="bold">SMEC</text></svg>`}
    </div>
  </div>

  <!-- Identificação do Setor -->
  <div class="meta-box">
    <div>
      <p><strong>Setor / Coordenadoria:</strong> ${safeSectorName} (${safeSectorCode})</p>
      <p><strong>Coordenador Responsável:</strong> ${safeCoordinatorName} — <em>${safeCoordinatorRole}</em></p>
      <p><strong>Competência Institucional:</strong> ${safeSectorDescription}</p>
    </div>
    <div style="text-align: right;">
      <p><strong>Emissão:</strong> ${safeDataEmissao}</p>
      <p><strong>Contato:</strong> ${safeSectorEmail}</p>
      <p><strong>Telefone:</strong> ${safeSectorPhone}</p>
    </div>
  </div>

  <!-- Métricas Consolidadas -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="stat-value">${escapeHtml(stats.total)}</div>
      <div class="stat-label">Total de Demandas</div>
    </div>
    <div class="stat-card stat-success">
      <div class="stat-value">${escapeHtml(stats.concluidas)}</div>
      <div class="stat-label">100% Concluídas (${escapeHtml(stats.taxaConclusao)}%)</div>
    </div>
    <div class="stat-card stat-warning">
      <div class="stat-value">${escapeHtml(stats.parciais)}</div>
      <div class="stat-label">Resoluções Parciais</div>
    </div>
    <div class="stat-card stat-danger">
      <div class="stat-value">${escapeHtml(stats.naoConcluidas)}</div>
      <div class="stat-label">Não Concluídas</div>
    </div>
  </div>

  <!-- Seção 1: Demandas 100% Concluídas -->
  <div class="section-title">1. Ações e Demandas 100% Concluídas (${concluidas.length})</div>
  ${concluidas.length === 0 ? '<p style="font-size: 8.5pt; color: #64748b; font-style: italic;">Nenhuma demanda concluída no período.</p>' : ''}
  ${concluidas.map(d => `
    <div class="detail-card">
      <div class="detail-header">
        <span class="detail-title">${escapeHtml(d.title)}</span>
        <span class="detail-protocol">${escapeHtml(d.protocolNumber)} | <span class="tag tag-concluida">Concluída</span></span>
      </div>
      <div class="detail-text"><strong>Origem:</strong> ${formatOriginLabel(d.originType)} | <strong>Prioridade:</strong> ${formatPriorityLabel(d.priority)} ${d.oficioNumber ? `| <strong>Ref:</strong> ${escapeHtml(d.oficioNumber)}` : ''}</div>
      <div class="detail-text"><strong>Descrição:</strong> ${escapeHtml(d.description)}</div>
      ${d.resolutionSummary ? `
        <div class="detail-highlight">
          <strong>Relato da Execução / Resultado:</strong> ${escapeHtml(d.resolutionSummary)}
        </div>
      ` : ''}
    </div>
  `).join('')}

  <!-- Seção 2: Demandas Parciais -->
  <div class="section-title warning">2. Demandas com Resolução Parcial (${parciais.length})</div>
  ${parciais.length === 0 ? '<p style="font-size: 8.5pt; color: #64748b; font-style: italic;">Nenhuma demanda em resolução parcial no período.</p>' : ''}
  ${parciais.map(d => `
    <div class="detail-card">
      <div class="detail-header">
        <span class="detail-title">${escapeHtml(d.title)}</span>
        <span class="detail-protocol">${escapeHtml(d.protocolNumber)} | <span class="tag tag-parcial">Parcial</span></span>
      </div>
      <div class="detail-text"><strong>Origem:</strong> ${formatOriginLabel(d.originType)} ${d.oficioNumber ? `| <strong>Ref:</strong> ${escapeHtml(d.oficioNumber)}` : ''}</div>
      <div class="detail-text"><strong>Descrição:</strong> ${escapeHtml(d.description)}</div>
      ${d.resolutionSummary ? `
        <div class="detail-highlight">
          <strong>O que já foi executado:</strong> ${escapeHtml(d.resolutionSummary)}
        </div>
      ` : ''}
      ${d.bottleneckReason ? `
        <div class="detail-bottleneck">
          <strong>Gargalo / Pendência Restante:</strong> ${escapeHtml(d.bottleneckReason)}
        </div>
      ` : ''}
    </div>
  `).join('')}

  <!-- Seção 3: Demandas Não Concluídas -->
  <div class="section-title danger">3. Demandas Não Concluídas / Impedimento Formal (${naoConcluidas.length})</div>
  ${naoConcluidas.length === 0 ? '<p style="font-size: 8.5pt; color: #64748b; font-style: italic;">Nenhum impedimento não concluído registrado no exercício.</p>' : ''}
  ${naoConcluidas.map(d => `
    <div class="detail-card">
      <div class="detail-header">
        <span class="detail-title">${escapeHtml(d.title)}</span>
        <span class="detail-protocol">${escapeHtml(d.protocolNumber)} | <span class="tag tag-nao-concluida">Não Concluída</span></span>
      </div>
      <div class="detail-text"><strong>Origem:</strong> ${formatOriginLabel(d.originType)} | <strong>Data de Registro:</strong> ${escapeHtml(new Date(d.createdAt).toLocaleDateString('pt-BR'))}</div>
      <div class="detail-text"><strong>Descrição da Solicitação:</strong> ${escapeHtml(d.description)}</div>
      <div class="detail-impediment">
        <strong>Motivo Formal do Impedimento:</strong> ${escapeHtml(d.impedimentReason || 'Impedimento técnico registrado pelo setor.')}
      </div>
    </div>
  `).join('')}

  <!-- Seção 4: Relação de Ofícios Formais Tramitados -->
  <div class="section-title purple">4. Relação de Ofícios Formais Tramitados no Setor (${oficios.length})</div>
  ${oficios.length === 0 ? '<p style="font-size: 8.5pt; color: #64748b; font-style: italic;">Nenhum ofício formal protocolado para este setor no período.</p>' : `
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 20%;">Nº do Ofício</th>
          <th style="width: 25%;">Órgão Remetente</th>
          <th style="width: 32%;">Objeto / Assunto</th>
          <th style="width: 12%;">Entrada</th>
          <th style="width: 11%;">Status</th>
        </tr>
      </thead>
      <tbody>
        ${oficios.map(o => `
          <tr>
            <td><strong>${escapeHtml(o.oficioNumber || o.protocolNumber)}</strong></td>
            <td>${escapeHtml(o.oficioSender || 'Admin / RH')}</td>
            <td>${escapeHtml(o.title)}</td>
            <td>${escapeHtml(o.oficioPhysicalDate ? new Date(o.oficioPhysicalDate).toLocaleDateString('pt-BR') : new Date(o.createdAt).toLocaleDateString('pt-BR'))}</td>
            <td>
              <span class="tag ${o.status === 'concluida' ? 'tag-concluida' : o.status === 'parcial' ? 'tag-parcial' : 'tag-nao-concluida'}">
                ${escapeHtml(o.status.toUpperCase())}
              </span>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `}

  <!-- Termo de Assinatura Oficial -->
  <div class="signature-section">
    <div>
      <div class="signature-line"></div>
      <div class="signature-name">${safeCoordinatorName}</div>
      <div class="signature-role">${safeCoordinatorRole}</div>
      <div class="signature-role">${safeSectorName}</div>
    </div>
    <div>
      <div class="signature-line"></div>
      <div class="signature-name">${safeExecutiveLeaderName}</div>
      <div class="signature-role">${safeExecutiveLeaderRole}</div>
      <div class="signature-role">Prefeitura Municipal de Touros / RN</div>
    </div>
  </div>

  <div class="footer-note">
    Documento oficial gerado eletronicamente em ${safeDataEmissao} via Sistema SMEC Gestão Interna — Município de Touros/RN.
  </div>

</body>
</html>
`;
};
