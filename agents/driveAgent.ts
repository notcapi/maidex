import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

export class DriveAgent {
  private drive: any;

  /**
   * Configura el cliente de Google Drive con el token de acceso proporcionado
   */
  private setupDriveClient(accessToken: string) {
    const oAuth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    
    oAuth2Client.setCredentials({
      access_token: accessToken
    });
    
    this.drive = google.drive({
      version: 'v3',
      auth: oAuth2Client
    });
  }

  /**
   * Lista archivos en Google Drive
   */
  async listFiles(accessToken: string, options: {
    folderId?: string,
    limit?: number
  } = {}) {
    try {
      this.setupDriveClient(accessToken);
      
      const { folderId, limit = 10 } = options;
      
      let query = '';
      if (folderId) {
        query = `'${folderId}' in parents and trashed = false`;
      } else {
        query = 'trashed = false';
      }
      
      const response = await this.drive.files.list({
        q: query,
        pageSize: limit,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime, size)'
      });
      
      return {
        success: true,
        files: response.data.files
      };
    } catch (error: any) {
      console.error('Error al listar archivos de Drive:', error);
      return {
        success: false,
        error: error.message || 'Error al listar archivos'
      };
    }
  }
  
  /**
   * Busca archivos en Google Drive
   */
  async searchFiles(accessToken: string, options: {
    query: string,
    limit?: number
  }) {
    try {
      this.setupDriveClient(accessToken);
      
      const { query, limit = 10 } = options;
      
      // Construir query para la API de Drive
      let searchQuery = `name contains '${query}' and trashed = false`;
      
      const response = await this.drive.files.list({
        q: searchQuery,
        pageSize: limit,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime, size)'
      });
      
      return {
        success: true,
        files: response.data.files
      };
    } catch (error: any) {
      console.error('Error al buscar archivos en Drive:', error);
      return {
        success: false,
        error: error.message || 'Error al buscar archivos'
      };
    }
  }
  
  /**
   * Obtiene un archivo específico de Google Drive
   */
  async getFile(accessToken: string, fileId: string, rawDownload: boolean = false) {
    try {
      this.setupDriveClient(accessToken);
      
      // Primero obtener los metadatos del archivo
      const fileResponse = await this.drive.files.get({
        fileId,
        fields: 'id, name, mimeType, createdTime, modifiedTime, size'
      });
      
      const file = fileResponse.data;
      
      // Si es un archivo de texto o el usuario solicitó la descarga completa
      if (rawDownload || 
          file.mimeType === 'text/plain' || 
          file.mimeType === 'application/json' ||
          file.mimeType === 'text/html' ||
          file.mimeType === 'text/csv' ||
          file.mimeType === 'text/markdown') {
        
        try {
          const contentResponse = await this.drive.files.get({
            fileId,
            alt: 'media'
          }, {
            responseType: rawDownload ? 'arraybuffer' : 'json'
          });
          
          file.content = contentResponse.data;
        } catch (downloadError) {
          console.warn('No se pudo descargar el contenido del archivo:', downloadError);
          // No fallamos todo, devolvemos los metadatos sin contenido
        }
      }
      
      return {
        success: true,
        file
      };
    } catch (error: any) {
      console.error('Error al obtener archivo de Drive:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener el archivo'
      };
    }
  }
  
  /**
   * Crea un archivo en Google Drive
   */
  async createFile(accessToken: string, options: {
    name: string,
    content: string,
    mimeType?: string,
    folderId?: string
  }) {
    try {
      this.setupDriveClient(accessToken);
      
      const { name, content, mimeType = 'text/plain', folderId } = options;
      
      const fileMetadata: any = {
        name
      };
      
      if (folderId) {
        fileMetadata.parents = [folderId];
      }
      
      const media = {
        mimeType,
        body: content
      };
      
      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, createdTime, modifiedTime, size'
      });
      
      return {
        success: true,
        file: response.data
      };
    } catch (error: any) {
      console.error('Error al crear archivo en Drive:', error);
      return {
        success: false,
        error: error.message || 'Error al crear el archivo'
      };
    }
  }
  
  /**
   * Actualiza un archivo existente en Google Drive
   */
  async updateFile(accessToken: string, options: {
    fileId: string,
    name?: string,
    content?: string,
    mimeType?: string
  }) {
    try {
      this.setupDriveClient(accessToken);
      
      const { fileId, name, content, mimeType = 'text/plain' } = options;
      
      const fileMetadata: any = {};
      if (name) fileMetadata.name = name;
      
      let response;
      
      // Si hay contenido para actualizar
      if (content) {
        const media = {
          mimeType,
          body: content
        };
        
        response = await this.drive.files.update({
          fileId,
          resource: fileMetadata,
          media: media,
          fields: 'id, name, mimeType, modifiedTime, size'
        });
      } else {
        // Solo actualizar metadatos
        response = await this.drive.files.update({
          fileId,
          resource: fileMetadata,
          fields: 'id, name, mimeType, modifiedTime, size'
        });
      }
      
      return {
        success: true,
        file: response.data
      };
    } catch (error: any) {
      console.error('Error al actualizar archivo en Drive:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar el archivo'
      };
    }
  }
  
  /**
   * Elimina un archivo de Google Drive
   */
  async deleteFile(accessToken: string, fileId: string) {
    try {
      this.setupDriveClient(accessToken);
      
      await this.drive.files.delete({
        fileId
      });
      
      return {
        success: true,
        message: 'Archivo eliminado correctamente'
      };
    } catch (error: any) {
      console.error('Error al eliminar archivo de Drive:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar el archivo'
      };
    }
  }
  
  /**
   * Maneja operaciones de Google Drive basado en el tipo de operación
   */
  async handleDriveOperation(accessToken: string, params: any) {
    const { operation } = params;
    
    switch (operation) {
      case 'list':
        return await this.listFiles(accessToken, {
          folderId: params.folderId,
          limit: params.limit
        });
        
      case 'search':
        return await this.searchFiles(accessToken, {
          query: params.query,
          limit: params.limit
        });
        
      case 'get':
        return await this.getFile(accessToken, params.fileId, params.rawDownload);
        
      case 'create':
        return await this.createFile(accessToken, {
          name: params.name,
          content: params.content,
          mimeType: params.mimeType,
          folderId: params.folderId
        });
        
      case 'update':
        return await this.updateFile(accessToken, {
          fileId: params.fileId,
          name: params.name,
          content: params.content,
          mimeType: params.mimeType
        });
        
      case 'delete':
        return await this.deleteFile(accessToken, params.fileId);
        
      default:
        return {
          success: false,
          error: `Operación desconocida: ${operation}`
        };
    }
  }

  /**
   * Busca un archivo por nombre exacto o cercano y devuelve su ID
   * @param accessToken Token de acceso de Google
   * @param fileName Nombre del archivo a buscar
   * @returns ID del archivo encontrado o null si no se encuentra
   */
  async findFileByName(accessToken: string, fileName: string): Promise<{
    success: boolean,
    fileId?: string,
    file?: any,
    error?: string
  }> {
    try {
      this.setupDriveClient(accessToken);
      
      // Primero intentar búsqueda exacta
      let searchQuery = `name = '${fileName}' and trashed = false`;
      
      let response = await this.drive.files.list({
        q: searchQuery,
        pageSize: 1,
        fields: 'files(id, name, mimeType, createdTime, modifiedTime, size)'
      });
      
      if (response.data.files && response.data.files.length > 0) {
        // Si encontramos coincidencia exacta
        return {
          success: true,
          fileId: response.data.files[0].id,
          file: response.data.files[0]
        };
      }
      
      // Si no hay coincidencia exacta, probar contiene
      searchQuery = `name contains '${fileName}' and trashed = false`;
      
      response = await this.drive.files.list({
        q: searchQuery,
        pageSize: 5, // Limitar a 5 resultados
        fields: 'files(id, name, mimeType, createdTime, modifiedTime, size)'
      });
      
      if (response.data.files && response.data.files.length > 0) {
        // Intentar encontrar la mejor coincidencia
        // Primero buscamos coincidencia de palabras completas
        const fileNameLower = fileName.toLowerCase();
        const terms = fileNameLower.split(/\s+/);
        
        // Ordenar por similitud según cuántas palabras coinciden
        const sortedFiles = [...response.data.files].sort((a, b) => {
          const aNameLower = a.name.toLowerCase();
          const bNameLower = b.name.toLowerCase();
          
          // Si uno contiene exactamente el término de búsqueda
          if (aNameLower.includes(fileNameLower) && !bNameLower.includes(fileNameLower)) return -1;
          if (bNameLower.includes(fileNameLower) && !aNameLower.includes(fileNameLower)) return 1;
          
          // Contar cuántos términos contiene cada nombre
          let aMatches = 0;
          let bMatches = 0;
          
          terms.forEach(term => {
            if (aNameLower.includes(term)) aMatches++;
            if (bNameLower.includes(term)) bMatches++;
          });
          
          // El de más coincidencias primero
          return bMatches - aMatches;
        });
        
        return {
          success: true,
          fileId: sortedFiles[0].id,
          file: sortedFiles[0]
        };
      }
      
      // No se encontró ningún archivo
      return {
        success: false,
        error: `No se encontró el archivo "${fileName}"`
      };
    } catch (error: any) {
      console.error('Error al buscar archivo por nombre:', error);
      return {
        success: false,
        error: error.message || 'Error al buscar archivo por nombre'
      };
    }
  }
} 