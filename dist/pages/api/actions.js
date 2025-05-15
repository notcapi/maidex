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
exports.default = handler;
var next_1 = require("next-auth/next");
var ____nextauth_1 = require("./auth/[...nextauth]");
var actionAgent_1 = require("../../agents/actionAgent");
var mcpIntegration_1 = require("../../agents/mcpIntegration");
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var session, accessToken, _a, action, prompt_1, actionAgent, mcpIntegration, determinedAction, mcpResult, result_1, mcpError_1, result, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 9, , 10]);
                    return [4 /*yield*/, (0, next_1.getServerSession)(req, res, ____nextauth_1.authOptions)];
                case 1:
                    session = _b.sent();
                    if (!session) {
                        return [2 /*return*/, res.status(401).json({ error: 'No autenticado' })];
                    }
                    accessToken = session.accessToken;
                    if (!accessToken) {
                        return [2 /*return*/, res.status(403).json({ error: 'Token de acceso no disponible' })];
                    }
                    // Verificar que sea una solicitud POST
                    if (req.method !== 'POST') {
                        return [2 /*return*/, res.status(405).json({ error: 'Método no permitido' })];
                    }
                    _a = req.body, action = _a.action, prompt_1 = _a.prompt;
                    console.log('Acción solicitada:', action);
                    console.log('Prompt:', prompt_1);
                    if (!prompt_1) {
                        return [2 /*return*/, res.status(400).json({ error: 'Se requiere el campo prompt' })];
                    }
                    actionAgent = new actionAgent_1.ActionAgent();
                    mcpIntegration = new mcpIntegration_1.MCPIntegration();
                    determinedAction = action;
                    // Si la acción no está clara o es 'chat', determinar la intención
                    if (!action || action === 'chat') {
                        // Primero intentamos detectar la intención por palabras clave
                        if (prompt_1.toLowerCase().includes('correo') ||
                            prompt_1.toLowerCase().includes('email') ||
                            prompt_1.toLowerCase().includes('envía') ||
                            prompt_1.toLowerCase().includes('mandar')) {
                            determinedAction = 'send_email';
                        }
                        else if (prompt_1.toLowerCase().includes('evento') ||
                            prompt_1.toLowerCase().includes('calendario') ||
                            prompt_1.toLowerCase().includes('cita') ||
                            prompt_1.toLowerCase().includes('reunión') ||
                            (prompt_1.toLowerCase().includes('crear') &&
                                (prompt_1.toLowerCase().includes('programar') ||
                                    prompt_1.toLowerCase().includes('agendar')))) {
                            determinedAction = 'create_event';
                        }
                        else {
                            determinedAction = 'chat';
                        }
                    }
                    console.log('Acción determinada:', determinedAction);
                    if (!(determinedAction === 'send_email' || determinedAction === 'create_event')) return [3 /*break*/, 7];
                    _b.label = 2;
                case 2:
                    _b.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, mcpIntegration.executeMCPAction(prompt_1, determinedAction, accessToken)];
                case 3:
                    mcpResult = _b.sent();
                    if (!(mcpResult.success && mcpResult.params)) return [3 /*break*/, 5];
                    return [4 /*yield*/, actionAgent.executeAction(prompt_1, accessToken)];
                case 4:
                    result_1 = _b.sent();
                    return [2 /*return*/, res.status(200).json({
                            success: result_1.success,
                            message: result_1.message,
                            action: determinedAction
                        })];
                case 5: return [3 /*break*/, 7];
                case 6:
                    mcpError_1 = _b.sent();
                    console.error('Error al ejecutar acción MCP:', mcpError_1);
                    return [3 /*break*/, 7];
                case 7: return [4 /*yield*/, actionAgent.executeAction(prompt_1, accessToken)];
                case 8:
                    result = _b.sent();
                    // Devolver el resultado
                    return [2 /*return*/, res.status(200).json({
                            success: result.success,
                            message: result.message,
                            action: determinedAction
                        })];
                case 9:
                    error_1 = _b.sent();
                    console.error('Error al procesar la acción:', error_1);
                    // Estructurar respuesta de error
                    return [2 /*return*/, res.status(500).json({
                            success: false,
                            error: error_1.message || 'Error interno del servidor',
                            errorCode: error_1.code || 'UNKNOWN_ERROR'
                        })];
                case 10: return [2 /*return*/];
            }
        });
    });
}
