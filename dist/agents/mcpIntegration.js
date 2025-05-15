"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPIntegration = void 0;
var sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
var server_1 = require("../mcp/server");
var MCPIntegration = /** @class */ (function () {
    function MCPIntegration() {
        this.model = 'claude-3-5-sonnet-20240620';
        this.temperature = 0.0;
        this.maxTokens = 1024;
        this.mcpServer = null;
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });
        // Definición de herramientas mantenida para compatibilidad
        // Estas se usarán solo si mcpServer no está disponible
        this.emailTool = {
            type: "custom",
            name: "send_email",
            description: "Envía un correo electrónico a los destinatarios especificados. Esta herramienta debe usarse siempre que el usuario solicite enviar un email o mensaje.",
            input_schema: {
                type: "object",
                properties: {
                    to: {
                        type: "array",
                        items: { type: "string" },
                        description: "Lista de direcciones de correo electrónico de los destinatarios"
                    },
                    subject: {
                        type: "string",
                        description: "Asunto del correo electrónico"
                    },
                    body: {
                        type: "string",
                        description: "Contenido del mensaje de correo electrónico"
                    }
                },
                required: ["to", "subject", "body"]
            }
        };
        this.calendarTool = {
            type: "custom",
            name: "create_event",
            description: "Crea un evento en el calendario del usuario. Esta herramienta debe usarse siempre que el usuario solicite crear una cita, reunión o evento.",
            input_schema: {
                type: "object",
                properties: {
                    summary: {
                        type: "string",
                        description: "Título o descripción breve del evento"
                    },
                    start: {
                        type: "string",
                        description: "Fecha y hora de inicio del evento en formato ISO 8601 (YYYY-MM-DDTHH:MM:SS)"
                    },
                    end: {
                        type: "string",
                        description: "Fecha y hora de fin del evento en formato ISO 8601 (YYYY-MM-DDTHH:MM:SS)"
                    },
                    location: {
                        type: "string",
                        description: "Ubicación física o virtual del evento (opcional)"
                    }
                },
                required: ["summary", "start", "end"]
            }
        };
    }
    /**
     * Inicializa el servidor MCP con un token de acceso
     */
    MCPIntegration.prototype.initializeMCPServer = function (accessToken) {
        this.mcpServer = new server_1.MCPServer(accessToken);
        console.log("Servidor MCP inicializado correctamente");
    };
    /**
     * Obtiene la herramienta MCP según la acción solicitada
     */
    MCPIntegration.prototype.getToolsForAction = function (action) {
        // Si tenemos un servidor MCP, usamos sus herramientas serializadas
        if (this.mcpServer) {
            return this.mcpServer.getSerializedTools().filter(function (tool) {
                if (action === 'send_email' && tool.name === 'send_email')
                    return true;
                if (action === 'create_event' && tool.name === 'create_event')
                    return true;
                return false;
            });
        }
        // Fallback a las herramientas predefinidas
        switch (action) {
            case 'send_email':
                return [this.emailTool];
            case 'create_event':
                return [this.calendarTool];
            default:
                return [];
        }
    };
    /**
     * Crea el sistema prompt optimizado para uso de herramientas
     */
    MCPIntegration.prototype.createSystemPrompt = function (action) {
        var basePrompt = "Eres un asistente que SIEMPRE usa las herramientas disponibles para realizar acciones. NUNCA respondas con texto cuando puedas usar una herramienta. Tu trabajo es EJECUTAR acciones, no describir lo que harías.";
        var actionSpecificPrompt = "";
        if (action === 'send_email') {
            actionSpecificPrompt = "\nCuando el usuario solicite enviar un correo:\n1. DEBES usar la herramienta send_email\n2. Extrae destinatario, asunto y cuerpo del mensaje del usuario\n3. Si falta informaci\u00F3n, usa valores predeterminados razonables\n4. NO expliques lo que vas a hacer, simplemente EJECUTA la acci\u00F3n\n\nEjemplos:\nUsuario: \"Env\u00EDa un correo a juan@example.com\"\nAsistente: [LLAMADA A send_email]\n\nUsuario: \"M\u00E1ndale un email a ana@gmail.com diciendo que llegar\u00E9 tarde\"\nAsistente: [LLAMADA A send_email]";
        }
        else if (action === 'create_event') {
            actionSpecificPrompt = "\nCuando el usuario solicite crear un evento o reuni\u00F3n:\n1. DEBES usar la herramienta create_event\n2. Extrae t\u00EDtulo, fecha, hora de inicio y fin del mensaje del usuario\n3. Si falta informaci\u00F3n, usa valores predeterminados razonables\n4. NO expliques lo que vas a hacer, simplemente EJECUTA la acci\u00F3n\n\nEjemplos:\nUsuario: \"Crea una reuni\u00F3n para ma\u00F1ana a las 10\"\nAsistente: [LLAMADA A create_event]\n\nUsuario: \"Agenda una cita con el doctor el viernes a las 3pm\"\nAsistente: [LLAMADA A create_event]";
        }
        return "".concat(basePrompt, "\n\n").concat(actionSpecificPrompt);
    };
    /**
     * Ejecuta la acción MCP
     */
    MCPIntegration.prototype.executeMCPAction = function (text, action, accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            var tools, modifiedPrompt, messages, response, toolUseItem, params, result, message, directPrompt, toMatch, to, subject, subjectMatch, secondResponse, toolUseItem, params, result, message, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        // Inicializar servidor MCP si tenemos accessToken y no está inicializado
                        if (accessToken && !this.mcpServer) {
                            this.initializeMCPServer(accessToken);
                        }
                        tools = this.getToolsForAction(action);
                        console.log("Ejecutando con capacidades: ".concat(JSON.stringify(tools.map(function (t) { return t.name; }))));
                        modifiedPrompt = text;
                        messages = [
                            { role: 'user', content: text }
                        ];
                        console.log("Enviando prompt a Claude: ".concat(text));
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: this.model,
                                max_tokens: this.maxTokens,
                                temperature: this.temperature,
                                system: this.createSystemPrompt(action),
                                messages: messages,
                                tools: tools
                            })];
                    case 1:
                        response = _a.sent();
                        // Para depuración
                        if (response.content[0].type === 'text') {
                            console.log("Claude respondió. Tipo de contenido: text");
                        }
                        if (!response.content.some(function (item) { return item.type === 'tool_use'; })) return [3 /*break*/, 4];
                        toolUseItem = response.content.find(function (item) { return item.type === 'tool_use'; });
                        if (!(toolUseItem && toolUseItem.type === 'tool_use')) return [3 /*break*/, 4];
                        console.log("Claude us\u00F3 la herramienta correctamente: ".concat(toolUseItem.name));
                        params = toolUseItem.input;
                        if (!(this.mcpServer && accessToken)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.mcpServer.processToolCall(toolUseItem.name, params)];
                    case 2:
                        result = _a.sent();
                        if (result.success) {
                            message = "Acci\u00F3n MCP ejecutada correctamente: ".concat(action);
                            // Comprueba las propiedades de manera segura con in
                            if ('messageId' in result) {
                                message = "Correo enviado correctamente";
                            }
                            else if ('eventId' in result) {
                                message = "Evento creado correctamente";
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    message: message,
                                    params: params
                                }];
                        }
                        else {
                            return [2 /*return*/, {
                                    success: false,
                                    message: "Error al ejecutar acci\u00F3n MCP: ".concat(result.error || "Error desconocido"),
                                    params: params
                                }];
                        }
                        _a.label = 3;
                    case 3: 
                    // Si no tenemos servidor MCP, simplemente devolver los parámetros
                    return [2 /*return*/, {
                            success: true,
                            message: "Acci\u00F3n MCP ejecutada correctamente: ".concat(action),
                            params: params
                        }];
                    case 4:
                        if (!(response.content[0].type === 'text')) return [3 /*break*/, 8];
                        console.log("Claude no usó la herramienta como se esperaba, intentando con prompt más directo...");
                        directPrompt = "";
                        if (action === 'send_email') {
                            toMatch = text.match(/(?:a|para|@)\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
                            to = toMatch ? toMatch[1] : 'destinatario@example.com';
                            subject = 'Mensaje automático';
                            subjectMatch = text.match(/(?:asunto|tema|título|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
                            if (subjectMatch)
                                subject = subjectMatch[1].trim();
                            directPrompt = "IMPORTANTE: UTILIZA LA HERRAMIENTA send_email PARA REALIZAR ESTA TAREA. NO RESPONDAS CON TEXTO. Usa la herramienta send_email para enviar un correo a ".concat(to, " con asunto \"").concat(subject, "\" y el siguiente contenido: \"").concat(text, "\"");
                        }
                        else if (action === 'create_event') {
                            directPrompt = "IMPORTANTE: UTILIZA LA HERRAMIENTA create_event PARA REALIZAR ESTA TAREA. NO RESPONDAS CON TEXTO. Usa la herramienta create_event para crear un evento en el calendario con la siguiente informaci\u00F3n: \"".concat(text, "\"");
                        }
                        console.log("Intentando de nuevo con prompt expl\u00EDcito: ".concat(directPrompt));
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: this.model,
                                max_tokens: this.maxTokens,
                                temperature: this.temperature,
                                system: this.createSystemPrompt(action),
                                messages: [{ role: 'user', content: directPrompt }],
                                tools: tools
                            })];
                    case 5:
                        secondResponse = _a.sent();
                        console.log("Segundo intento - Tipo de contenido: ".concat(secondResponse.content[0].type));
                        if (!secondResponse.content.some(function (item) { return item.type === 'tool_use'; })) return [3 /*break*/, 8];
                        toolUseItem = secondResponse.content.find(function (item) { return item.type === 'tool_use'; });
                        if (!(toolUseItem && toolUseItem.type === 'tool_use')) return [3 /*break*/, 8];
                        console.log("Claude us\u00F3 la herramienta correctamente en el segundo intento: ".concat(toolUseItem.name));
                        params = toolUseItem.input;
                        if (!(this.mcpServer && accessToken)) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.mcpServer.processToolCall(toolUseItem.name, params)];
                    case 6:
                        result = _a.sent();
                        if (result.success) {
                            message = "Acci\u00F3n MCP ejecutada correctamente en segundo intento: ".concat(action);
                            // Comprueba las propiedades de manera segura con in
                            if ('messageId' in result) {
                                message = "Correo enviado correctamente";
                            }
                            else if ('eventId' in result) {
                                message = "Evento creado correctamente";
                            }
                            return [2 /*return*/, {
                                    success: true,
                                    message: message,
                                    params: params
                                }];
                        }
                        else {
                            return [2 /*return*/, {
                                    success: false,
                                    message: "Error al ejecutar acci\u00F3n MCP: ".concat(result.error || "Error desconocido"),
                                    params: params
                                }];
                        }
                        _a.label = 7;
                    case 7: 
                    // Si no tenemos servidor MCP, simplemente devolver los parámetros
                    return [2 /*return*/, {
                            success: true,
                            message: "Acci\u00F3n MCP ejecutada correctamente en segundo intento: ".concat(action),
                            params: params
                        }];
                    case 8:
                        console.log("Claude no usó la herramienta como se esperaba, implementando fallback...");
                        // Implementar extracción manual como fallback
                        return [2 /*return*/, this.extractParamsManually(text, action)];
                    case 9:
                        error_1 = _a.sent();
                        console.error("Error al ejecutar acción MCP:", error_1);
                        return [2 /*return*/, {
                                success: false,
                                message: "Error al procesar la solicitud: ".concat(error_1.message)
                            }];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extracción manual de parámetros como fallback
     */
    MCPIntegration.prototype.extractParamsManually = function (text, action) {
        console.log("Intentando extracción manual de parámetros para:", action);
        var lowerText = text.toLowerCase();
        if (action === 'send_email') {
            // Extraer destinatario
            var toMatch = text.match(/(?:a|para|@)\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
            var to = toMatch ? [toMatch[1]] : ['destinatario@example.com'];
            // Extraer asunto
            var subject = 'Mensaje desde tu asistente personal';
            var subjectMatch = text.match(/(?:asunto|tema|título|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
            if (subjectMatch)
                subject = subjectMatch[1].trim();
            // El resto se considera el cuerpo
            var body = text
                .replace(/(?:envía|enviar|mandar|envia).*?(?:correo|email|mensaje|mail).*?(?:a|para).*?@.*?(?:con|y|diciendo)/, '')
                .replace(/(?:asunto|tema|título|subject)[:\s]+["']?([^"'\n.]*)["']?/i, '')
                .trim();
            if (body.length < 5)
                body = "Hola, este es un mensaje enviado desde mi asistente personal.";
            return {
                success: true,
                message: "Parámetros extraídos manualmente",
                params: { to: to, subject: subject, body: body }
            };
        }
        else if (action === 'create_event') {
            // Extraer fecha y hora
            var now = new Date();
            var tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(10, 0, 0, 0);
            var endTime = new Date(tomorrow);
            endTime.setHours(endTime.getHours() + 1);
            // Extraer título
            var summary = 'Reunión';
            var titleMatch = text.match(/(?:titulado|llamado|título|title|sobre)[:\s]+["']?([^"'\n.]*)["']?/i);
            if (titleMatch)
                summary = titleMatch[1].trim();
            return {
                success: true,
                message: "Parámetros extraídos manualmente para evento",
                params: {
                    summary: summary,
                    start: tomorrow.toISOString(),
                    end: endTime.toISOString(),
                    location: ""
                }
            };
        }
        return {
            success: false,
            message: "No se pudo extraer parámetros manualmente"
        };
    };
    return MCPIntegration;
}());
exports.MCPIntegration = MCPIntegration;
