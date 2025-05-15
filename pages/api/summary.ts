import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { SummaryAgent } from '../../agents/summaryAgent';
import { CalendarAgent } from '../../agents/calendarAgent';
import { EmailAgent } from '../../agents/emailAgent';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Verificar si el usuario está autenticado
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Obtener el token de acceso de la sesión
    const accessToken = session.accessToken as string;
    
    if (!accessToken) {
      return res.status(403).json({ error: 'Token de acceso no disponible' });
    }

    // Inicializar los agentes
    const calendarAgent = new CalendarAgent();
    const emailAgent = new EmailAgent();
    const summaryAgent = new SummaryAgent();
    
    // Obtener datos de calendario y correo en paralelo
    const [calendarData, emailData] = await Promise.all([
      calendarAgent.getTodayEvents(accessToken),
      emailAgent.getImportantEmails(accessToken)
    ]);
    
    // Generar el resumen diario usando el agente de resumen
    const summary = await summaryAgent.getDailySummary({
      ...session,
      calendarData,
      emailData
    });
    
    // Devolver el resumen generado
    return res.status(200).json({ 
      success: true,
      summary,
      metadata: {
        eventCount: calendarData.length,
        emailCount: emailData.length,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error al generar el resumen diario:', error);
    
    // Estructurar respuesta de error
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Error interno del servidor',
      errorCode: error.code || 'UNKNOWN_ERROR'
    });
  }
} 