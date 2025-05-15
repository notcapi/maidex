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
exports.CalendarAgent = void 0;
var googleapis_1 = require("googleapis");
var CalendarAgent = /** @class */ (function () {
    function CalendarAgent() {
        this.calendar = googleapis_1.google.calendar('v3');
    }
    CalendarAgent.prototype.getTodayEvents = function (accessToken) {
        return __awaiter(this, void 0, void 0, function () {
            var auth, now, startOfPeriod, endDate, endOfPeriod, calendarsList, allEvents, _loop_1, this_1, _i, _a, cal, response, events, error_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 9, , 10]);
                        auth = new googleapis_1.google.auth.OAuth2();
                        auth.setCredentials({ access_token: accessToken });
                        now = new Date();
                        startOfPeriod = now.toISOString();
                        endDate = new Date(now);
                        endDate.setHours(now.getHours() + 24);
                        endOfPeriod = endDate.toISOString();
                        console.log('Buscando eventos entre:', startOfPeriod, 'y', endOfPeriod);
                        console.log('Fecha actual del servidor:', now.toISOString());
                        return [4 /*yield*/, this.calendar.calendarList.list({
                                auth: auth
                            })];
                    case 1:
                        calendarsList = _b.sent();
                        allEvents = [];
                        if (!(calendarsList.data.items && calendarsList.data.items.length > 0)) return [3 /*break*/, 6];
                        _loop_1 = function (cal) {
                            var response, eventsWithCalendar;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        if (!cal.id) return [3 /*break*/, 2];
                                        console.log("Buscando eventos en calendario: ".concat(cal.summary, " (").concat(cal.id, ")"));
                                        return [4 /*yield*/, this_1.calendar.events.list({
                                                auth: auth,
                                                calendarId: cal.id,
                                                timeMin: startOfPeriod,
                                                timeMax: endOfPeriod,
                                                singleEvents: true,
                                                orderBy: 'startTime',
                                                maxResults: 20, // Eventos por calendario
                                            })];
                                    case 1:
                                        response = _c.sent();
                                        // Si hay eventos, añadirlos al array general con información del calendario
                                        if (response.data.items && response.data.items.length > 0) {
                                            eventsWithCalendar = response.data.items.map(function (event) { return (__assign(__assign({}, event), { calendarName: cal.summary || 'Sin nombre', calendarId: cal.id })); });
                                            allEvents = __spreadArray(__spreadArray([], allEvents, true), eventsWithCalendar, true);
                                            console.log("Encontrados ".concat(eventsWithCalendar.length, " eventos en ").concat(cal.summary));
                                        }
                                        _c.label = 2;
                                    case 2: return [2 /*return*/];
                                }
                            });
                        };
                        this_1 = this;
                        _i = 0, _a = calendarsList.data.items;
                        _b.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 5];
                        cal = _a[_i];
                        return [5 /*yield**/, _loop_1(cal)];
                    case 3:
                        _b.sent();
                        _b.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [3 /*break*/, 8];
                    case 6: return [4 /*yield*/, this.calendar.events.list({
                            auth: auth,
                            calendarId: 'primary',
                            timeMin: startOfPeriod,
                            timeMax: endOfPeriod,
                            singleEvents: true,
                            orderBy: 'startTime',
                            maxResults: 50,
                        })];
                    case 7:
                        response = _b.sent();
                        if (response.data.items) {
                            allEvents = response.data.items;
                        }
                        _b.label = 8;
                    case 8:
                        console.log('Total de eventos encontrados:', allEvents.length);
                        events = allEvents.map(function (event) {
                            var _a;
                            return ({
                                id: event.id,
                                summary: event.summary || 'Sin título',
                                description: event.description,
                                start: event.start,
                                end: event.end,
                                location: event.location,
                                status: event.status,
                                calendarName: event.calendarName || 'Calendario principal',
                                attendees: (_a = event.attendees) === null || _a === void 0 ? void 0 : _a.map(function (attendee) { return ({
                                    email: attendee.email,
                                    name: attendee.displayName,
                                    responseStatus: attendee.responseStatus,
                                }); }),
                            });
                        }) || [];
                        console.log('Eventos procesados:', events.length);
                        return [2 /*return*/, events];
                    case 9:
                        error_1 = _b.sent();
                        console.error('Error al obtener eventos del calendario:', error_1);
                        throw new Error('No se pudieron obtener los eventos del calendario');
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    CalendarAgent.prototype.createEvent = function (accessToken, options) {
        return __awaiter(this, void 0, void 0, function () {
            var auth, startDateTime, endDateTime, event_1, calendarId, response, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        auth = new googleapis_1.google.auth.OAuth2();
                        auth.setCredentials({ access_token: accessToken });
                        startDateTime = typeof options.start === 'string'
                            ? options.start
                            : options.start.toISOString();
                        endDateTime = typeof options.end === 'string'
                            ? options.end
                            : options.end.toISOString();
                        event_1 = {
                            summary: options.summary,
                            description: options.description,
                            location: options.location,
                            start: {
                                dateTime: startDateTime,
                                timeZone: 'Europe/Madrid'
                            },
                            end: {
                                dateTime: endDateTime,
                                timeZone: 'Europe/Madrid'
                            }
                        };
                        // Añadir participantes si se han especificado
                        if (options.attendees && options.attendees.length > 0) {
                            event_1.attendees = options.attendees.map(function (attendee) { return ({
                                email: attendee.email,
                                optional: attendee.optional
                            }); });
                        }
                        // Configurar recordatorios si se han especificado
                        if (options.reminders) {
                            event_1.reminders = {
                                useDefault: options.reminders.useDefault !== undefined ? options.reminders.useDefault : true
                            };
                            if (options.reminders.overrides && options.reminders.overrides.length > 0) {
                                event_1.reminders.overrides = options.reminders.overrides;
                            }
                        }
                        calendarId = options.calendarId || 'primary';
                        return [4 /*yield*/, this.calendar.events.insert({
                                auth: auth,
                                calendarId: calendarId,
                                requestBody: event_1
                            })];
                    case 1:
                        response = _a.sent();
                        console.log('Evento creado correctamente:', response.data.id);
                        return [2 /*return*/, {
                                success: true,
                                eventId: response.data.id,
                                htmlLink: response.data.htmlLink
                            }];
                    case 2:
                        error_2 = _a.sent();
                        console.error('Error al crear evento:', error_2);
                        return [2 /*return*/, {
                                success: false,
                                error: error_2.message
                            }];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return CalendarAgent;
}());
exports.CalendarAgent = CalendarAgent;
