// Definición de tipos para el servidor MCP
export type MCPServerManager = {
  // Métodos principales
  setAccessToken: (token: string) => void;
  executeQuery: (text: string, action: string) => Promise<MCPQueryResult>;
  processToolCall: (toolName: string, params: any) => Promise<MCPToolResult>;
  getSerializedTools: () => MCPTool[];

  // Otros métodos útiles
  correctDateIfNeeded: (dateString: string) => string;
  interpretDateReference: (text: string) => { start: string; end: string };
};

export type MCPTool = {
  type: string;
  name: string;
  description: string;
  input_schema?: any;
};

export type MCPQueryResult = {
  success: boolean;
  error?: string;
  result?: {
    message: string;
  };
  params?: any;
  textResponse?: string;
};

export type MCPToolResult = {
  success: boolean;
  error?: string;
  messageId?: string;
  eventId?: string;
  htmlLink?: string;
}; 