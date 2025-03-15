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
test_1.test.describe('Login Page', function () {
    (0, test_1.test)('page loads correctly', function (_a) {
        var page = _a.page;
        return __awaiter(void 0, void 0, void 0, function () {
            var title, privateKeyInput;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: 
                    // Navigate to the root path since the login may be the default route
                    return [4 /*yield*/, page.goto('/')];
                    case 1:
                        // Navigate to the root path since the login may be the default route
                        _b.sent();
                        // Add a pause for debugging if needed
                        // await page.pause();
                        // Take a screenshot to see what's being rendered
                        return [4 /*yield*/, page.screenshot({ path: 'screenshot.png' })];
                    case 2:
                        // Add a pause for debugging if needed
                        // await page.pause();
                        // Take a screenshot to see what's being rendered
                        _b.sent();
                        title = page.locator('h1:has-text("Nostr Wallet")');
                        return [4 /*yield*/, (0, test_1.expect)(title).toBeVisible({ timeout: 15000 })];
                    case 3:
                        _b.sent();
                        // Check login tabs are present
                        return [4 /*yield*/, (0, test_1.expect)(page.getByRole('button', { name: 'Login' })).toBeVisible()];
                    case 4:
                        // Check login tabs are present
                        _b.sent();
                        return [4 /*yield*/, (0, test_1.expect)(page.getByRole('button', { name: 'Create Account' })).toBeVisible()];
                    case 5:
                        _b.sent();
                        // Check login method toggle is present
                        return [4 /*yield*/, (0, test_1.expect)(page.getByRole('button', { name: 'Browser Extension' })).toBeVisible()];
                    case 6:
                        // Check login method toggle is present
                        _b.sent();
                        return [4 /*yield*/, (0, test_1.expect)(page.getByRole('button', { name: 'Private Key' })).toBeVisible()];
                    case 7:
                        _b.sent();
                        // Test tab switching works
                        return [4 /*yield*/, page.getByRole('button', { name: 'Create Account' }).click()];
                    case 8:
                        // Test tab switching works
                        _b.sent();
                        return [4 /*yield*/, (0, test_1.expect)(page.locator('input#name')).toBeVisible()];
                    case 9:
                        _b.sent();
                        // Switch back to login
                        return [4 /*yield*/, page.getByRole('button', { name: 'Login' }).click()];
                    case 10:
                        // Switch back to login
                        _b.sent();
                        return [4 /*yield*/, (0, test_1.expect)(page.getByRole('button', { name: 'Connect with Extension' })).toBeVisible()];
                    case 11:
                        _b.sent();
                        // Test login method toggle works
                        return [4 /*yield*/, page.getByRole('button', { name: 'Private Key' }).click()];
                    case 12:
                        // Test login method toggle works
                        _b.sent();
                        privateKeyInput = page.locator('input[placeholder="Enter your nsec private key"]');
                        return [4 /*yield*/, (0, test_1.expect)(privateKeyInput).toBeVisible()];
                    case 13:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    });
});
