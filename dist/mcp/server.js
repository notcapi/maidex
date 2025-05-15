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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MCPServer = void 0;
var mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
var zod_1 = require("zod");
var emailAgent_1 = require("../agents/emailAgent");
var calendarAgent_1 = require("../agents/calendarAgent");
/**
 * Servidor MCP que expone herramientas para envío de correos y creación de eventos
 */
var MCPServer = /** @class */ (function () {
    /**
     * Construye un nuevo servidor MCP
     * @param accessToken Token de acceso para Gmail y Calendar
     */
    function MCPServer(accessToken) {
        this.accessToken = accessToken;
        this.emailAgent = new emailAgent_1.EmailAgent();
        this.calendarAgent = new calendarAgent_1.CalendarAgent();
        this.server = new mcp_js_1.McpServer({
            name: "asistente-personal-mcp",
            version: "1.0.0"
        });
        // Configurar herramientas MCP
        this.setupTools();
    }
    /**
     * Configura las herramientas disponibles en el servidor MCP
     */
    MCPServer.prototype.setupTools = function () {
        var _this = this;
        // Herramienta para enviar correos electrónicos
        this.emailTool = this.server.tool("send_email", {
            to: zod_1.z.array(zod_1.z.string().email("Debe ser una dirección de correo válida")),
            subject: zod_1.z.string().min(1, "El asunto no puede estar vacío"),
            body: zod_1.z.string().min(1, "El cuerpo del mensaje no puede estar vacío"),
        }, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var emailParams, result, error_1;
            var to = _b.to, subject = _b.subject, body = _b.body;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log("MCP: Ejecutando send_email con:", { to: to, subject: subject, body: body });
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        emailParams = {
                            to: Array.isArray(to) ? to : [to],
                            subject: subject,
                            body: body
                        };
                        return [4 /*yield*/, this.emailAgent.sendEmail(this.accessToken, emailParams)];
                    case 2:
                        result = _c.sent();
                        if (result.success) {
                            return [2 /*return*/, {
                                    success: true,
                                    message: "Correo enviado correctamente a ".concat(emailParams.to.join(', '))
                                }];
                        }
                        else {
                            console.error("Error al enviar correo:", result.error);
                            return [2 /*return*/, {
                                    success: false,
                                    error: result.error || "Error al enviar el correo"
                                }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _c.sent();
                        console.error("Error MCP en send_email:", error_1);
                        return [2 /*return*/, {
                                success: false,
                                error: error_1.message || "Error desconocido al enviar el correo"
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
        // Herramienta para crear eventos en el calendario
        this.calendarTool = this.server.tool("create_event", {
            summary: zod_1.z.string().min(1, "El título del evento no puede estar vacío"),
            start: zod_1.z.string().refine(function (val) { return !isNaN(Date.parse(val)); }, { message: "Fecha de inicio inválida" }),
            end: zod_1.z.string().refine(function (val) { return !isNaN(Date.parse(val)); }, { message: "Fecha de fin inválida" }),
            location: zod_1.z.string().optional()
        }, function (_a) { return __awaiter(_this, [_a], void 0, function (_b) {
            var result, error_2;
            var summary = _b.summary, start = _b.start, end = _b.end, location = _b.location;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log("MCP: Ejecutando create_event con:", { summary: summary, start: start, end: end, location: location });
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.calendarAgent.createEvent(this.accessToken, {
                                summary: summary,
                                start: start,
                                end: end,
                                location: location || ""
                            })];
                    case 2:
                        result = _c.sent();
                        if (result.success) {
                            return [2 /*return*/, {
                                    success: true,
                                    message: "Evento \"".concat(summary, "\" creado correctamente para el ").concat(new Date(start).toLocaleString())
                                }];
                        }
                        else {
                            console.error("Error al crear evento:", result.error);
                            return [2 /*return*/, {
                                    success: false,
                                    error: result.error || "Error al crear el evento"
                                }];
                        }
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _c.sent();
                        console.error("Error MCP en create_event:", error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: error_2.message || "Error desconocido al crear el evento"
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        }); });
    };
    /**
     * Obtiene una versión serializada del servidor para pasar a la API de Anthropic
     */
    MCPServer.prototype.getSerializedTools = function () {
        // Obtenemos las herramientas que hemos creado manualmente
        var tools = [this.emailTool, this.calendarTool].filter(Boolean);
        return tools.map(function (tool) { return ({
            type: "custom",
            name: tool.name,
            description: "Herramienta para " + (tool.name === "send_email" ?
                "enviar correos electrónicos" :
                "crear eventos en el calendario"),
            input_schema: tool.paramSchema
        }); });
    };
    /**
     * Procesa una llamada a herramienta desde Claude
     */
    MCPServer.prototype.processToolCall = function (toolName, params) {
        return __awaiter(this, void 0, void 0, function () {
            var tool, validationResult, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Procesando llamada a herramienta: ".concat(toolName, " con par\u00E1metros:"), params);
                        if (toolName === "send_email") {
                            tool = this.emailTool;
                        }
                        else if (toolName === "create_event") {
                            tool = this.calendarTool;
                        }
                        if (!tool) {
                            console.error("Herramienta no encontrada: ".concat(toolName));
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Herramienta no disponible: ".concat(toolName)
                                }];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        validationResult = tool.paramSchema.safeParse(params);
                        if (!validationResult.success) {
                            console.error("Error de validación:", validationResult.error);
                            return [2 /*return*/, {
                                    success: false,
                                    error: "Error de validaci\u00F3n: ".concat(validationResult.error)
                                }];
                        }
                        if (!(toolName === "send_email")) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.emailAgent.sendEmail(this.accessToken, params)];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3:
                        if (!(toolName === "create_event")) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.calendarAgent.createEvent(this.accessToken, params)];
                    case 4: return [2 /*return*/, _a.sent()];
                    case 5: return [2 /*return*/, {
                            success: false,
                            error: "Implementaci\u00F3n de herramienta no disponible: ".concat(toolName)
                        }];
                    case 6:
                        error_3 = _a.sent();
                        console.error("Error al procesar llamada a ".concat(toolName, ":"), error_3);
                        return [2 /*return*/, {
                                success: false,
                                error: "Error al ejecutar la herramienta: ".concat(error_3.message)
                            }];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return MCPServer;
}());
exports.MCPServer = MCPServer;
