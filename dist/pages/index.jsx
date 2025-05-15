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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Home;
var react_1 = require("react");
var react_2 = require("next-auth/react");
var head_1 = __importDefault(require("next/head"));
var router_1 = require("next/router");
function Home() {
    var _this = this;
    var _a;
    var _b = (0, react_2.useSession)(), session = _b.data, status = _b.status;
    var _c = (0, react_1.useState)(''), summary = _c[0], setSummary = _c[1];
    var _d = (0, react_1.useState)(false), loading = _d[0], setLoading = _d[1];
    var router = (0, router_1.useRouter)();
    // Estado para el chat
    var _e = (0, react_1.useState)([]), messages = _e[0], setMessages = _e[1];
    var _f = (0, react_1.useState)(''), currentMessage = _f[0], setCurrentMessage = _f[1];
    var _g = (0, react_1.useState)(false), processingMessage = _g[0], setProcessingMessage = _g[1];
    // Ref para hacer scroll al último mensaje
    var chatEndRef = (0, react_1.useRef)(null);
    // Scroll al último mensaje cuando se añade uno nuevo
    (0, react_1.useEffect)(function () {
        var _a;
        (_a = chatEndRef.current) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    var getDailySummary = function () { return __awaiter(_this, void 0, void 0, function () {
        var response, data, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setLoading(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    return [4 /*yield*/, fetch('/api/summary')];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data = _a.sent();
                    setSummary(data.summary);
                    return [3 /*break*/, 6];
                case 4:
                    error_1 = _a.sent();
                    console.error('Error al obtener el resumen diario:', error_1);
                    return [3 /*break*/, 6];
                case 5:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    var handleSignOut = function () { return __awaiter(_this, void 0, void 0, function () {
        var error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // Llamar a signOut y luego recargar la página manualmente
                    return [4 /*yield*/, (0, react_2.signOut)({ redirect: false })];
                case 1:
                    // Llamar a signOut y luego recargar la página manualmente
                    _a.sent();
                    // Limpiar cualquier estado local si es necesario
                    setSummary('');
                    setMessages([]);
                    // Recargar la página para asegurar un estado limpio
                    router.push('/');
                    return [3 /*break*/, 3];
                case 2:
                    error_2 = _a.sent();
                    console.error('Error al cerrar sesión:', error_2);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    }); };
    // Enviar mensaje al asistente
    var handleSendMessage = function (e) { return __awaiter(_this, void 0, void 0, function () {
        var userMessage, action, response, data_1, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    e.preventDefault();
                    if (!currentMessage.trim() || processingMessage)
                        return [2 /*return*/];
                    userMessage = currentMessage.trim();
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ role: 'user', content: userMessage }], false); });
                    setCurrentMessage('');
                    setProcessingMessage(true);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, 5, 6]);
                    action = 'chat';
                    if (userMessage.toLowerCase().includes('correo') ||
                        userMessage.toLowerCase().includes('email') ||
                        userMessage.toLowerCase().includes('envía')) {
                        action = 'send_email';
                    }
                    else if (userMessage.toLowerCase().includes('evento') ||
                        userMessage.toLowerCase().includes('calendario') ||
                        userMessage.toLowerCase().includes('crea') &&
                            (userMessage.toLowerCase().includes('cita') ||
                                userMessage.toLowerCase().includes('reunión'))) {
                        action = 'create_event';
                    }
                    return [4 /*yield*/, fetch('/api/actions', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                action: action,
                                prompt: userMessage,
                            }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    data_1 = _a.sent();
                    // Añadir la respuesta del asistente
                    if (data_1.success) {
                        // Usar el mensaje de respuesta en el nuevo formato
                        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ role: 'assistant', content: data_1.message || data_1.result || 'Acción completada con éxito.' }], false); });
                    }
                    else {
                        setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{ role: 'assistant', content: "Error: ".concat(data_1.error || 'Ocurrió un error desconocido') }], false); });
                    }
                    return [3 /*break*/, 6];
                case 4:
                    error_3 = _a.sent();
                    console.error('Error al procesar el mensaje:', error_3);
                    setMessages(function (prev) { return __spreadArray(__spreadArray([], prev, true), [{
                            role: 'assistant',
                            content: 'Lo siento, ha ocurrido un error al procesar tu mensaje.'
                        }], false); });
                    return [3 /*break*/, 6];
                case 5:
                    setProcessingMessage(false);
                    return [7 /*endfinally*/];
                case 6: return [2 /*return*/];
            }
        });
    }); };
    // Mostrar un indicador de carga mientras se verifica el estado de autenticación
    if (status === 'loading') {
        return (<div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Cargando...</div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-100">
      <head_1.default>
        <title>Asistente Personal</title>
        <meta name="description" content="Tu asistente personal inteligente"/>
        <link rel="icon" href="/favicon.ico"/>
      </head_1.default>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Asistente Personal
        </h1>

        {!session ? (<div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-semibold mb-4">Bienvenido</h2>
            <p className="mb-4">
              Inicia sesión para acceder a tu asistente personal.
            </p>
            <button onClick={function () { return (0, react_2.signIn)('google'); }} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
              Iniciar sesión con Google
            </button>
          </div>) : (<div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Hola, {(_a = session.user) === null || _a === void 0 ? void 0 : _a.name}
              </h2>
              <button onClick={handleSignOut} className="text-sm text-gray-600 hover:text-gray-800">
                Cerrar sesión
              </button>
            </div>

            {/* Botón de resumen diario */}
            <div className="mb-6">
              <button onClick={getDailySummary} disabled={loading} className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:bg-green-300">
                {loading ? 'Generando...' : 'Obtener resumen diario'}
              </button>
            </div>

            {summary && (<div className="border rounded-lg p-4 bg-gray-50 mb-6">
                <h3 className="text-lg font-medium mb-2">Tu resumen diario:</h3>
                <div className="whitespace-pre-wrap">{summary}</div>
              </div>)}
            
            {/* Interfaz de chat */}
            <div className="mb-6">
              <div className="border rounded-lg h-96 overflow-y-auto p-4 bg-gray-50 mb-4">
                {messages.length === 0 ? (<div className="text-center text-gray-400 mt-32">
                    <p>Conversa con tu asistente personal.</p>
                    <p className="text-sm mt-2">Puedes pedirle que envíe correos o cree eventos en tu calendario.</p>
                  </div>) : (messages.map(function (msg, i) { return (<div key={i} className={"mb-4 ".concat(msg.role === 'user' ? 'text-right' : 'text-left')}>
                      <div className={"inline-block p-3 rounded-lg max-w-[85%] ".concat(msg.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800')}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>); }))}
                <div ref={chatEndRef}/>
              </div>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input type="text" value={currentMessage} onChange={function (e) { return setCurrentMessage(e.target.value); }} placeholder="Escribe un mensaje..." className="flex-grow p-2 border rounded" disabled={processingMessage}/>
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-300" disabled={processingMessage || currentMessage.trim() === ''}>
                  {processingMessage ? 'Enviando...' : 'Enviar'}
                </button>
              </form>
              
              <div className="mt-3 text-xs text-gray-500">
                <p>Ejemplos:</p>
                <ul className="list-disc list-inside">
                  <li>"Envía un correo a ejemplo@gmail.com con asunto 'Reunión' y mensaje 'Confirmamos la reunión de mañana'"</li>
                  <li>"Crea un evento en mi calendario para mañana a las 10 AM llamado 'Reunión semanal'"</li>
                </ul>
              </div>
            </div>
          </div>)}
      </main>
    </div>);
}
