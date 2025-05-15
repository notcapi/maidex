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
var path_1 = require("path");
var sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
var fs_1 = __importDefault(require("fs"));
var emailAgent_1 = require("../agents/emailAgent");
var calendarAgent_1 = require("../agents/calendarAgent");
var MCPIntegration = /** @class */ (function () {
    function MCPIntegration() {
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });
        this.mcpBasePath = process.env.MCP_BASE_PATH || './mcp';
        this.emailAgent = new emailAgent_1.EmailAgent();
        this.calendarAgent = new calendarAgent_1.CalendarAgent();
    }
    /**
     * Inicializa las capacidades de MCP para una sesión de modelo
     */
    MCPIntegration.prototype.initializeMCP = function () {
        return __awaiter(this, void 0, void 0, function () {
            var capabilities, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.getAvailableCapabilities()];
                    case 1:
                        capabilities = _a.sent();
                        return [2 /*return*/, capabilities];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error al inicializar MCP:', error_1);
                        throw new Error('No se pudieron inicializar las capacidades de MCP');
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Obtiene las capacidades disponibles en el directorio de MCP
     */
    MCPIntegration.prototype.getAvailableCapabilities = function () {
        return __awaiter(this, void 0, void 0, function () {
            var capabilities, schemasDir, files, _i, files_1, file, filePath, content, config;
            return __generator(this, function (_a) {
                try {
                    capabilities = [];
                    schemasDir = (0, path_1.join)(this.mcpBasePath, 'schemas');
                    if (fs_1.default.existsSync(schemasDir)) {
                        files = fs_1.default.readdirSync(schemasDir);
                        for (_i = 0, files_1 = files; _i < files_1.length; _i++) {
                            file = files_1[_i];
                            if (file.endsWith('.json')) {
                                filePath = (0, path_1.join)(schemasDir, file);
                                content = fs_1.default.readFileSync(filePath, 'utf8');
                                config = JSON.parse(content);
                                capabilities.push({
                                    name: config.name,
                                    config: config
                                });
                            }
                        }
                    }
                    return [2 /*return*/, capabilities];
                }
                catch (error) {
                    console.error('Error al obtener capacidades MCP:', error);
                    return [2 /*return*/, []];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Ejecuta una consulta en el modelo con soporte MCP
     */
    MCPIntegration.prototype.runWithMCP = function (prompt_1, accessToken_1) {
        return __awaiter(this, arguments, void 0, function (prompt, accessToken, capabilities) {
            var tools, hasTools, systemMessage, modifiedPrompt, to, subject, body, toMatch, subjectMatch, response, firstContent, toolUse, name_1, input, result, emailParams, followUpResponse, responseContent, explicitPrompt, retryResponse, retryContent, name_2, input, result, emailParams, error_2;
            var _this = this;
            var _a;
            if (capabilities === void 0) { capabilities = []; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 14, , 15]);
                        tools = capabilities.map(function (capability) {
                            if (capability === 'send_email') {
                                return {
                                    name: 'send_email',
                                    input_schema: _this.getToolSchema('gmail_send.json', 'input_schema'),
                                    description: 'Envía un correo electrónico utilizando Gmail'
                                };
                            }
                            else if (capability === 'create_event') {
                                return {
                                    name: 'create_event',
                                    input_schema: _this.getToolSchema('calendar_event.json', 'input_schema'),
                                    description: 'Crea un evento en Google Calendar'
                                };
                            }
                            return null;
                        }).filter(Boolean);
                        console.log('Herramientas creadas para MCP:', tools.map(function (t) { return t === null || t === void 0 ? void 0 : t.name; }));
                        hasTools = tools.length > 0;
                        systemMessage = hasTools
                            ? 'Eres un asistente personal eficiente. DEBES USAR LAS HERRAMIENTAS proporcionadas en lugar de responder con texto cuando el usuario pide una acción específica. Cuando el usuario pide enviar un correo, SIEMPRE usa la herramienta send_email y NO respondas con texto. Cuando pide crear un evento, SIEMPRE usa la herramienta create_event. No expliques que vas a usar una herramienta, simplemente úsala.'
                            : 'Eres un asistente personal eficiente. Responde de forma concisa y clara a las preguntas del usuario.';
                        modifiedPrompt = prompt;
                        if (hasTools) {
                            if (capabilities.includes('send_email') &&
                                (prompt.toLowerCase().includes('correo') ||
                                    prompt.toLowerCase().includes('email') ||
                                    prompt.toLowerCase().includes('envía') ||
                                    prompt.toLowerCase().includes('enviar'))) {
                                to = '', subject = '', body = '';
                                toMatch = prompt.match(/(?:a|para)\s+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
                                if (toMatch)
                                    to = toMatch[1];
                                subjectMatch = prompt.match(/(?:asunto|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
                                if (subjectMatch)
                                    subject = subjectMatch[1].trim();
                                else
                                    subject = "Mensaje automático";
                                // El resto se considera como cuerpo si no hay indicaciones específicas
                                if (!subject)
                                    subject = "Mensaje automático";
                                // Si no se especifica un cuerpo, usar el prompt completo como base
                                body = prompt.replace(/(?:envía|enviar|mandar|envia).*?correo.*?(?:a|para).*?@.*?(?:con|y)/, '')
                                    .replace(/(?:asunto|subject)[:\s]+["']?([^"'\n.]*)["']?/i, '')
                                    .trim();
                                if (body.length < 5)
                                    body = "Nos vemos pronto. Mensaje enviado desde mi asistente personal.";
                                // Construir un prompt más directo
                                modifiedPrompt = "Usa la herramienta send_email para enviar un correo a ".concat(to, " con asunto \"").concat(subject, "\" y el siguiente contenido: \"").concat(body, "\"");
                            }
                            else if (capabilities.includes('create_event') &&
                                (prompt.toLowerCase().includes('evento') ||
                                    prompt.toLowerCase().includes('calendario') ||
                                    prompt.toLowerCase().includes('reunión'))) {
                                // Hacer lo mismo para eventos si es necesario
                                modifiedPrompt = "Usa la herramienta create_event para ".concat(prompt);
                            }
                        }
                        console.log('Enviando prompt a Claude (modificado):', modifiedPrompt);
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: 'claude-3-5-sonnet-20240620',
                                max_tokens: 1000,
                                system: systemMessage,
                                messages: [
                                    {
                                        role: 'user',
                                        content: modifiedPrompt,
                                    },
                                ],
                                tools: hasTools ? tools : undefined,
                                temperature: 0.3, // Reducir la temperatura para respuestas más deterministas
                            })];
                    case 1:
                        response = _b.sent();
                        console.log('Claude respondió. Tipo de contenido:', (_a = response.content[0]) === null || _a === void 0 ? void 0 : _a.type);
                        firstContent = response.content[0];
                        if (!(firstContent && firstContent.type === 'tool_use')) return [3 /*break*/, 7];
                        toolUse = firstContent;
                        name_1 = toolUse.name, input = toolUse.input;
                        console.log('Claude está usando la herramienta:', name_1);
                        console.log('Parámetros de la herramienta:', JSON.stringify(input, null, 2));
                        result = void 0;
                        if (!(name_1 === 'send_email')) return [3 /*break*/, 3];
                        emailParams = input;
                        if (emailParams.to && !Array.isArray(emailParams.to)) {
                            console.log('Convirtiendo destinatario de string a array:', emailParams.to);
                            emailParams.to = [emailParams.to];
                        }
                        return [4 /*yield*/, this.emailAgent.sendEmail(accessToken, emailParams)];
                    case 2:
                        result = _b.sent();
                        console.log('Resultado de envío de correo:', result);
                        return [3 /*break*/, 5];
                    case 3:
                        if (!(name_1 === 'create_event')) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.calendarAgent.createEvent(accessToken, input)];
                    case 4:
                        result = _b.sent();
                        _b.label = 5;
                    case 5:
                        console.log('Resultado de la acción:', JSON.stringify(result, null, 2));
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: 'claude-3-5-sonnet-20240620',
                                max_tokens: 1000,
                                system: 'Eres un asistente personal eficiente. Responde de forma concisa y clara sobre el resultado de la operación que acabas de realizar.',
                                messages: [
                                    {
                                        role: 'user',
                                        content: prompt,
                                    },
                                    {
                                        role: 'assistant',
                                        content: [toolUse]
                                    },
                                    {
                                        role: 'user',
                                        content: "Resultado de la operaci\u00F3n: ".concat(JSON.stringify(result)),
                                    },
                                ],
                            })];
                    case 6:
                        followUpResponse = _b.sent();
                        responseContent = followUpResponse.content[0];
                        if (responseContent && responseContent.type === 'text') {
                            return [2 /*return*/, responseContent.text];
                        }
                        if (result && result.success) {
                            return [2 /*return*/, 'El correo se ha enviado correctamente.'];
                        }
                        else if (result) {
                            return [2 /*return*/, "Error al realizar la operaci\u00F3n: ".concat(result.error || 'Ocurrió un error desconocido')];
                        }
                        return [2 /*return*/, 'La operación se completó correctamente'];
                    case 7:
                        if (!(hasTools && !(firstContent && firstContent.type === 'tool_use'))) return [3 /*break*/, 13];
                        console.log('Claude no usó la herramienta como se esperaba, intentando con prompt más directo...');
                        explicitPrompt = '';
                        if (capabilities.includes('send_email')) {
                            explicitPrompt = 'IMPORTANTE: UTILIZA LA HERRAMIENTA send_email PARA REALIZAR ESTA TAREA. NO RESPONDAS CON TEXTO. ' + modifiedPrompt;
                        }
                        else if (capabilities.includes('create_event')) {
                            explicitPrompt = 'IMPORTANTE: UTILIZA LA HERRAMIENTA create_event PARA REALIZAR ESTA TAREA. NO RESPONDAS CON TEXTO. ' + modifiedPrompt;
                        }
                        if (!explicitPrompt) return [3 /*break*/, 13];
                        console.log('Intentando de nuevo con prompt explícito:', explicitPrompt);
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: 'claude-3-5-sonnet-20240620',
                                max_tokens: 1000,
                                system: 'Eres un asistente personal que DEBE USAR las herramientas proporcionadas. NUNCA respondas con texto cuando se te pida una acción como enviar correo o crear eventos. SIEMPRE usa las herramientas disponibles.',
                                messages: [
                                    {
                                        role: 'user',
                                        content: explicitPrompt,
                                    },
                                ],
                                tools: tools,
                                temperature: 0.1,
                            })];
                    case 8:
                        retryResponse = _b.sent();
                        retryContent = retryResponse.content[0];
                        console.log('Segundo intento - Tipo de contenido:', retryContent === null || retryContent === void 0 ? void 0 : retryContent.type);
                        if (!(retryContent && retryContent.type === 'tool_use')) return [3 /*break*/, 13];
                        name_2 = retryContent.name, input = retryContent.input;
                        console.log('Claude está usando la herramienta en segundo intento:', name_2);
                        result = void 0;
                        if (!(name_2 === 'send_email')) return [3 /*break*/, 10];
                        emailParams = input;
                        if (emailParams.to && !Array.isArray(emailParams.to)) {
                            emailParams.to = [emailParams.to];
                        }
                        return [4 /*yield*/, this.emailAgent.sendEmail(accessToken, emailParams)];
                    case 9:
                        result = _b.sent();
                        return [3 /*break*/, 12];
                    case 10:
                        if (!(name_2 === 'create_event')) return [3 /*break*/, 12];
                        return [4 /*yield*/, this.calendarAgent.createEvent(accessToken, input)];
                    case 11:
                        result = _b.sent();
                        _b.label = 12;
                    case 12:
                        if (result && result.success) {
                            return [2 /*return*/, 'La operación se completó correctamente.'];
                        }
                        else if (result) {
                            return [2 /*return*/, "Error al realizar la operaci\u00F3n: ".concat(result.error || 'Ocurrió un error desconocido')];
                        }
                        _b.label = 13;
                    case 13:
                        // Si no se usó ninguna herramienta, devolver la respuesta normal
                        if (firstContent && firstContent.type === 'text') {
                            return [2 /*return*/, firstContent.text];
                        }
                        return [2 /*return*/, 'No se pudo procesar la consulta'];
                    case 14:
                        error_2 = _b.sent();
                        console.error('Error al ejecutar consulta con MCP:', error_2);
                        throw new Error('No se pudo ejecutar la consulta con MCP: ' + error_2.message);
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Obtiene el esquema de una herramienta desde su archivo JSON
     */
    MCPIntegration.prototype.getToolSchema = function (fileName, schemaType) {
        try {
            var filePath = (0, path_1.join)(this.mcpBasePath, 'schemas', fileName);
            if (fs_1.default.existsSync(filePath)) {
                var content = fs_1.default.readFileSync(filePath, 'utf8');
                var config = JSON.parse(content);
                return config[schemaType];
            }
            return {};
        }
        catch (error) {
            console.error("Error al leer esquema ".concat(schemaType, " de ").concat(fileName, ":"), error);
            return {};
        }
    };
    return MCPIntegration;
}());
exports.MCPIntegration = MCPIntegration;
