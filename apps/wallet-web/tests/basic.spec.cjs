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
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
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
exports.__esModule = true;
var test_1 = require("@playwright/test");
(0, test_1.test)('basic page load test', function (_a) {
    var page = _a.page;
    return __awaiter(void 0, void 0, void 0, function () {
        var _b, _c, _d, html;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0: 
                // Navigate to the root path
                return [4 /*yield*/, page.goto('/')];
                case 1:
                    // Navigate to the root path
                    _e.sent();
                    // Take a screenshot to see what's rendered
                    return [4 /*yield*/, page.screenshot({ path: 'basic-screenshot.png' })];
                case 2:
                    // Take a screenshot to see what's rendered
                    _e.sent();
                    // Print out the page title
                    _c = (_b = console).log;
                    _d = ['Page title:'];
                    return [4 /*yield*/, page.title()];
                case 3:
                    // Print out the page title
                    _c.apply(_b, _d.concat([_e.sent()]));
                    return [4 /*yield*/, page.content()];
                case 4:
                    html = _e.sent();
                    console.log('Page content sample:', html.substring(0, 500) + '...');
                    // Basic assertion to check the page loaded something
                    return [4 /*yield*/, (0, test_1.expect)(page).toHaveURL(/.*\/$/)];
                case 5:
                    // Basic assertion to check the page loaded something
                    _e.sent();
                    return [2 /*return*/];
            }
        });
    });
});
