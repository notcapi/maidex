import { google, calendar_v3 } from 'googleapis';

interface Attendee {
  email: string;
  displayName?: string;
  responseStatus?: string;
  optional?: boolean;
}

export class CalendarAgent {
  private calendar: calendar_v3.Calendar;

  constructor() {
    this.calendar = google.calendar('v3');
  }

  async getTodayEvents(accessToken: string) {
    try {
      // Configurar el cliente OAuth
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Obtener fecha y hora actual
      const now = new Date();
      
      // Fecha de inicio: momento actual
      const startOfPeriod = now.toISOString();
      
      // Fecha de fin: 24 horas después del momento actual
      const endDate = new Date(now);
      endDate.setHours(now.getHours() + 24);
      const endOfPeriod = endDate.toISOString();
      
      console.log('Buscando eventos entre:', startOfPeriod, 'y', endOfPeriod);
      console.log('Fecha actual del servidor:', now.toISOString());

      // Obtener la lista de todos los calendarios disponibles
      const calendarsList = await this.calendar.calendarList.list({
        auth
      });

      // Array para almacenar todos los eventos
      let allEvents: any[] = [];

      // Si hay calendarios disponibles
      if (calendarsList.data.items && calendarsList.data.items.length > 0) {
        // Para cada calendario, buscar eventos
        for (const cal of calendarsList.data.items) {
          if (cal.id) {
            console.log(`Buscando eventos en calendario: ${cal.summary} (${cal.id})`);
            
            // Obtener eventos para este calendario
            const response = await this.calendar.events.list({
              auth,
              calendarId: cal.id,
              timeMin: startOfPeriod,
              timeMax: endOfPeriod,
              singleEvents: true,
              orderBy: 'startTime',
              maxResults: 20, // Eventos por calendario
            });
            
            // Si hay eventos, añadirlos al array general con información del calendario
            if (response.data.items && response.data.items.length > 0) {
              const eventsWithCalendar = response.data.items.map(event => ({
                ...event,
                calendarName: cal.summary || 'Sin nombre',
                calendarId: cal.id
              }));
              
              allEvents = [...allEvents, ...eventsWithCalendar];
              console.log(`Encontrados ${eventsWithCalendar.length} eventos en ${cal.summary}`);
            }
          }
        }
      } else {
        // Si no hay calendarios personalizados, usar solo el primario
        const response = await this.calendar.events.list({
          auth,
          calendarId: 'primary',
          timeMin: startOfPeriod,
          timeMax: endOfPeriod,
          singleEvents: true,
          orderBy: 'startTime',
          maxResults: 50,
        });
        
        if (response.data.items) {
          allEvents = response.data.items;
        }
      }

      console.log('Total de eventos encontrados:', allEvents.length);

      // Simplificar los datos de eventos
      const events = allEvents.map(event => ({
        id: event.id,
        summary: event.summary || 'Sin título',
        description: event.description,
        start: event.start,
        end: event.end,
        location: event.location,
        status: event.status,
        calendarName: event.calendarName || 'Calendario principal',
        attendees: event.attendees?.map((attendee: Attendee) => ({
          email: attendee.email,
          name: attendee.displayName,
          responseStatus: attendee.responseStatus,
        })),
      })) || [];
      
      console.log('Eventos procesados:', events.length);
      
      return events;
    } catch (error) {
      console.error('Error al obtener eventos del calendario:', error);
      throw new Error('No se pudieron obtener los eventos del calendario');
    }
  }

  async createEvent(accessToken: string, options: {
    summary: string,
    description?: string,
    location?: string,
    start: string | Date,
    end: string | Date,
    attendees?: Array<{email: string, optional?: boolean}>,
    reminders?: {
      useDefault?: boolean,
      overrides?: Array<{method: 'email' | 'popup', minutes: number}>
    },
    calendarId?: string
  }) {
    try {
      // Configurar el cliente OAuth
      const auth = new google.auth.OAuth2();
      auth.setCredentials({ access_token: accessToken });

      // Preparar fechas en el formato correcto
      const startDateTime = typeof options.start === 'string' 
        ? options.start 
        : options.start.toISOString();
      
      const endDateTime = typeof options.end === 'string' 
        ? options.end 
        : options.end.toISOString();
      
      // Definir el evento a crear
      const event: calendar_v3.Schema$Event = {
        summary: options.summary,
        description: options.description,
        location: options.location,
        start: {
          dateTime: startDateTime,
          timeZone: 'Europe/Madrid'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Europe/Madrid'
        }
      };
      
      // Añadir participantes si se han especificado
      if (options.attendees && options.attendees.length > 0) {
        event.attendees = options.attendees.map(attendee => ({
          email: attendee.email,
          optional: attendee.optional
        }));
      }
      
      // Configurar recordatorios si se han especificado
      if (options.reminders) {
        event.reminders = {
          useDefault: options.reminders.useDefault !== undefined ? options.reminders.useDefault : true
        };
        
        if (options.reminders.overrides && options.reminders.overrides.length > 0) {
          event.reminders.overrides = options.reminders.overrides;
        }
      }
      
      // ID del calendario donde se creará el evento (por defecto, el principal)
      const calendarId = options.calendarId || 'primary';
      
      // Crear el evento
      const response = await this.calendar.events.insert({
        auth,
        calendarId,
        requestBody: event
      });
      
      console.log('Evento creado correctamente:', response.data.id);
      
      return {
        success: true,
        eventId: response.data.id,
        htmlLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('Error al crear evento:', error);
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }
} 