"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.SummaryAgent = void 0;
var sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
var calendarAgent_1 = require("./calendarAgent");
var emailAgent_1 = require("./emailAgent");
var dotenv = __importStar(require("dotenv"));
// Carga explícita del archivo .env.local
dotenv.config({ path: '.env.local' });
var SummaryAgent = /** @class */ (function () {
    function SummaryAgent() {
        // Obtener la clave API directamente del process.env
        var apiKey = process.env.ANTHROPIC_API_KEY;
        console.log('SummaryAgent - Anthropic API Key disponible:', !!apiKey);
        // Usar any temporalmente para evitar errores de tipos
        this.anthropic = new sdk_1.default({
            apiKey: apiKey || '',
        });
        this.calendarAgent = new calendarAgent_1.CalendarAgent();
        this.emailAgent = new emailAgent_1.EmailAgent();
    }
    SummaryAgent.prototype.getDailySummary = function (sessionData) {
        return __awaiter(this, void 0, void 0, function () {
            var todayEvents, importantEmails, summaryPrompt, response, apiError_1, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 9, , 10]);
                        // Verificar que la API key esté disponible
                        if (!process.env.ANTHROPIC_API_KEY) {
                            console.error('Error: ANTHROPIC_API_KEY no está definida');
                            throw new Error('Error de configuración: ANTHROPIC_API_KEY no está definida');
                        }
                        todayEvents = sessionData.calendarData;
                        importantEmails = sessionData.emailData;
                        if (!(!todayEvents && sessionData.accessToken)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.calendarAgent.getTodayEvents(sessionData.accessToken)];
                    case 1:
                        todayEvents = _a.sent();
                        _a.label = 2;
                    case 2:
                        if (!(!importantEmails && sessionData.accessToken)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.emailAgent.getImportantEmails(sessionData.accessToken)];
                    case 3:
                        importantEmails = _a.sent();
                        _a.label = 4;
                    case 4:
                        // Agregar logs para depuración
                        console.log('Eventos del calendario recuperados:', JSON.stringify(todayEvents));
                        console.log('Correos importantes recuperados:', JSON.stringify(importantEmails));
                        summaryPrompt = "\n      Genera un resumen conciso y directo de la siguiente informaci\u00F3n:\n      \n      EVENTOS DEL D\u00CDA:\n      ".concat(JSON.stringify(todayEvents, null, 2), "\n      \n      CORREOS RECIENTES:\n      ").concat(JSON.stringify(importantEmails, null, 2), "\n      \n      Formato deseado:\n      \n      ### Eventos:\n      - [Hora] [Nombre del evento] - [Ubicaci\u00F3n] (Calendario: [calendarName])\n      \n      ### Correos:\n      - De: [Remitente] - Asunto: [Asunto]\n        [Breve descripci\u00F3n o acci\u00F3n requerida]\n      \n      No incluyas introducciones ni conclusiones extensas. Si no hay eventos o correos, simplemente indica \"No hay eventos programados\" o \"No hay correos importantes\". Lim\u00EDtate a ofrecer la informaci\u00F3n esencial.\n      ");
                        _a.label = 5;
                    case 5:
                        _a.trys.push([5, 7, , 8]);
                        return [4 /*yield*/, this.anthropic.messages.create({
                                model: 'claude-3-5-sonnet-20240620',
                                max_tokens: 1000,
                                system: 'Eres un asistente personal eficiente. Tu tarea es presentar información de manera concisa y directa, sin florituras ni explicaciones innecesarias. Céntrate solo en los datos importantes.',
                                messages: [
                                    {
                                        role: 'user',
                                        content: summaryPrompt,
                                    },
                                ],
                            })];
                    case 6:
                        response = _a.sent();
                        return [2 /*return*/, response.content[0].text];
                    case 7:
                        apiError_1 = _a.sent();
                        console.error('Error específico al llamar a la API de Anthropic:', apiError_1);
                        throw new Error('Error al comunicarse con la API de Claude: ' + apiError_1.message);
                    case 8: return [3 /*break*/, 10];
                    case 9:
                        error_1 = _a.sent();
                        console.error('Error al generar el resumen diario:', error_1);
                        throw new Error('No se pudo generar el resumen diario');
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return SummaryAgent;
}());
exports.SummaryAgent = SummaryAgent;
