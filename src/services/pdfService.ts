import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export const PdfService = {
  async printOrShareHtml(html: string, fileName: string = 'Relatorio_SMEC_Touros.pdf'): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.opener = null;
          printWindow.document.open();
          printWindow.document.write(html);
          printWindow.document.close();
          // Aguarda carregamento de estilos
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 300);
        } else {
          // Fallback para iframe se popup estiver bloqueado
          const iframe = document.createElement('iframe');
          iframe.style.position = 'fixed';
          iframe.style.right = '0';
          iframe.style.bottom = '0';
          iframe.style.width = '0';
          iframe.style.height = '0';
          iframe.style.border = '0';
          document.body.appendChild(iframe);
          const doc = iframe.contentWindow?.document;
          if (doc) {
            doc.open();
            doc.write(html);
            doc.close();
            setTimeout(() => {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();
              setTimeout(() => {
                document.body.removeChild(iframe);
              }, 1000);
            }, 300);
          }
        }
        return;
      }

      // No iOS / Android: gera arquivo PDF e abre compartilhamento nativo
      const { uri } = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          UTI: '.pdf',
          mimeType: 'application/pdf',
          dialogTitle: fileName,
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Erro ao gerar/imprimir PDF:', error);
      throw error;
    }
  }
};

