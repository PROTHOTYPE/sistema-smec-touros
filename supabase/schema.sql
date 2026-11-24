-- Schema PostgreSQL / Supabase — Projeto PRISMA (SMEC Touros/RN)
-- Estrutura de setores, perfis, demandas/ofícios, RLS sem recursão e triggers de auditoria.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Setores oficiais da SMEC Touros/RN
CREATE TABLE IF NOT EXISTS public.sectors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  expected_leadership_role TEXT,
  coordinator_name TEXT,
  coordinator_role TEXT,
  email TEXT,
  phone TEXT,
  icon TEXT DEFAULT 'Building2',
  accent_color TEXT DEFAULT '#1E40AF',
  is_confidential BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Carga inicial dos 15 setores (executada antes de profiles para integridade de FK)
INSERT INTO public.sectors (id, name, short_name, code, description, expected_leadership_role, coordinator_name, coordinator_role, email, phone, icon, accent_color, is_confidential)
VALUES 
  ('suporte_ti', 'Suporte e Manutenção de TI', 'TI & Manutenção', 'TI-SMEC', 'Gestão da infraestrutura tecnológica, conectividade das escolas e manutenção de sistemas.', 'Coordenador e Suporte de TI', 'Coordenação TI-SMEC', 'Coordenador e Suporte de TI', 'ti.educacao@touros.rn.gov.br', '(84) 3263-2281', 'Cpu', '#1E40AF', false),
  ('admin_rh', 'Setor Administrativo / RH', 'Administrativo & RH', 'ADM-RH', 'Diretoria de Procedimentos Administrativos, Recursos Humanos e Protocolo Central de Ofícios.', 'Diretor de Procedimentos Administrativos', 'A definir', 'Coordenação: A definir', 'rh.educacao@touros.rn.gov.br', '(84) 3263-2280', 'Building2', '#7C3AED', false),
  ('gabinete', 'Gabinete Executivo', 'Gabinete Executivo', 'GAB-SMEC', 'Secretário Municipal, Secretário Adjunto e Diretor Executivo da SMEC Touros.', 'Secretário Municipal, Secretário Adjunto e Diretor Executivo', 'A definir', 'Coordenação: A definir', 'gabinete.educacao@touros.rn.gov.br', '(84) 3263-2282', 'Landmark', '#D97706', false),
  ('pedagogico', 'Setor Pedagógico', 'Setor Pedagógico', 'PED-SMEC', 'Diretoria Pedagógica; engloba as coordenações de Ensino Infantil (DEI), Ensino Fundamental/EJA, Educação Integral, assessoria especial e qualificação.', 'Diretor Pedagógico e Coordenações (Ensino Infantil, Fundamental/EJA e Educação Integral)', 'A definir', 'Coordenação: A definir', 'pedagogico.educacao@touros.rn.gov.br', '(84) 3263-2285', 'GraduationCap', '#0284C7', false),
  ('avaliacao', 'Setor de Avaliação', 'Setor de Avaliação', 'AVAL-SMEC', 'Diretoria de Avaliação de Aprendizagem e Gestão Escolar e Coordenação de Desempenho Educacional (SAEB/IDEB).', 'Diretor de Avaliação de Aprendizagem e Coordenador de Acompanhamento Educacional', 'A definir', 'Coordenação: A definir', 'avaliacao.educacao@touros.rn.gov.br', '(84) 3263-2284', 'LineChart', '#4F46E5', false),
  ('cultura', 'Diretoria de Cultura', 'Diretoria de Cultura', 'CULT-SMEC', 'Diretoria de Cultura e Coordenação de Pesquisa, Estudos e Manifestações Culturais.', 'Diretor de Cultura e Coordenador de Pesquisa, Estudos e Manifestações Culturais', 'A definir', 'Coordenação: A definir', 'cultura.educacao@touros.rn.gov.br', '(84) 3263-2289', 'Palette', '#C026D3', false),
  ('multidisciplinar', 'Setor Multidisciplinar', 'Multidisciplinar', 'MULTI-SMEC', 'Coordenação de Equipe Multidisciplinar (Psicologia, Psicopedagogia, Serviço Social e AEE).', 'Coordenador de Equipe Multidisciplinar', 'A definir', 'Coordenação: A definir', 'multidisciplinar.educacao@touros.rn.gov.br', '(84) 3263-2292', 'HeartHandshake', '#2563EB', true),
  ('transporte', 'Setor de Transportes', 'Setor de Transportes', 'TRANS-SMEC', 'Coordenação de Transporte Escolar e Universitário Intermunicipal (PNATE).', 'Coordenador de Transporte Escolar e Universitário Intermunicipal', 'A definir', 'Coordenação: A definir', 'transporte.educacao@touros.rn.gov.br', '(84) 3263-2290', 'Bus', '#D97706', false),
  ('alimentacao', 'Alimentação Escolar / PNAE', 'Alimentação / PNAE', 'ALIM-SMEC', 'Coordenação de Alimentação Escolar e execução do PNAE.', 'Coordenador de Alimentação Escolar', 'A definir', 'Coordenação: A definir', 'alimentacao.educacao@touros.rn.gov.br', '(84) 3263-2291', 'Apple', '#65A30D', false),
  ('esportes', 'Setor de Desporto e Esportes', 'Desporto e Esportes', 'ESP-SMEC', 'Coordenação de Desporto e Assessoria de Esporte Escolar.', 'Coordenador de Desporto e Assessor de Esporte Escolar', 'A definir', 'Coordenação: A definir', 'esporte.educacao@touros.rn.gov.br', '(84) 3263-2287', 'Trophy', '#EA580C', false),
  ('busca_ativa', 'Busca Ativa Escolar', 'Busca Ativa', 'BAE-SMEC', 'Coordenação de Busca Ativa Escolar e combate à evasão.', 'Coordenador de Busca Ativa', 'A definir', 'Coordenação: A definir', 'buscaativa.educacao@touros.rn.gov.br', '(84) 3263-2286', 'SearchCheck', '#059669', false),
  ('comunicacao', 'Comunicação e Inovação Educacional', 'Comunicação & Inovação', 'COM-SMEC', 'Coordenação de Comunicação Institucional e Inovação Educacional.', 'Coordenador de Comunicação e Inovação Educacional', 'A definir', 'Coordenação: A definir', 'comunicacao.educacao@touros.rn.gov.br', '(84) 3263-2293', 'Megaphone', '#0891B2', false),
  ('logistica', 'Logística, Almoxarifado e Manutenção Escolar', 'Logística & Manutenção', 'LOG-SMEC', 'Assessoria de Almoxarife, suprimentos e manutenção predial escolar.', 'Assessor de Almoxarife e Manutenção Escolar', 'A definir', 'Coordenação: A definir', 'logistica.educacao@touros.rn.gov.br', '(84) 3263-2294', 'PackageCheck', '#475569', false),
  ('estatistica', 'Setor de Estatística', 'Setor de Estatística', 'ESTAT-SMEC', 'Coleta, auditoria e processamento do Censo Escolar (Educacenso/INEP).', 'Coordenador do Setor de Estatística / Censo Escolar', 'A definir', 'Coordenação: A definir', 'estatistica.educacao@touros.rn.gov.br', '(84) 3263-2288', 'BarChart3', '#0D9488', false),
  ('prestacao_contas', 'Prestação de Contas', 'Prestação de Contas', 'PREST-SMEC', 'Coordenador de Avaliação de Gestão Escolar (Art. 7º, XIV) respondendo pela coordenação de Prestação de Contas e Convênios.', 'Coordenador de Avaliação de Gestão Escolar (Art. 7º, XIV) — Prestação de Contas', 'A definir', 'Coordenação: A definir', 'prestacaodecontas.educacao@touros.rn.gov.br', '(84) 3263-2295', 'FileCheck2', '#15803D', false)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  short_name = EXCLUDED.short_name,
  code = EXCLUDED.code,
  description = EXCLUDED.description,
  expected_leadership_role = EXCLUDED.expected_leadership_role,
  coordinator_name = EXCLUDED.coordinator_name,
  coordinator_role = EXCLUDED.coordinator_role,
  accent_color = EXCLUDED.accent_color,
  is_confidential = EXCLUDED.is_confidential;

-- 2. Tabela de Perfis de Usuário e Homologação (RBAC Estrito & Vinculada a auth.users e public.sectors)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  name TEXT NOT NULL DEFAULT 'Servidor SMEC',
  email TEXT NOT NULL UNIQUE,
  job_title TEXT NOT NULL DEFAULT 'Servidor Público',
  cargo TEXT NOT NULL DEFAULT 'Servidor Público',
  sector_id TEXT NOT NULL DEFAULT 'pedagogico' REFERENCES public.sectors(id),
  sector_role TEXT NOT NULL DEFAULT 'INTEGRANTE' CHECK (sector_role IN ('DIRETOR', 'COORDENADOR', 'INTEGRANTE')),
  coordination_subarea TEXT,
  system_role TEXT NOT NULL DEFAULT 'COORD_MEMBRO_SETOR' CHECK (
    UPPER(system_role) IN ('SUPER_ADMIN_TI', 'EXECUTIVO_GESTAO', 'TRIAGEM_ADMIN_RH', 'COORD_MEMBRO_SETOR')
  ),
  role TEXT NOT NULL DEFAULT 'COORD_MEMBRO_SETOR' CHECK (
    UPPER(role) IN ('SUPER_ADMIN_TI', 'EXECUTIVO_GESTAO', 'TRIAGEM_ADMIN_RH', 'COORD_MEMBRO_SETOR')
  ),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'inactive')),
  avatar_url TEXT,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint estrita de unicidade de e-mail e chave estrangeira de setor em public.profiles
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_email_unique;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- 3. Tabela Central de Protocolo de Ofícios Formais (Exclusiva ADM-RH / Gestão)
CREATE TABLE IF NOT EXISTS public.oficios_protocol (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  protocol_number TEXT NOT NULL UNIQUE,
  oficio_number TEXT NOT NULL,
  oficio_sender TEXT NOT NULL,
  oficio_physical_date DATE,
  oficio_received_by TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sector_id TEXT NOT NULL REFERENCES public.sectors(id),
  target_sector_id TEXT NOT NULL REFERENCES public.sectors(id),
  source_sector_id TEXT NOT NULL DEFAULT 'admin_rh' REFERENCES public.sectors(id),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'parcial', 'nao_concluida')),
  priority TEXT NOT NULL DEFAULT 'alta' CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Demandas, Ações de Equipe e Tramitações por Setor
CREATE TABLE IF NOT EXISTS public.demands (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  protocol_number TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  origin_type TEXT NOT NULL CHECK (origin_type IN ('oficio_formal', 'atribuida_admin', 'direta_setor')),
  sector_id TEXT GENERATED ALWAYS AS (target_sector_id) STORED,
  target_sector_id TEXT NOT NULL REFERENCES public.sectors(id),
  source_sector_id TEXT NOT NULL REFERENCES public.sectors(id),
  status TEXT NOT NULL CHECK (status IN ('pendente', 'em_andamento', 'concluida', 'parcial', 'nao_concluida')),
  priority TEXT NOT NULL CHECK (priority IN ('baixa', 'media', 'alta', 'urgente')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  created_by TEXT NOT NULL,
  created_by_name TEXT NOT NULL,

  -- Ofício Formal vinculado
  oficio_number TEXT,
  oficio_sender TEXT,
  oficio_physical_date DATE,
  oficio_received_by TEXT,

  -- Desfecho / Prestação de Contas
  resolution_summary TEXT,
  bottleneck_reason TEXT,
  impediment_reason TEXT,
  is_direct_action_executed BOOLEAN DEFAULT FALSE,
  is_confidential BOOLEAN DEFAULT FALSE
);

-- 5. Tabela de Anexos
CREATE TABLE IF NOT EXISTS public.attachments (
  id TEXT PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  demand_id TEXT NOT NULL REFERENCES public.demands(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_uri TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('image', 'pdf', 'document')),
  file_size BIGINT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by TEXT NOT NULL
);

-- 6. Tabela de Configurações Institucionais e Logos
CREATE TABLE IF NOT EXISTS public.app_settings (
  id TEXT PRIMARY KEY DEFAULT 'current_settings',
  municipio_nome TEXT DEFAULT 'Prefeitura Municipal de Touros',
  secretaria_nome TEXT DEFAULT 'Secretaria Municipal de Educação e Cultura',
  estado_nome TEXT DEFAULT 'Rio Grande do Norte',
  ano_exercicio INT DEFAULT 2026,
  versao TEXT DEFAULT '3.1.0',
  logo_prefeitura_url TEXT,
  logo_smec_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices de Otimização
CREATE INDEX IF NOT EXISTS idx_demands_target_sector ON public.demands(target_sector_id);
CREATE INDEX IF NOT EXISTS idx_demands_origin_type ON public.demands(origin_type);
CREATE INDEX IF NOT EXISTS idx_demands_status ON public.demands(status);
CREATE INDEX IF NOT EXISTS idx_oficios_protocol_sector ON public.oficios_protocol(sector_id);
CREATE INDEX IF NOT EXISTS idx_profiles_sector ON public.profiles(sector_id);

-- 7. Funções auxiliares (SECURITY DEFINER para evitar recursão em políticas RLS)

create or replace function public.current_system_role()
returns text as $$ select system_role from public.profiles where id = auth.uid() limit 1; $$ language sql stable security definer set search_path = public;

create or replace function public.current_sector_id()
returns text as $$ select sector_id from public.profiles where id = auth.uid() limit 1; $$ language sql stable security definer set search_path = public;

create or replace function public.current_user_status()
returns text as $$ select status from public.profiles where id = auth.uid() limit 1; $$ language sql stable security definer set search_path = public;

-- 8. Provisionamento automático de perfil após signup no Supabase Auth

-- Revoga qualquer permissão de INSERT direto pelo cliente em public.profiles
REVOKE INSERT ON public.profiles FROM anon, authenticated;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_raw_sector text;
  v_canonical_sector text;
  v_full_name text;
  v_job_title text;
begin
  v_full_name := coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), 'Novo Servidor');
  v_job_title := coalesce(nullif(trim(new.raw_user_meta_data->>'job_title'), ''), 'Servidor Público');
  v_raw_sector := coalesce(nullif(trim(new.raw_user_meta_data->>'sector_id'), ''), 'pedagogico');

  -- Normaliza sector_id para garantir compatibilidade estrita com a FK public.sectors(id)
  select s.id into v_canonical_sector
  from public.sectors s
  where lower(s.id) = lower(v_raw_sector)
     or lower(s.code) = lower(v_raw_sector)
  limit 1;

  if v_canonical_sector is null then
    v_canonical_sector := 'pedagogico';
  end if;

  -- Substitua pelo e-mail institucional do administrador inicial antes de executar em um novo ambiente
  if lower(trim(new.email)) = 'admin.ti@smec.exemplo.gov.br' then
    insert into public.profiles (
      id,
      full_name,
      name,
      email,
      job_title,
      cargo,
      sector_id,
      sector_role,
      coordination_subarea,
      system_role,
      role,
      status,
      created_at,
      approved_at,
      approved_by
    ) values (
      new.id,
      coalesce(nullif(v_full_name, 'Novo Servidor'), 'Coordenação TI-SMEC'),
      coalesce(nullif(v_full_name, 'Novo Servidor'), 'Coordenação TI-SMEC'),
      lower(trim(new.email)),
      'Coordenador de Suporte e Manutenção de TI',
      'Coordenador de Suporte e Manutenção de TI',
      'suporte_ti',
      'COORDENADOR',
      'Coordenação Geral de TI & Manutenção',
      'SUPER_ADMIN_TI',
      'SUPER_ADMIN_TI',
      'approved',
      now(),
      now(),
      'Bootstrap Admin TI'
    );
  else
    insert into public.profiles (
      id,
      full_name,
      name,
      email,
      job_title,
      cargo,
      sector_id,
      sector_role,
      system_role,
      role,
      status,
      created_at,
      approved_at,
      approved_by
    ) values (
      new.id,
      v_full_name,
      v_full_name,
      lower(trim(new.email)),
      v_job_title,
      v_job_title,
      v_canonical_sector,
      'INTEGRANTE',
      'COORD_MEMBRO_SETOR',
      'COORD_MEMBRO_SETOR',
      'pending',
      now(),
      null,
      null
    );
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 9. Triggers de proteção contra escalonamento de privilégios e alteração de auditoria

-- Impede alteração de colunas de permissão/status por sessões não-administradoras
create or replace function public.prevent_profile_privilege_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Mantém a conta mestre protegida contra rebaixamento acidental (ajuste o e-mail no seu ambiente)
  if lower(trim(old.email)) = 'admin.ti@smec.exemplo.gov.br' then
    new.system_role := 'SUPER_ADMIN_TI';
    new.role := 'SUPER_ADMIN_TI';
    new.status := 'approved';
    new.sector_id := 'suporte_ti';
  end if;

  -- Quando executado por sessão autenticada que não seja SUPER_ADMIN_TI, bloqueia alteração de colunas sensíveis
  if auth.uid() is not null and coalesce(upper(public.current_system_role()), '') <> 'SUPER_ADMIN_TI' then
    if new.system_role is distinct from old.system_role
       or new.role is distinct from old.role
       or new.sector_id is distinct from old.sector_id
       or new.status is distinct from old.status
       or new.sector_role is distinct from old.sector_role
       or new.approved_at is distinct from old.approved_at
       or new.approved_by is distinct from old.approved_by
       or new.email is distinct from old.email
    then
      raise exception 'Violação de Segurança RBAC: Apenas o Super Admin TI pode alterar permissões, setor, papel de liderança ou status de homologação.';
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_privilege_escalation on public.profiles;
create trigger trg_prevent_profile_privilege_escalation
  before update on public.profiles
  for each row execute procedure public.prevent_profile_privilege_escalation();

-- 9.2 Trigger BEFORE UPDATE em public.demands: impede adulteração de metadados de auditoria
create or replace function public.prevent_demand_audit_tampering()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is distinct from old.id
     or new.protocol_number is distinct from old.protocol_number
     or new.created_by is distinct from old.created_by
     or new.created_at is distinct from old.created_at
     or new.origin_type is distinct from old.origin_type
  then
    raise exception 'Violação de Governança: Metadados de auditoria (protocolo, autor, data de criação e origem) são imutáveis.';
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_prevent_demand_audit_tampering on public.demands;
create trigger trg_prevent_demand_audit_tampering
  before update on public.demands
  for each row execute procedure public.prevent_demand_audit_tampering();

-- 10. Row Level Security (RLS)

ALTER TABLE public.demands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oficios_protocol ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de public.profiles

DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
  ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid()
    OR (
      public.current_user_status() = 'approved'
      AND (
        UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'EXECUTIVO_GESTAO', 'TRIAGEM_ADMIN_RH')
        OR (
          UPPER(public.current_system_role()) = 'COORD_MEMBRO_SETOR'
          AND sector_id = public.current_sector_id()
        )
      )
    )
  );

-- Nenhuma política de INSERT para clientes: provisionamento exclusivo via trigger handle_new_user()
DROP POLICY IF EXISTS "profiles_insert_request_policy" ON public.profiles;

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy"
  ON public.profiles
  FOR UPDATE
  USING (
    (
      public.current_user_status() = 'approved'
      AND UPPER(public.current_system_role()) = 'SUPER_ADMIN_TI'
    )
    OR (
      id = auth.uid()
      AND public.current_user_status() = 'approved'
    )
  )
  WITH CHECK (
    (
      public.current_user_status() = 'approved'
      AND UPPER(public.current_system_role()) = 'SUPER_ADMIN_TI'
    )
    OR (
      id = auth.uid()
      AND public.current_user_status() = 'approved'
    )
  );

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy"
  ON public.profiles
  FOR DELETE
  USING (
    public.current_user_status() = 'approved'
    AND UPPER(public.current_system_role()) = 'SUPER_ADMIN_TI'
  );

-- Políticas de public.demands (isolamento por setor)

DROP POLICY IF EXISTS "demands_select_policy" ON public.demands;
CREATE POLICY "demands_select_policy"
  ON public.demands
  FOR SELECT
  USING (
    public.current_user_status() = 'approved'
    AND (
      UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'EXECUTIVO_GESTAO')
      OR (
        UPPER(public.current_system_role()) = 'TRIAGEM_ADMIN_RH'
        AND (
          public.demands.sector_id = 'admin_rh'
          OR public.demands.source_sector_id = 'admin_rh'
          OR public.demands.origin_type IN ('oficio_formal', 'atribuida_admin')
          OR public.demands.is_confidential = FALSE
        )
      )
      OR (
        UPPER(public.current_system_role()) = 'COORD_MEMBRO_SETOR'
        AND public.demands.sector_id = public.current_sector_id()
      )
    )
  );

DROP POLICY IF EXISTS "demands_insert_policy" ON public.demands;
CREATE POLICY "demands_insert_policy"
  ON public.demands
  FOR INSERT
  WITH CHECK (
    public.current_user_status() = 'approved'
    AND public.demands.created_by = auth.uid()::text
    AND (
      UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'TRIAGEM_ADMIN_RH')
      OR (
        UPPER(public.current_system_role()) = 'EXECUTIVO_GESTAO'
        AND public.demands.origin_type IN ('atribuida_admin', 'direta_setor')
      )
      OR (
        UPPER(public.current_system_role()) = 'COORD_MEMBRO_SETOR'
        AND public.demands.origin_type = 'direta_setor'
        AND public.demands.target_sector_id = public.current_sector_id()
        AND public.demands.source_sector_id = public.current_sector_id()
      )
    )
  );

DROP POLICY IF EXISTS "demands_update_policy" ON public.demands;
CREATE POLICY "demands_update_policy"
  ON public.demands
  FOR UPDATE
  USING (
    public.current_user_status() = 'approved'
    AND (
      UPPER(public.current_system_role()) = 'SUPER_ADMIN_TI'
      OR (
        UPPER(public.current_system_role()) = 'TRIAGEM_ADMIN_RH'
        AND (
          public.demands.sector_id = 'admin_rh'
          OR public.demands.source_sector_id = 'admin_rh'
          OR public.demands.origin_type IN ('oficio_formal', 'atribuida_admin')
        )
      )
      OR (
        public.demands.sector_id = public.current_sector_id()
      )
    )
  )
  WITH CHECK (
    public.current_user_status() = 'approved'
    AND (
      UPPER(public.current_system_role()) = 'SUPER_ADMIN_TI'
      OR (
        UPPER(public.current_system_role()) = 'TRIAGEM_ADMIN_RH'
        AND (
          public.demands.sector_id = 'admin_rh'
          OR public.demands.source_sector_id = 'admin_rh'
          OR public.demands.origin_type IN ('oficio_formal', 'atribuida_admin')
        )
      )
      OR (
        public.demands.sector_id = public.current_sector_id()
      )
    )
  );

DROP POLICY IF EXISTS "demands_delete_governance_policy" ON public.demands;
CREATE POLICY "demands_delete_governance_policy"
  ON public.demands
  FOR DELETE
  USING (
    public.current_user_status() = 'approved'
    AND UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'TRIAGEM_ADMIN_RH')
  );

-- View Segura com Mascaramento de Dados Sensíveis (LGPD / Sigilo Psicossocial)
CREATE OR REPLACE VIEW public.demands_panoramic_view AS
SELECT
  d.id,
  d.protocol_number,
  CASE
    WHEN d.is_confidential = TRUE
      AND d.target_sector_id <> public.current_sector_id()
      AND UPPER(public.current_system_role()) <> 'SUPER_ADMIN_TI'
    THEN '[ATENDIMENTO SIGILOSO — ACESSO RESTRITO AO SETOR]'
    ELSE d.title
  END AS title,
  CASE
    WHEN d.is_confidential = TRUE
      AND d.target_sector_id <> public.current_sector_id()
      AND UPPER(public.current_system_role()) <> 'SUPER_ADMIN_TI'
    THEN 'Conteúdo protegido por sigilo profissional (LGPD).'
    ELSE d.description
  END AS description,
  d.origin_type,
  d.sector_id,
  d.target_sector_id,
  d.source_sector_id,
  d.status,
  d.priority,
  d.created_at,
  d.updated_at,
  d.due_date,
  d.resolved_at,
  d.resolved_by,
  d.created_by,
  d.created_by_name,
  d.oficio_number,
  d.oficio_sender,
  d.oficio_physical_date,
  d.oficio_received_by,
  CASE
    WHEN d.is_confidential = TRUE
      AND d.target_sector_id <> public.current_sector_id()
      AND UPPER(public.current_system_role()) <> 'SUPER_ADMIN_TI'
    THEN NULL
    ELSE d.resolution_summary
  END AS resolution_summary,
  CASE
    WHEN d.is_confidential = TRUE
      AND d.target_sector_id <> public.current_sector_id()
      AND UPPER(public.current_system_role()) <> 'SUPER_ADMIN_TI'
    THEN NULL
    ELSE d.bottleneck_reason
  END AS bottleneck_reason,
  CASE
    WHEN d.is_confidential = TRUE
      AND d.target_sector_id <> public.current_sector_id()
      AND UPPER(public.current_system_role()) <> 'SUPER_ADMIN_TI'
    THEN NULL
    ELSE d.impediment_reason
  END AS impediment_reason,
  d.is_direct_action_executed,
  d.is_confidential
FROM public.demands d;

-- Políticas de public.oficios_protocol

DROP POLICY IF EXISTS "oficios_protocol_select_policy" ON public.oficios_protocol;
CREATE POLICY "oficios_protocol_select_policy"
  ON public.oficios_protocol
  FOR SELECT
  USING (
    public.current_user_status() = 'approved'
    AND (
      UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'EXECUTIVO_GESTAO', 'TRIAGEM_ADMIN_RH')
      OR (
        UPPER(public.current_system_role()) = 'COORD_MEMBRO_SETOR'
        AND public.oficios_protocol.sector_id = public.current_sector_id()
      )
    )
  );

DROP POLICY IF EXISTS "oficios_protocol_insert_policy" ON public.oficios_protocol;
CREATE POLICY "oficios_protocol_insert_policy"
  ON public.oficios_protocol
  FOR INSERT
  WITH CHECK (
    public.current_user_status() = 'approved'
    AND public.oficios_protocol.created_by = auth.uid()::text
    AND UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'TRIAGEM_ADMIN_RH')
  );

DROP POLICY IF EXISTS "oficios_protocol_update_policy" ON public.oficios_protocol;
CREATE POLICY "oficios_protocol_update_policy"
  ON public.oficios_protocol
  FOR UPDATE
  USING (
    public.current_user_status() = 'approved'
    AND (
      UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'TRIAGEM_ADMIN_RH')
      OR (
        UPPER(public.current_system_role()) = 'COORD_MEMBRO_SETOR'
        AND public.oficios_protocol.sector_id = public.current_sector_id()
      )
    )
  )
  WITH CHECK (
    public.current_user_status() = 'approved'
    AND (
      UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'TRIAGEM_ADMIN_RH')
      OR (
        UPPER(public.current_system_role()) = 'COORD_MEMBRO_SETOR'
        AND public.oficios_protocol.sector_id = public.current_sector_id()
      )
    )
  );

DROP POLICY IF EXISTS "oficios_protocol_delete_policy" ON public.oficios_protocol;
CREATE POLICY "oficios_protocol_delete_policy"
  ON public.oficios_protocol
  FOR DELETE
  USING (
    public.current_user_status() = 'approved'
    AND UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'TRIAGEM_ADMIN_RH')
  );

-- Políticas de public.sectors, public.attachments e public.app_settings

-- public.sectors: Leitura pública para listagem oficial dos 15 setores; mutação exclusiva do Super Admin TI
DROP POLICY IF EXISTS "sectors_select_policy" ON public.sectors;
CREATE POLICY "sectors_select_policy"
  ON public.sectors
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "sectors_modify_policy" ON public.sectors;
CREATE POLICY "sectors_modify_policy"
  ON public.sectors
  FOR ALL
  USING (
    public.current_user_status() = 'approved'
    AND UPPER(public.current_system_role()) = 'SUPER_ADMIN_TI'
  )
  WITH CHECK (
    public.current_user_status() = 'approved'
    AND UPPER(public.current_system_role()) = 'SUPER_ADMIN_TI'
  );

-- public.attachments: Vinculado à visibilidade da demanda e autoria
DROP POLICY IF EXISTS "attachments_select_policy" ON public.attachments;
CREATE POLICY "attachments_select_policy"
  ON public.attachments
  FOR SELECT
  USING (
    public.current_user_status() = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.demands d
      WHERE d.id = public.attachments.demand_id
    )
  );

DROP POLICY IF EXISTS "attachments_insert_policy" ON public.attachments;
CREATE POLICY "attachments_insert_policy"
  ON public.attachments
  FOR INSERT
  WITH CHECK (
    public.current_user_status() = 'approved'
    AND public.attachments.uploaded_by = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM public.demands d
      WHERE d.id = public.attachments.demand_id
    )
  );

DROP POLICY IF EXISTS "attachments_delete_policy" ON public.attachments;
CREATE POLICY "attachments_delete_policy"
  ON public.attachments
  FOR DELETE
  USING (
    public.current_user_status() = 'approved'
    AND UPPER(public.current_system_role()) IN ('SUPER_ADMIN_TI', 'TRIAGEM_ADMIN_RH')
  );

-- public.app_settings: Leitura para usuários aprovados; edição exclusiva pelo Super Admin TI
DROP POLICY IF EXISTS "app_settings_select_policy" ON public.app_settings;
CREATE POLICY "app_settings_select_policy"
  ON public.app_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "app_settings_modify_policy" ON public.app_settings;
CREATE POLICY "app_settings_modify_policy"
  ON public.app_settings
  FOR ALL
  USING (
    public.current_user_status() = 'approved'
    AND UPPER(public.current_system_role()) = 'SUPER_ADMIN_TI'
  )
  WITH CHECK (
    public.current_user_status() = 'approved'
    AND UPPER(public.current_system_role()) = 'SUPER_ADMIN_TI'
  );
