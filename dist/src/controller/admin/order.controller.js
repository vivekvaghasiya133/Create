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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllOrders = exports.getOrders = exports.assignOrder = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const enum_1 = require("../../enum");
const languageHelper_1 = require("../../language/languageHelper");
const deliveryMan_schema_1 = __importDefault(require("../../models/deliveryMan.schema"));
const order_schema_1 = __importDefault(require("../../models/order.schema"));
const orderAssignee_schema_1 = __importDefault(require("../../models/orderAssignee.schema"));
const common_1 = require("../../utils/common");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const order_validation_1 = require("../../utils/validation/order.validation");
const assignOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, order_validation_1.orderAssignValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        const isCreated = yield order_schema_1.default.findOne({
            orderId: value.orderId,
            status: enum_1.ORDER_HISTORY.CREATED,
        });
        if (!isCreated) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidOrder });
        }
        if (isCreated.status === enum_1.ORDER_HISTORY.DRAFT) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidOrder });
        }
        const checkDeliveryBoyExist = yield deliveryMan_schema_1.default.findById(value.deliveryManId);
        if (!checkDeliveryBoyExist) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').deliveryManNotFound,
            });
        }
        const alreadyAssigned = yield orderAssignee_schema_1.default.findOne({
            order: value.orderId,
            deliveryBoy: value.deliveryManId,
        });
        if (alreadyAssigned) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').orderAlreadyAssigned,
            });
        }
        yield orderAssignee_schema_1.default.create({
            // order: value.orderId, deliveryBoy:value.deliveryManId, customer: isCreated.customer
            order: value.orderId, deliveryBoy: value.deliveryManId, merchant: isCreated.merchant
        });
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').orderAssignedSuccessfully,
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.assignOrder = assignOrder;
const getOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.query, order_validation_1.orderAdminListValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        const Query = {};
        if (value.user) {
            // Query.customer = new mongoose.Types.ObjectId(value.user);
            Query.merchant = new mongoose_1.default.Types.ObjectId(value.user);
        }
        if (value.status) {
            Query.status = value.status;
        }
        if (value.orderId) {
            Query.orderId = value.orderId;
        }
        const data = yield order_schema_1.default.aggregate([
            {
                $match: Query,
            },
            {
                $sort: {
                    createdAt: 1,
                },
            },
            {
                $addFields: Object.assign({}, (value.date && {
                    createdDate: {
                        $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                    },
                })),
            },
            {
                $match: Object.assign({}, (value.date && { createdDate: value.date })),
            },
            {
                $lookup: {
                    from: 'orderAssign',
                    localField: 'orderId',
                    foreignField: 'order',
                    as: 'orderAssignData',
                    pipeline: [
                        {
                            $match: Object.assign({}, (value.deliveryMan && {
                                deliveryBoy: new mongoose_1.default.Types.ObjectId(value.deliveryMan),
                            })),
                        },
                        {
                            $project: {
                                _id: 0,
                                deliveryBoy: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$orderAssignData',
                    preserveNullAndEmptyArrays: true,
                },
            },
            // {
            //   $match: {
            //     orderAssignData: { $exists: true },
            //   },
            // },
            {
                $lookup: {
                    from: 'users',
                    // localField: 'customer',
                    localField: 'merchant',
                    foreignField: '_id',
                    as: 'userData',
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                name: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$userData',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'deliveryMan',
                    localField: 'orderAssignData.deliveryBoy',
                    foreignField: '_id',
                    as: 'deliveryManData',
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                name: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$deliveryManData',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    orderId: 1,
                    customerName: '$userData.name',
                    pickupAddress: '$pickupDetails.address',
                    deliveryAddress: '$deliveryDetails.address',
                    deliveryMan: '$deliveryManData.name',
                    pickupDate: '$pickupDetails.orderTimestamp',
                    deliveryDate: '$deliveryDetails.orderTimestamp',
                    createdDate: '$createdAt',
                    pickupRequest: '$pickupDetails.request',
                    postCode: '$pickupDetails.postCode',
                },
            },
            ...(0, common_1.getMongoCommonPagination)({
                pageCount: value.pageCount,
                pageLimit: value.pageLimit,
            }),
        ]);
        return res.ok({ data: data[0] });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.getOrders = getOrders;
const getAllOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield order_schema_1.default.aggregate([
            {
                $sort: {
                    createdAt: -1,
                },
            },
            {
                $match: {
                    // customer: { $exists: false }
                    merchant: { $exists: false }
                }
            },
            {
                $lookup: {
                    from: 'orderAssign',
                    localField: 'orderId',
                    foreignField: 'order',
                    as: 'orderAssignData',
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                deliveryBoy: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$orderAssignData',
                    preserveNullAndEmptyArrays: true,
                },
            },
            // {
            //   $match: {
            //     orderAssignData: { $exists: true },
            //   },
            // },
            {
                $lookup: {
                    from: 'users',
                    // localField: 'customer',
                    localField: 'merchant',
                    foreignField: '_id',
                    as: 'userData',
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                name: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$userData',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'deliveryMan',
                    localField: 'orderAssignData.deliveryBoy',
                    foreignField: '_id',
                    as: 'deliveryManData',
                    pipeline: [
                        {
                            $project: {
                                _id: 0,
                                name: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: '$deliveryManData',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 1,
                    orderId: 1,
                    customerName: '$userData.name',
                    pickupAddress: '$pickupDetails',
                    deliveryAddress: '$deliveryDetails',
                    deliveryMan: '$deliveryManData.name',
                    pickupDate: '$pickupDetails.orderTimestamp',
                    deliveryDate: '$deliveryDetails.orderTimestamp',
                    createdDate: '$createdAt',
                    pickupRequest: '$pickupDetails.request',
                    postCode: '$pickupDetails.postCode',
                    status: 1
                },
            },
        ]);
        return res.ok({ data: data });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.getAllOrders = getAllOrders;
