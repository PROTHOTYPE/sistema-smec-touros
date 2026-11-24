<p align="center">
  <img src="./assets/logo-prisma.png" alt="Projeto PRISMA" width="76" />
</p>

<h1 align="center">Projeto PRISMA</h1>

<p align="center">
  Sistema de gestão interna, protocolo de ofícios e prestação de contas desenvolvido para a<br />
  <strong>Secretaria Municipal de Educação e Cultura de Touros/RN (SMEC)</strong>.
</p>

<p align="center">
  <a href="https://sistema-smec-touros.vercel.app">Aplicação em Produção</a> ·
  <a href="https://sistema-smec-touros.vercel.app/apresentacao">Apresentação Interativa</a> ·
  <a href="#como-executar-localmente">Rodar Localmente</a>
</p>

---

## O problema que motivou o projeto

No dia a dia de uma secretaria municipal de educação, grande parte das demandas ainda circula entre ofícios físicos, planilhas isoladas e mensagens soltas em grupos de WhatsApp. Quando chega o fim do exercício — ou uma cobrança do Gabinete, do TCE ou dos conselhos municipais — reconstruir o que foi recebido, quem respondeu e qual foi o desfecho vira um trabalho manual sujeito a falhas.

O **PRISMA** nasceu para resolver esse fluxo na prática: centralizar o protocolo de entrada no Administrativo/RH, distribuir as demandas para o mural isolado de cada uma das 15 coordenações da SMEC, dar visão de acompanhamento em tempo real ao Gabinete e consolidar tudo automaticamente no Relatório Anual em PDF A4.

## Principais funcionalidades

- **Mural de demandas por setor**: cada coordenação visualiza e atualiza apenas sua própria fila de trabalho, filtrando por origem (ofício formal, demanda atribuída pelo RH ou ação direta da equipe) e status (`pendente`, `em_andamento`, `parcial`, `concluida`, `nao_concluida`).
- **Protocolo central de ofícios**: entrada controlada pelo Setor Administrativo/RH com geração de protocolo sequencial, anexo de documento e direcionamento nominal para o setor responsável.
- **Panorama dos 15 setores**: visão consolidada para o Gabinete Executivo, RH e Coordenação de TI acompanharem taxas de resolução, pendências e entrarem diretamente no mural de qualquer setor.
- **Homologação de acessos e RBAC**: novos servidores solicitam cadastro pela tela inicial e aguardam aprovação da Coordenação de TI, que define setor de lotação, papel interno (`DIRETOR`, `COORDENADOR`, `INTEGRANTE`) e nível de permissão no sistema.
- **Relatório Anual de Prestação de Contas (A4)**: geração de documento timbrado em PDF/impressão com indicadores, justificativas de gargalos, tabela de ofícios atendidos e campo de assinatura.
- **Apresentação executiva integrada (`/apresentacao`)**: deck interativo em tela cheia com navegação por teclado (`←`, `→`, `F`, `ESC`) voltado à apresentação do projeto para gestores.

## Decisões técnicas e arquitetura

| Camada | Stack utilizada |
| --- | --- |
| Interface & Mobile/Web | Expo, React Native, React Native Web, TypeScript |
| Autenticação & Banco | Supabase Auth + PostgreSQL |
| Controle de acesso | Row Level Security (RLS) + Triggers SQL |
| Geração de PDF | HTML/CSS A4 + `expo-print` / `expo-sharing` |
| Deploy Web | Vercel (exportação estática Metro Web) |

Algumas escolhas feitas durante o desenvolvimento:

1. **Segurança aplicada no banco, não apenas na UI**: todas as tabelas em [`supabase/schema.sql`](./supabase/schema.sql) utilizam políticas de **Row Level Security (RLS)**. Para evitar recursão infinita ao consultar `public.profiles` dentro das próprias políticas, foram criadas funções auxiliares `SECURITY DEFINER` (`current_system_role`, `current_sector_id`, `current_user_status`). Além disso, triggers `BEFORE UPDATE` impedem escalonamento de privilégios caso alguém tente alterar `system_role` ou `status` diretamente via API.
2. **Base única para Web e Mobile**: a interface roda em desktop, navegador mobile e Expo Go a partir do mesmo código, adaptando a navegação entre barra lateral (desktop) e bottom tab bar (mobile) e respeitando áreas de toque e viewport no celular.
3. **Roteamento SPA na Vercel sem `expo-router`**: como a exportação web do Expo gera apenas `dist/index.html`, o script [`scripts/postbuild-web.js`](./scripts/postbuild-web.js) gera os entrypoints estáticos para `/apresentacao`, `/slides` e `404.html` no pós-build, combinado aos rewrites em [`vercel.json`](./vercel.json).

## Estrutura do projeto

```text
.
├── App.tsx                       # Navegação principal, controle de rotas e layout responsivo
├── assets/                       # Ícones e logotipos institucionais
├── scripts/
│   └── postbuild-web.js          # Geração de entrypoints estáticos para SPA na Vercel
├── supabase/
│   └── schema.sql                # Tabelas, carga dos 15 setores, funções RLS e triggers
└── src/
    ├── components/
    │   ├── common/               # Cards, botões, modais e seletor de setores com busca
    │   ├── demands/              # Cards e modais de criação/detalhes de ofícios e demandas
    │   ├── icons/                # Emblemas institucionais com fallback vetorial SVG
    │   ├── presentation/         # Deck de apresentação interativa (/apresentacao)
    │   └── report/               # Template HTML A4 do relatório anual
    ├── constants/                # Definição dos 15 setores oficiais e tokens de tema
    ├── context/                  # AuthContext e DemandsContext
    ├── screens/                  # Telas (Login, Mural, Protocolo, Panorama, Relatório, Acessos, Ajustes)
    ├── services/                 # Integração Supabase, AsyncStorage e exportação PDF
    └── types/                    # Tipagens TypeScript do domínio
```

## Como executar localmente

### Pré-requisitos

- Node.js 18+
- Projeto configurado no [Supabase](https://supabase.com)

### 1. Instalar dependências

```bash
git clone https://github.com/PROTHOTYPE/sistema-smec-touros.git
cd sistema-smec-touros
npm install
```

### 2. Configurar banco de dados

No SQL Editor do seu projeto Supabase, execute o script [`supabase/schema.sql`](./supabase/schema.sql).  
Antes de rodar, ajuste o e-mail placeholder (`admin.ti@smec.exemplo.gov.br`) na função `handle_new_user()` para o e-mail que será usado como administrador inicial.

### 3. Configurar variáveis de ambiente

Copie `.env.example` para `.env` e informe a URL e a chave pública (`anon`) do seu projeto:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key-aqui
```

### 4. Iniciar o projeto

```bash
# Navegador (Web)
npm run web

# Dispositivo móvel (Expo Go)
npm start

# Verificação de tipos
npx tsc --noEmit

# Build estático para produção Web
npm run build
```

## Licença e autoria

Desenvolvido por **Pedro Carlos / PROTHOTYPE**.  
Distribuído sob a licença [MIT](./LICENSE).
