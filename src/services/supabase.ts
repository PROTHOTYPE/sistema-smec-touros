import { Demand, AppSettings } from '../types';
import {
  getSupabaseClient,
  ENV_SUPABASE_URL,
  ENV_SUPABASE_ANON_KEY,
  supabaseClient,
} from './supabaseClient';

export { getSupabaseClient, supabaseClient };

export const SupabaseService = {
  isConfigured(settings?: AppSettings): boolean {
    const url = (settings?.supabaseUrl || ENV_SUPABASE_URL).trim();
    const key = (settings?.supabaseAnonKey || ENV_SUPABASE_ANON_KEY).trim();
    return Boolean(url && key);
  },

  async testConnection(settings?: AppSettings): Promise<{ success: boolean; message: string }> {
    const client = getSupabaseClient(settings);
    if (!client) {
      return { success: false, message: 'URL ou Chave Anon do Supabase não configuradas.' };
    }
    try {
      const { data, error } = await client.from('sectors').select('count', { count: 'exact', head: true });
      if (error) {
        return { success: false, message: `Erro ao conectar: ${error.message}` };
      }
      return { success: true, message: 'Conexão com o Supabase estabelecida com sucesso!' };
    } catch (err: any) {
      return { success: false, message: `Falha de rede: ${err.message || 'Não foi possível contatar o servidor'}` };
    }
  },

  async syncFetchDemands(settings?: AppSettings): Promise<Demand[] | null> {
    const client = getSupabaseClient(settings);
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('demands')
        .select(`
          *,
          attachments (*)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error:', error.message);
        return null;
      }

      // Converte do formato Snake_Case do SQL para CamelCase do TypeScript
      return (data || []).map((row: any) => ({
        id: row.id,
        protocolNumber: row.protocol_number,
        title: row.title,
        description: row.description,
        originType: row.origin_type,
        targetSectorId: row.target_sector_id,
        sourceSectorId: row.source_sector_id,
        status: row.status,
        priority: row.priority,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        dueDate: row.due_date,
        resolvedAt: row.resolved_at,
        resolvedBy: row.resolved_by,
        createdBy: row.created_by,
        createdByName: row.created_by_name,
        oficioNumber: row.oficio_number,
        oficioSender: row.oficio_sender,
        oficioPhysicalDate: row.oficio_physical_date,
        oficioReceivedBy: row.oficio_received_by,
        resolutionSummary: row.resolution_summary,
        bottleneckReason: row.bottleneck_reason,
        impedimentReason: row.impediment_reason,
        isDirectActionExecuted: row.is_direct_action_executed,
        isConfidential: row.is_confidential,
        attachments: (row.attachments || []).map((att: any) => ({
          id: att.id,
          fileName: att.file_name,
          fileUri: att.file_uri,
          fileType: att.file_type,
          fileSize: att.file_size,
          uploadedAt: att.uploaded_at,
          uploadedBy: att.uploaded_by,
        })),
      }));
    } catch (err) {
      console.warn('Supabase sync error:', err);
      return null;
    }
  },

  async syncUpsertDemand(demand: Demand, settings?: AppSettings): Promise<boolean> {
    const client = getSupabaseClient(settings);
    if (!client) return false;

    try {
      const dbRow = {
        id: demand.id,
        protocol_number: demand.protocolNumber,
        title: demand.title,
        description: demand.description,
        origin_type: demand.originType,
        target_sector_id: demand.targetSectorId,
        source_sector_id: demand.sourceSectorId,
        status: demand.status,
        priority: demand.priority,
        created_at: demand.createdAt,
        updated_at: demand.updatedAt,
        due_date: demand.dueDate,
        resolved_at: demand.resolvedAt,
        resolved_by: demand.resolvedBy,
        created_by: demand.createdBy,
        created_by_name: demand.createdByName,
        oficio_number: demand.oficioNumber,
        oficio_sender: demand.oficioSender,
        oficio_physical_date: demand.oficioPhysicalDate,
        oficio_received_by: demand.oficioReceivedBy,
        resolution_summary: demand.resolutionSummary,
        bottleneck_reason: demand.bottleneckReason,
        impediment_reason: demand.impedimentReason,
        is_direct_action_executed: demand.isDirectActionExecuted,
        is_confidential: demand.isConfidential,
      };

      const { error } = await client.from('demands').upsert(dbRow);
      if (error) {
        console.warn('Erro ao salvar demanda no Supabase:', error.message);
        return false;
      }

      // Sincroniza anexos se houver
      if (demand.attachments && demand.attachments.length > 0) {
        const attRows = demand.attachments.map(att => ({
          id: att.id,
          demand_id: demand.id,
          file_name: att.fileName,
          file_uri: att.fileUri,
          file_type: att.fileType,
          file_size: att.fileSize,
          uploaded_at: att.uploadedAt,
          uploaded_by: att.uploadedBy,
        }));
        await client.from('attachments').upsert(attRows);
      }

      return true;
    } catch (err) {
      console.warn('Erro ao sincronizar com Supabase:', err);
      return false;
    }
  },

  async syncDeleteDemand(demandId: string, settings?: AppSettings): Promise<boolean> {
    const client = getSupabaseClient(settings);
    if (!client) return false;
    try {
      const { error } = await client.from('demands').delete().eq('id', demandId);
      return !error;
    } catch {
      return false;
    }
  }
};

