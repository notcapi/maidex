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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailAgent = void 0;
var googleapis_1 = require("googleapis");
var EmailAgent = /** @class */ (function () {
    function EmailAgent() {
        this.gmail = googleapis_1.google.gmail('v1');
    }
    EmailAgent.prototype.getImportantEmails = function (accessToken_1) {
        return __awaiter(this, arguments, void 0, function (accessToken, maxResults) {
            var auth, twelveHoursAgo, timestamp, queryString, response, emails, _i, _a, message, messageDetails, headers, subject, from, snippet, error_1;
            var _b, _c, _d, _e;
            if (maxResults === void 0) { maxResults = 20; }
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        _f.trys.push([0, 6, , 7]);
                        auth = new googleapis_1.google.auth.OAuth2();
                        auth.setCredentials({ access_token: accessToken });
                        twelveHoursAgo = new Date();
                        twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);
                        timestamp = Math.floor(twelveHoursAgo.getTime() / 1000);
                        queryString = "after:".concat(timestamp);
                        console.log('Buscando correos desde:', twelveHoursAgo.toISOString());
                        console.log('Query de búsqueda para Gmail:', queryString);
                        return [4 /*yield*/, this.gmail.users.messages.list({
                                auth: auth,
                                userId: 'me',
                                maxResults: maxResults,
                                q: queryString,
                            })];
                    case 1:
                        response = _f.sent();
                        console.log('Total de correos encontrados:', ((_b = response.data.messages) === null || _b === void 0 ? void 0 : _b.length) || 0);
                        emails = [];
                        // Si no hay mensajes, devolver un array vacío
                        if (!response.data.messages || response.data.messages.length === 0) {
                            return [2 /*return*/, []];
                        }
                        _i = 0, _a = response.data.messages;
                        _f.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        message = _a[_i];
                        if (!message.id) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.gmail.users.messages.get({
                                auth: auth,
                                userId: 'me',
                                id: message.id,
                            })];
                    case 3:
                        messageDetails = _f.sent();
                        headers = ((_c = messageDetails.data.payload) === null || _c === void 0 ? void 0 : _c.headers) || [];
                        subject = ((_d = headers.find(function (header) { return header.name === 'Subject'; })) === null || _d === void 0 ? void 0 : _d.value) || 'Sin asunto';
                        from = ((_e = headers.find(function (header) { return header.name === 'From'; })) === null || _e === void 0 ? void 0 : _e.value) || 'Desconocido';
                        snippet = messageDetails.data.snippet || '';
                        emails.push({
                            id: message.id,
                            subject: subject,
                            from: from,
                            snippet: snippet,
                            date: new Date(parseInt(messageDetails.data.internalDate || '0')).toLocaleString(),
                        });
                        _f.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5:
                        console.log('Correos procesados:', emails.length);
                        return [2 /*return*/, emails];
                    case 6:
                        error_1 = _f.sent();
                        console.error('Error al obtener correos:', error_1);
                        throw new Error('No se pudieron obtener los correos');
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    EmailAgent.prototype.sendEmail = function (accessToken, options) {
        return __awaiter(this, void 0, void 0, function () {
            var auth, mimeType, toArray, emailLines, headers, boundary, email, encodedEmail, requestParams, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log('Iniciando envío de correo con opciones:', JSON.stringify(options, null, 2));
                        auth = new googleapis_1.google.auth.OAuth2();
                        auth.setCredentials({ access_token: accessToken });
                        mimeType = options.mimeType || 'text/plain';
                        toArray = Array.isArray(options.to) ? options.to : [options.to];
                        console.log('Destinatarios:', toArray);
                        emailLines = [];
                        headers = [
                            "To: ".concat(toArray.join(', ')),
                            "Subject: ".concat(options.subject),
                            // Importante: añadir cabecera MIME-Version para compatibilidad
                            'MIME-Version: 1.0'
                        ];
                        // Añadir CC y BCC si existen
                        if (options.cc && options.cc.length > 0) {
                            headers.push("Cc: ".concat(options.cc.join(', ')));
                        }
                        if (options.bcc && options.bcc.length > 0) {
                            headers.push("Bcc: ".concat(options.bcc.join(', ')));
                        }
                        // Crear el cuerpo del correo según el tipo MIME
                        if (mimeType === 'text/plain') {
                            headers.push('Content-Type: text/plain; charset=UTF-8');
                            emailLines = __spreadArray(__spreadArray([], headers, true), ['', options.body], false);
                        }
                        else if (mimeType === 'text/html') {
                            headers.push('Content-Type: text/html; charset=UTF-8');
                            emailLines = __spreadArray(__spreadArray([], headers, true), ['', options.body], false);
                        }
                        else if (mimeType === 'multipart/alternative' && options.htmlBody) {
                            boundary = "boundary_".concat(Math.random().toString(36).substring(2));
                            headers.push("Content-Type: multipart/alternative; boundary=".concat(boundary));
                            emailLines = __spreadArray(__spreadArray([], headers, true), [
                                '',
                                "--".concat(boundary),
                                'Content-Type: text/plain; charset=UTF-8',
                                '',
                                options.body,
                                "--".concat(boundary),
                                'Content-Type: text/html; charset=UTF-8',
                                '',
                                options.htmlBody,
                                "--".concat(boundary, "--")
                            ], false);
                        }
                        email = emailLines.join('\r\n');
                        console.log('Email raw (primeros 500 chars):', email.substring(0, 500));
                        encodedEmail = Buffer.from(email).toString('base64')
                            .replace(/\+/g, '-')
                            .replace(/\//g, '_')
                            .replace(/=+$/, '');
                        requestParams = {
                            auth: auth,
                            userId: 'me',
                            requestBody: {
                                raw: encodedEmail,
                                // Asegurar que se guarde en Enviados
                                labelIds: ['SENT']
                            }
                        };
                        console.log('Enviando correo con parámetros:', JSON.stringify({ userId: requestParams.userId, labels: requestParams.requestBody.labelIds }, null, 2));
                        return [4 /*yield*/, this.gmail.users.messages.send(requestParams)];
                    case 1:
                        response = _a.sent();
                        console.log('Correo enviado correctamente:', response.data.id);
                        console.log('Respuesta completa:', JSON.stringify(response.data, null, 2));
                        return [2 /*return*/, {
                                success: true,
                                messageId: response.data.id,
                            }];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error al enviar correo:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: error_2.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return EmailAgent;
}());
exports.EmailAgent = EmailAgent;
