import Anthropic from '@anthropic-ai/sdk';
import { CalendarAgent } from './calendarAgent';
import { EmailAgent } from './emailAgent';
import * as dotenv from 'dotenv';

// Carga explícita del archivo .env.local
dotenv.config({ path: '.env.local' });

export class SummaryAgent {
  private anthropic: any;
  private calendarAgent: CalendarAgent;
  private emailAgent: EmailAgent;

  constructor() {
    // Obtener la clave API directamente del process.env
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    console.log('SummaryAgent - Anthropic API Key disponible:', !!apiKey);
    
    // Usar any temporalmente para evitar errores de tipos
    this.anthropic = new Anthropic({
      apiKey: apiKey || '',
    });
    
    this.calendarAgent = new CalendarAgent();
    this.emailAgent = new EmailAgent();
  }

  async getDailySummary(sessionData: any) {
    try {
      // Verificar que la API key esté disponible
      if (!process.env.ANTHROPIC_API_KEY) {
        console.error('Error: ANTHROPIC_API_KEY no está definida');
        throw new Error('Error de configuración: ANTHROPIC_API_KEY no está definida');
      }

      // Usar los datos de calendario y correo proporcionados o obtenerlos si no están disponibles
      let todayEvents = sessionData.calendarData;
      let importantEmails = sessionData.emailData;

      // Si los datos no se proporcionaron, obtenerlos usando los agentes
      if (!todayEvents && sessionData.accessToken) {
        todayEvents = await this.calendarAgent.getTodayEvents(sessionData.accessToken);
      }
      
      if (!importantEmails && sessionData.accessToken) {
        importantEmails = await this.emailAgent.getImportantEmails(sessionData.accessToken);
      }
      
      // Agregar logs para depuración
      console.log('Eventos del calendario recuperados:', JSON.stringify(todayEvents));
      console.log('Correos importantes recuperados:', JSON.stringify(importantEmails));
      
      // Generar el resumen con Claude - versión concisa
      const summaryPrompt = `
      Genera un resumen conciso y directo de la siguiente información:
      
      EVENTOS DEL DÍA:
      ${JSON.stringify(todayEvents, null, 2)}
      
      CORREOS RECIENTES:
      ${JSON.stringify(importantEmails, null, 2)}
      
      Formato deseado:
      
      ### Eventos:
      - [Hora] [Nombre del evento] - [Ubicación] (Calendario: [calendarName])
      
      ### Correos:
      - De: [Remitente] - Asunto: [Asunto]
        [Breve descripción o acción requerida]
      
      No incluyas introducciones ni conclusiones extensas. Si no hay eventos o correos, simplemente indica "No hay eventos programados" o "No hay correos importantes". Limítate a ofrecer la información esencial.
      `;

      // Usar try-catch específico para la llamada a la API
      try {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20240620',
          max_tokens: 1000,
          system: 'Eres un asistente personal eficiente. Tu tarea es presentar información de manera concisa y directa, sin florituras ni explicaciones innecesarias. Céntrate solo en los datos importantes.',
          messages: [
            {
              role: 'user',
              content: summaryPrompt,
            },
          ],
        });

        return response.content[0].text;
      } catch (apiError) {
        console.error('Error específico al llamar a la API de Anthropic:', apiError);
        throw new Error('Error al comunicarse con la API de Claude: ' + (apiError as Error).message);
      }
    } catch (error) {
      console.error('Error al generar el resumen diario:', error);
      throw new Error('No se pudo generar el resumen diario');
    }
  }
} 