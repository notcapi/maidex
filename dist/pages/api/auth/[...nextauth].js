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
exports.authOptions = void 0;
var next_auth_1 = __importDefault(require("next-auth"));
var google_1 = __importDefault(require("next-auth/providers/google"));
// Obtener la URL base desde la variable de entorno o usar un valor predeterminado
var baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
exports.authOptions = {
    providers: [
        (0, google_1.default)({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
            authorization: {
                params: {
                    // Ampliar los permisos para permitir escritura en Gmail y Calendar
                    scope: 'openid email profile https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/gmail.compose https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/gmail.modify',
                    // Forzar pantalla de consentimiento cada vez para asegurarnos de otorgar todos los permisos
                    prompt: "consent",
                    // Especificar explícitamente la URL de redirección
                    redirect_uri: "".concat(baseUrl, "/api/auth/callback/google"),
                    // Acceso sin conexión para obtener refresh token
                    access_type: 'offline'
                },
            },
        }),
    ],
    callbacks: {
        jwt: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var token = _b.token, account = _b.account;
                return __generator(this, function (_c) {
                    // Guardar el token de acceso y de actualización en el token JWT
                    if (account) {
                        token.accessToken = account.access_token;
                        token.refreshToken = account.refresh_token;
                        token.expiresAt = account.expires_at;
                    }
                    return [2 /*return*/, token];
                });
            });
        },
        session: function (_a) {
            return __awaiter(this, arguments, void 0, function (_b) {
                var session = _b.session, token = _b.token;
                return __generator(this, function (_c) {
                    // Enviar propiedades del token a la sesión del cliente
                    session.accessToken = token.accessToken;
                    return [2 /*return*/, session];
                });
            });
        },
    },
    pages: {
        signIn: '/', // Página de inicio de sesión
        signOut: '/', // Página después de cerrar sesión
        error: '/', // Página de error
    },
    // Configuración para manejo del cierre de sesión
    events: {
        signOut: function (message) { return __awaiter(void 0, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.log('Usuario cerró sesión:', message);
                return [2 /*return*/];
            });
        }); },
    },
    // Asegurarse de que las URLs usadas tengan el puerto correcto
    useSecureCookies: false, // Para desarrollo local
    cookies: {
        sessionToken: {
            name: "next-auth.session-token",
            options: {
                httpOnly: true,
                sameSite: "lax",
                path: "/",
                secure: process.env.NODE_ENV === "production",
            },
        },
    },
    secret: process.env.NEXTAUTH_SECRET || 'asistente_personal_secret_key_123',
    debug: true, // Habilitar logs de depuración
};
exports.default = (0, next_auth_1.default)(exports.authOptions);
