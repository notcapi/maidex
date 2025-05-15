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
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
var next_1 = require("next-auth/next");
var ____nextauth_1 = require("./auth/[...nextauth]");
var summaryAgent_1 = require("../../../agents/summaryAgent");
var calendarAgent_1 = require("../../../agents/calendarAgent");
var emailAgent_1 = require("../../../agents/emailAgent");
function handler(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var session, accessToken, calendarAgent, emailAgent, summaryAgent, _a, calendarData, emailData, summary, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
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
                    calendarAgent = new calendarAgent_1.CalendarAgent();
                    emailAgent = new emailAgent_1.EmailAgent();
                    summaryAgent = new summaryAgent_1.SummaryAgent();
                    return [4 /*yield*/, Promise.all([
                            calendarAgent.getTodayEvents(accessToken),
                            emailAgent.getImportantEmails(accessToken)
                        ])];
                case 2:
                    _a = _b.sent(), calendarData = _a[0], emailData = _a[1];
                    return [4 /*yield*/, summaryAgent.getDailySummary(__assign(__assign({}, session), { calendarData: calendarData, emailData: emailData }))];
                case 3:
                    summary = _b.sent();
                    // Devolver el resumen generado
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            summary: summary,
                            metadata: {
                                eventCount: calendarData.length,
                                emailCount: emailData.length,
                                generatedAt: new Date().toISOString()
                            }
                        })];
                case 4:
                    error_1 = _b.sent();
                    console.error('Error al generar el resumen diario:', error_1);
                    // Estructurar respuesta de error
                    return [2 /*return*/, res.status(500).json({
                            success: false,
                            error: error_1.message || 'Error interno del servidor',
                            errorCode: error_1.code || 'UNKNOWN_ERROR'
                        })];
                case 5: return [2 /*return*/];
            }
        });
    });
}
