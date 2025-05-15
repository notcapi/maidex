"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
require("../styles/globals.css");
var react_1 = require("next-auth/react");
function MyApp(_a) {
    var Component = _a.Component, _b = _a.pageProps, session = _b.session, pageProps = __rest(_b, ["session"]);
    return (<react_1.SessionProvider session={session}>
      <Component {...pageProps}/>
    </react_1.SessionProvider>);
}
exports.default = MyApp;
