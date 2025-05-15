import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import { ActionAgent } from '../../agents/actionAgent';
import { MCPIntegration } from '../../agents/mcpIntegration';

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

    // Verificar que sea una solicitud POST
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Método no permitido' });
    }

    // Extraer los datos de la solicitud
    const { action, prompt } = req.body;

    console.log('Acción solicitada:', action);
    console.log('Prompt:', prompt);

    if (!prompt) {
      return res.status(400).json({ error: 'Se requiere el campo prompt' });
    }

    // Inicializar nuestros agentes
    const actionAgent = new ActionAgent();
    const mcpIntegration = new MCPIntegration();
    
    // Determinar qué capacidades MCP usar según la acción o la intención detectada en el prompt
    let determinedAction = action;
    
    // Si la acción no está clara o es 'chat', determinar la intención
    if (!action || action === 'chat') {
      // Primero intentamos detectar la intención por palabras clave
      if (prompt.toLowerCase().includes('correo') || 
          prompt.toLowerCase().includes('email') || 
          prompt.toLowerCase().includes('envía') || 
          prompt.toLowerCase().includes('mandar')) {
        determinedAction = 'send_email';
      } else if (prompt.toLowerCase().includes('evento') || 
                prompt.toLowerCase().includes('calendario') || 
                prompt.toLowerCase().includes('cita') || 
                prompt.toLowerCase().includes('reunión') ||
                (prompt.toLowerCase().includes('crear') && 
                 (prompt.toLowerCase().includes('programar') || 
                  prompt.toLowerCase().includes('agendar')))) {
        determinedAction = 'create_event';
      } else {
        determinedAction = 'chat';
      }
    }
    
    console.log('Acción determinada:', determinedAction);

    // Primero intentamos usar nuestro enfoque más directo con MCP
    if (determinedAction === 'send_email' || determinedAction === 'create_event') {
      try {
        // Pasar el accessToken para inicializar el servidor MCP
        const mcpResult = await mcpIntegration.executeMCPAction(prompt, determinedAction, accessToken);
        
        if (mcpResult.success && mcpResult.params) {
          // Si MCP extrajo parámetros, usamos el ActionAgent para ejecutar la acción
          const result = await actionAgent.executeAction(prompt, accessToken);
          
          return res.status(200).json({ 
            success: result.success,
            message: result.message,
            action: determinedAction
          });
        }
      } catch (mcpError) {
        console.error('Error al ejecutar acción MCP:', mcpError);
        // Continuamos con el enfoque tradicional si MCP falla
      }
    }
    
    // Enfoque tradicional: usar ActionAgent directamente
    const result = await actionAgent.executeAction(prompt, accessToken);
    
    // Devolver el resultado
    return res.status(200).json({ 
      success: result.success,
      message: result.message,
      action: determinedAction
    });
  } catch (error: any) {
    console.error('Error al procesar la acción:', error);
    
    // Estructurar respuesta de error
    return res.status(500).json({ 
      success: false,
      error: error.message || 'Error interno del servidor',
      errorCode: error.code || 'UNKNOWN_ERROR'
    });
  }
} 