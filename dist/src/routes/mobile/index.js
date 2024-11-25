"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mobile_auth_1 = __importDefault(require("../../middleware/mobile.auth"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const order_routes_1 = __importDefault(require("./order.routes"));
const subscription_routes_1 = __importDefault(require("./subscription.routes"));
const router = express_1.default.Router();
router.use('/auth', auth_routes_1.default);
router.use(mobile_auth_1.default);
router.use('/order', order_routes_1.default);
router.use('/subscription', subscription_routes_1.default);
// router.use('/order', orderRoutes);
exports.default = router;
