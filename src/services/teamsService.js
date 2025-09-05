// src/services/teamsService.js
import { Client } from '@microsoft/microsoft-graph-client';
import { AuthenticationProvider } from '@microsoft/microsoft-graph-client';

// Clase para manejar la autenticación con Microsoft Graph
class CustomAuthenticationProvider {
    constructor(accessToken) {
        this.accessToken = accessToken;
    }

    async getAccessToken() {
        return this.accessToken;
    }
}

// Configuración de Microsoft Graph
const getGraphClient = (accessToken) => {
    const authProvider = new CustomAuthenticationProvider(accessToken);
    return Client.initWithMiddleware({ authProvider });
};

// Servicio para crear reuniones de Teams
export const teamsService = {
    // Crear una reunión de Teams
    async createTeamsMeeting(eventData) {
        try {
            // Obtener el token de acceso (esto debería venir del contexto de autenticación)
            const accessToken = localStorage.getItem('microsoftAccessToken');

            if (!accessToken) {
                throw new Error('No se encontró el token de acceso de Microsoft');
            }

            const graphClient = getGraphClient(accessToken);

            // Preparar los datos de la reunión
            const meetingData = {
                subject: eventData.title,
                body: {
                    contentType: 'HTML',
                    content: eventData.description || 'Reunión creada desde Portal TI'
                },
                start: {
                    dateTime: eventData.start,
                    timeZone: 'America/Santiago'
                },
                end: {
                    dateTime: eventData.end,
                    timeZone: 'America/Santiago'
                },
                location: {
                    displayName: eventData.location || 'Reunión en línea'
                },
                attendees: eventData.assignees?.map(assignee => ({
                    emailAddress: {
                        address: assignee.email,
                        name: assignee.name
                    },
                    type: 'required'
                })) || [],
                isOnlineMeeting: true,
                onlineMeetingProvider: 'teamsForBusiness'
            };

            // Crear el evento en el calendario
            const createdEvent = await graphClient
                .me
                .calendar
                .events
                .post(meetingData);

            return {
                success: true,
                event: createdEvent,
                meetingUrl: createdEvent.onlineMeeting?.joinUrl,
                meetingId: createdEvent.onlineMeeting?.conferenceId
            };

        } catch (error) {
            console.error('Error al crear reunión de Teams:', error);
            throw new Error(`Error al crear reunión de Teams: ${error.message}`);
        }
    },

    // Obtener el enlace de unirse a la reunión
    async getMeetingJoinUrl(eventId) {
        try {
            const accessToken = localStorage.getItem('microsoftAccessToken');

            if (!accessToken) {
                throw new Error('No se encontró el token de acceso de Microsoft');
            }

            const graphClient = getGraphClient(accessToken);

            const event = await graphClient
                .me
                .calendar
                .events(eventId)
                .get();

            return event.onlineMeeting?.joinUrl || null;

        } catch (error) {
            console.error('Error al obtener enlace de reunión:', error);
            throw new Error(`Error al obtener enlace de reunión: ${error.message}`);
        }
    },

    // Actualizar una reunión existente
    async updateTeamsMeeting(eventId, eventData) {
        try {
            const accessToken = localStorage.getItem('microsoftAccessToken');

            if (!accessToken) {
                throw new Error('No se encontró el token de acceso de Microsoft');
            }

            const graphClient = getGraphClient(accessToken);

            const meetingData = {
                subject: eventData.title,
                body: {
                    contentType: 'HTML',
                    content: eventData.description || 'Reunión actualizada desde Portal TI'
                },
                start: {
                    dateTime: eventData.start,
                    timeZone: 'America/Santiago'
                },
                end: {
                    dateTime: eventData.end,
                    timeZone: 'America/Santiago'
                },
                location: {
                    displayName: eventData.location || 'Reunión en línea'
                },
                attendees: eventData.assignees?.map(assignee => ({
                    emailAddress: {
                        address: assignee.email,
                        name: assignee.name
                    },
                    type: 'required'
                })) || []
            };

            const updatedEvent = await graphClient
                .me
                .calendar
                .events(eventId)
                .patch(meetingData);

            return {
                success: true,
                event: updatedEvent,
                meetingUrl: updatedEvent.onlineMeeting?.joinUrl
            };

        } catch (error) {
            console.error('Error al actualizar reunión de Teams:', error);
            throw new Error(`Error al actualizar reunión de Teams: ${error.message}`);
        }
    },

    // Eliminar una reunión
    async deleteTeamsMeeting(eventId) {
        try {
            const accessToken = localStorage.getItem('microsoftAccessToken');

            if (!accessToken) {
                throw new Error('No se encontró el token de acceso de Microsoft');
            }

            const graphClient = getGraphClient(accessToken);

            await graphClient
                .me
                .calendar
                .events(eventId)
                .delete();

            return { success: true };

        } catch (error) {
            console.error('Error al eliminar reunión de Teams:', error);
            throw new Error(`Error al eliminar reunión de Teams: ${error.message}`);
        }
    },

    // Verificar si el usuario está autenticado con Microsoft
    isAuthenticated() {
        return !!localStorage.getItem('microsoftAccessToken');
    },

    // Obtener información del usuario de Microsoft
    async getMe() {
        try {
            const accessToken = localStorage.getItem('microsoftAccessToken');

            if (!accessToken) {
                throw new Error('No se encontró el token de acceso de Microsoft');
            }

            const graphClient = getGraphClient(accessToken);
            const me = await graphClient.me.get();

            return me;

        } catch (error) {
            console.error('Error al obtener información del usuario:', error);
            throw new Error(`Error al obtener información del usuario: ${error.message}`);
        }
    }
};

export default teamsService;
