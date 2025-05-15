"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.ActionAgent = void 0;
var emailAgent_1 = require("./emailAgent");
var calendarAgent_1 = require("./calendarAgent");
var mcpIntegration_1 = require("./mcpIntegration");
var sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
var ActionAgent = /** @class */ (function () {
    function ActionAgent() {
        this.emailAgent = new emailAgent_1.EmailAgent();
        this.calendarAgent = new calendarAgent_1.CalendarAgent();
        this.anthropic = new sdk_1.default({
            apiKey: process.env.ANTHROPIC_API_KEY || '',
        });
        this.mcpIntegration = new mcpIntegration_1.MCPIntegration();
    }
    /**
     * Determina qué acción realizar basada en el texto del usuario
     */
    ActionAgent.prototype.determineAction = function (text) {
        return __awaiter(this, void 0, void 0, function () {
            var response, content, jsonMatch, jsonStr, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: 'claude-3-5-sonnet-20240620',
                                max_tokens: 500,
                                system: 'Eres un asistente que analiza el texto para determinar si el usuario quiere enviar un correo electrónico o crear un evento en el calendario. Responde SOLO con un objeto JSON que incluya "action" (send_email, create_event, o none) y los parámetros necesarios.',
                                messages: [
                                    {
                                        role: 'user',
                                        content: "Analiza el siguiente mensaje y determina si el usuario quiere enviar un correo o crear un evento. Extrae los par\u00E1metros relevantes.\n            \n            Mensaje: \"".concat(text, "\"\n            \n            Si es un correo, extrae: destinatario, asunto y cuerpo.\n            Si es un evento, extrae: t\u00EDtulo, fecha, hora inicio, hora fin, ubicaci\u00F3n (opcional).\n            \n            Responde SOLO con un objeto JSON como este:\n            Para correos: { \"action\": \"send_email\", \"to\": \"email@example.com\", \"subject\": \"Asunto del correo\", \"body\": \"Cuerpo del correo\" }\n            Para eventos: { \"action\": \"create_event\", \"summary\": \"T\u00EDtulo del evento\", \"start\": \"2025-05-15T16:30:00\", \"end\": \"2025-05-15T17:30:00\", \"location\": \"Ubicaci\u00F3n opcional\" }\n            Si no es ninguna acci\u00F3n concreta: { \"action\": \"none\" }"),
                                    },
                                ],
                                temperature: 0.1,
                            })];
                    case 1:
                        response = _a.sent();
                        content = response.content[0];
                        if (content.type === 'text') {
                            jsonMatch = content.text.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                jsonStr = jsonMatch[0];
                                try {
                                    result = JSON.parse(jsonStr);
                                    console.log('Acción detectada:', result);
                                    return [2 /*return*/, result];
                                }
                                catch (e) {
                                    console.error('Error al parsear JSON:', e);
                                }
                            }
                        }
                        // Si no se pudo extraer un JSON válido, intentar extraer manualmente los parámetros
                        return [2 /*return*/, this.extractParamsManually(text)];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Error al determinar la acción:', error_1);
                        return [2 /*return*/, { action: 'none', params: {} }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Extrae parámetros manualmente usando expresiones regulares como fallback
     */
    ActionAgent.prototype.extractParamsManually = function (text) {
        var lowerText = text.toLowerCase();
        // Detectar si es un correo
        if (lowerText.includes('correo') ||
            lowerText.includes('email') ||
            lowerText.includes('envía') ||
            lowerText.includes('enviar') ||
            lowerText.includes('mandar')) {
            // Extraer destinatario
            var toMatch = text.match(/(?:a|para)\s+([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
            var to = toMatch ? toMatch[1] : '';
            // Extraer asunto
            var subject = 'Mensaje desde tu asistente personal';
            var subjectMatch = text.match(/(?:asunto|subject)[:\s]+["']?([^"'\n.]*)["']?/i);
            if (subjectMatch)
                subject = subjectMatch[1].trim();
            // El resto se considera el cuerpo
            var body = text
                .replace(/(?:envía|enviar|mandar|envia).*?correo.*?(?:a|para).*?@.*?(?:con|y)/, '')
                .replace(/(?:asunto|subject)[:\s]+["']?([^"'\n.]*)["']?/i, '')
                .trim();
            if (body.length < 5)
                body = "Nos vemos pronto. Mensaje enviado desde mi asistente personal.";
            return {
                action: 'send_email',
                params: { to: [to], subject: subject, body: body }
            };
        }
        // Detectar si es un evento
        else if (lowerText.includes('evento') ||
            lowerText.includes('reunión') ||
            lowerText.includes('cita') ||
            lowerText.includes('calendario')) {
            // Extraer título
            var summary = 'Evento';
            var titleMatch = text.match(/(?:titulado|llamado|título|title)[:\s]+["']?([^"'\n.]*)["']?/i);
            if (titleMatch)
                summary = titleMatch[1].trim();
            // Extraer fecha y hora
            var dateMatch = text.match(/(?:el día|fecha|el|para el)\s+(\d{1,2}(?:\s+)?(?:de)?\s+(?:enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)(?:\s+(?:de|del))?\s+(?:20\d{2})?)/i);
            var timeMatch = text.match(/(?:a las|hora)\s+(\d{1,2}(?::\d{2})?(?:\s*[apm]{2})?)/i);
            // Crear fechas predeterminadas
            var now = new Date();
            var startTime = new Date(now);
            startTime.setHours(startTime.getHours() + 1);
            startTime.setMinutes(0, 0, 0);
            var endTime = new Date(startTime);
            endTime.setHours(endTime.getHours() + 1);
            // Aplicar fecha y hora si se encontraron
            if (dateMatch || timeMatch) {
                // Procesamiento adicional de fecha y hora
                // ...
            }
            return {
                action: 'create_event',
                params: {
                    summary: summary,
                    start: startTime.toISOString(),
                    end: endTime.toISOString(),
                    location: ''
                }
            };
        }
        return { action: 'none', params: {} };
    };
    /**
     * Ejecuta una acción basada en texto del usuario
     */
    ActionAgent.prototype.executeAction = function (text, accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, action, params, mcpResult, result, result, mcpError_1, emailParams, result, result, error_2;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 14, , 15]);
                        return [4 /*yield*/, this.determineAction(text)];
                    case 1:
                        _a = _b.sent(), action = _a.action, params = _a.params;
                        console.log("Acci\u00F3n determinada: ".concat(action));
                        if (!(action === 'send_email' || action === 'create_event')) return [3 /*break*/, 9];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 8, , 9]);
                        console.log("Intentando ejecutar acci\u00F3n con MCP: ".concat(action));
                        return [4 /*yield*/, this.mcpIntegration.executeMCPAction(text, action)];
                    case 3:
                        mcpResult = _b.sent();
                        if (!(mcpResult.success && mcpResult.params)) return [3 /*break*/, 7];
                        if (!(action === 'send_email')) return [3 /*break*/, 5];
                        // Verificar que hay un destinatario válido
                        if (!mcpResult.params.to || !mcpResult.params.to.length) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'No se pudo determinar el destinatario del correo. Por favor, especifica a quién quieres enviar el correo.'
                                }];
                        }
                        return [4 /*yield*/, this.emailAgent.sendEmail(accessToken, mcpResult.params)];
                    case 4:
                        result = _b.sent();
                        if (result.success) {
                            return [2 /*return*/, {
                                    success: true,
                                    message: "Correo enviado correctamente a ".concat(mcpResult.params.to.join(', '))
                                }];
                        }
                        else {
                            return [2 /*return*/, {
                                    success: false,
                                    message: "Error al enviar el correo: ".concat(result.error)
                                }];
                        }
                        return [3 /*break*/, 7];
                    case 5:
                        if (!(action === 'create_event')) return [3 /*break*/, 7];
                        // Verificar que hay un título
                        if (!mcpResult.params.summary) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'No se pudo determinar el título del evento. Por favor, especifica un título para el evento.'
                                }];
                        }
                        return [4 /*yield*/, this.calendarAgent.createEvent(accessToken, mcpResult.params)];
                    case 6:
                        result = _b.sent();
                        if (result.success) {
                            return [2 /*return*/, {
                                    success: true,
                                    message: "Evento \"".concat(mcpResult.params.summary, "\" creado correctamente para el ").concat(new Date(mcpResult.params.start).toLocaleString())
                                }];
                        }
                        else {
                            return [2 /*return*/, {
                                    success: false,
                                    message: "Error al crear el evento: ".concat(result.error)
                                }];
                        }
                        _b.label = 7;
                    case 7: return [3 /*break*/, 9];
                    case 8:
                        mcpError_1 = _b.sent();
                        console.error('Error en la integración MCP, continuando con método tradicional:', mcpError_1);
                        return [3 /*break*/, 9];
                    case 9:
                        // Si no se pudo usar MCP o falló, continuamos con el enfoque tradicional
                        console.log("Ejecutando acci\u00F3n tradicional: ".concat(action));
                        console.log('Parámetros:', JSON.stringify(params, null, 2));
                        if (!(action === 'send_email')) return [3 /*break*/, 11];
                        // Verificar que hay un destinatario válido
                        if (!params.to || !params.to.length) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'No se pudo determinar el destinatario del correo. Por favor, especifica a quién quieres enviar el correo.'
                                }];
                        }
                        emailParams = __assign(__assign({}, params), { to: Array.isArray(params.to) ? params.to : [params.to] });
                        return [4 /*yield*/, this.emailAgent.sendEmail(accessToken, emailParams)];
                    case 10:
                        result = _b.sent();
                        if (result.success) {
                            return [2 /*return*/, {
                                    success: true,
                                    message: "Correo enviado correctamente a ".concat(params.to.join(', '))
                                }];
                        }
                        else {
                            return [2 /*return*/, {
                                    success: false,
                                    message: "Error al enviar el correo: ".concat(result.error)
                                }];
                        }
                        return [3 /*break*/, 13];
                    case 11:
                        if (!(action === 'create_event')) return [3 /*break*/, 13];
                        // Verificar que hay un título
                        if (!params.summary) {
                            return [2 /*return*/, {
                                    success: false,
                                    message: 'No se pudo determinar el título del evento. Por favor, especifica un título para el evento.'
                                }];
                        }
                        return [4 /*yield*/, this.calendarAgent.createEvent(accessToken, params)];
                    case 12:
                        result = _b.sent();
                        if (result.success) {
                            return [2 /*return*/, {
                                    success: true,
                                    message: "Evento \"".concat(params.summary, "\" creado correctamente para el ").concat(new Date(params.start).toLocaleString())
                                }];
                        }
                        else {
                            return [2 /*return*/, {
                                    success: false,
                                    message: "Error al crear el evento: ".concat(result.error)
                                }];
                        }
                        _b.label = 13;
                    case 13: return [2 /*return*/, {
                            success: false,
                            message: 'No se pudo determinar qué acción realizar. Por favor, intenta ser más específico.'
                        }];
                    case 14:
                        error_2 = _b.sent();
                        console.error('Error al ejecutar la acción:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                message: "Ocurri\u00F3 un error al procesar tu solicitud: ".concat(error_2.message)
                            }];
                    case 15: return [2 /*return*/];
                }
            });
        });
    };
    return ActionAgent;
}());
exports.ActionAgent = ActionAgent;
