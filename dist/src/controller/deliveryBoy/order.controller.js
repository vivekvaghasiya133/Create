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
exports.getOrderById = exports.OrderAssigneeSchemaData = exports.deliverOrder = exports.sendEmailOrMobileOtp = exports.pickUpOrder = exports.departOrder = exports.arriveOrder = exports.acceptOrder = exports.getAssignedOrders = void 0;
const enum_1 = require("../../enum");
const languageHelper_1 = require("../../language/languageHelper");
const admin_schema_1 = __importDefault(require("../../models/admin.schema"));
const city_schema_1 = __importDefault(require("../../models/city.schema"));
const deliveryMan_schema_1 = __importDefault(require("../../models/deliveryMan.schema"));
const order_schema_1 = __importDefault(require("../../models/order.schema"));
const orderAssignee_schema_1 = __importDefault(require("../../models/orderAssignee.schema"));
const orderHistory_schema_1 = __importDefault(require("../../models/orderHistory.schema"));
const otp_schema_1 = __importDefault(require("../../models/otp.schema"));
const paymentInfo_schema_1 = __importDefault(require("../../models/paymentInfo.schema"));
const productCharges_schema_1 = __importDefault(require("../../models/productCharges.schema"));
const common_1 = require("../../utils/common");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const order_validation_1 = require("../../utils/validation/order.validation");
const getAssignedOrders = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.query, order_validation_1.orderListByDeliveryManValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        const query = {
            deliveryBoy: req.id,
        };
        // If 'status' is provided, add it to the query, otherwise don't filter by status
        if (value.status) {
            query.status = value.status;
        }
        if (value.startDate && value.endDate) {
            const startDate = new Date(value.startDate);
            const endDate = new Date(value.endDate);
            endDate.setHours(23, 59, 59, 999);
            query.createdAt = {
                $gte: startDate,
                $lte: endDate,
            };
        }
        console.log('Constructed Query: ', query);
        const data = yield orderAssignee_schema_1.default.aggregate([
            {
                $match: query,
            },
            {
                $lookup: {
                    from: 'orders',
                    localField: 'order',
                    foreignField: 'orderId',
                    as: 'orderData',
                },
            },
            {
                $unwind: {
                    path: '$orderData',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $project: {
                    _id: 0,
                    order: '$orderData',
                    deliveryBoy: 1,
                    status: 1,
                    createdAt: 1,
                },
            },
        ]);
        return res.ok({ data });
    }
    catch (error) {
        // Handle errors and send failure response
        console.error('Error occurred: ', error);
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.getAssignedOrders = getAssignedOrders;
const acceptOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, order_validation_1.orderAcceptValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        value.deliveryManId = req.id.toString();
        const isCreated = yield order_schema_1.default.findOne({
            orderId: value.orderId,
            status: { $eq: enum_1.ORDER_HISTORY.CREATED },
        });
        if (!isCreated) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidOrder });
        }
        const isAssigned = yield orderAssignee_schema_1.default.findOne({
            order: value.orderId,
            deliveryBoy: value.deliveryManId,
        });
        if (!isAssigned) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').orderAlreadyAssigned,
            });
        }
        yield orderAssignee_schema_1.default.findByIdAndUpdate(isAssigned._id, {
            $set: { status: value.status },
        });
        if (value.status === enum_1.ORDER_REQUEST.ACCEPTED) {
            yield order_schema_1.default.findOneAndUpdate({ orderId: value.orderId }, {
                $set: { status: enum_1.ORDER_HISTORY.ASSIGNED },
            });
            const data = yield deliveryMan_schema_1.default.findById(value.deliveryManId, {
                _id: 0,
                name: 1,
            });
            yield orderHistory_schema_1.default.create({
                message: `Your order ${value.orderId} has been assigned to ${data.firstName}`,
                order: value.orderId,
                status: enum_1.ORDER_HISTORY.ASSIGNED,
                merchantID: isCreated.merchant,
            });
        }
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').orderUpdatedSuccessfully,
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.acceptOrder = acceptOrder;
const arriveOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, order_validation_1.orderArriveValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        value.deliveryManId = req.id.toString();
        const isCreated = yield order_schema_1.default.findOne({
            orderId: value.orderId,
            status: { $eq: enum_1.ORDER_HISTORY.ASSIGNED },
        });
        if (!isCreated) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidOrder });
        }
        const isAssigned = yield orderAssignee_schema_1.default.findOne({
            order: value.orderId,
            deliveryBoy: value.deliveryManId,
        });
        if (!isAssigned) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').invalidDeliveryMan,
            });
        }
        yield order_schema_1.default.findOneAndUpdate({ orderId: value.orderId }, {
            $set: { status: enum_1.ORDER_HISTORY.ARRIVED },
        });
        yield orderHistory_schema_1.default.create({
            message: `Your order ${value.orderId} has been arrived`,
            order: value.orderId,
            status: enum_1.ORDER_HISTORY.ARRIVED,
            merchantID: isCreated.merchant,
        });
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').orderUpdatedSuccessfully,
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.arriveOrder = arriveOrder;
const departOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, order_validation_1.orderArriveValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        value.deliveryManId = req.id.toString();
        const isCreated = yield order_schema_1.default.findOne({
            orderId: value.orderId,
            status: { $eq: enum_1.ORDER_HISTORY.PICKED_UP },
        });
        if (!isCreated) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidOrder });
        }
        const isAssigned = yield orderAssignee_schema_1.default.findOne({
            order: value.orderId,
            deliveryBoy: value.deliveryManId,
        });
        if (!isAssigned) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').invalidDeliveryMan,
            });
        }
        yield order_schema_1.default.findOneAndUpdate({ orderId: value.orderId }, {
            $set: { status: enum_1.ORDER_HISTORY.DEPARTED },
        });
        yield orderHistory_schema_1.default.create({
            message: `Your order ${value.orderId} has been out for delivery`,
            order: value.orderId,
            status: enum_1.ORDER_HISTORY.DEPARTED,
            merchantID: isCreated.merchant,
        });
        // io.to(`order_${value.orderId}`).emit('locationUpdate', {
        //   latitude: value.latitude,
        //   longitude: value.longitude,
        //   deliveryManId: req.id,
        // });
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').orderUpdatedSuccessfully,
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.departOrder = departOrder;
const pickUpOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, order_validation_1.orderPickUpValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        const isArrived = yield order_schema_1.default.findOne({
            orderId: value.orderId,
            status: enum_1.ORDER_HISTORY.ARRIVED,
        });
        if (!isArrived) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').errorOrderArrived });
        }
        const otpData = yield otp_schema_1.default.findOne({
            value: value.otp,
            customerEmail: isArrived.pickupDetails.email,
            expiry: { $gte: Date.now() },
        });
        if (!otpData) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').otpExpired });
        }
        const signDocs = value.userSignature.split(',');
        value.userSignature = yield (0, common_1.uploadFile)(signDocs[0], signDocs[1], 'USER-SIGNATURE');
        yield order_schema_1.default.findOneAndUpdate({ orderId: value.orderId }, {
            $set: {
                'pickupDetails.userSignature': value.userSignature,
                'pickupDetails.orderTimestamp': value.pickUpTimestamp,
                status: enum_1.ORDER_HISTORY.PICKED_UP,
            },
        });
        if (isArrived.pickupDetails.cashOnDelivery) {
            yield paymentInfo_schema_1.default.updateOne({ order: value.orderId }, { $set: { status: enum_1.PAYMENT_INFO.SUCCESS } });
        }
        yield orderHistory_schema_1.default.create({
            message: 'Delivery Person has been arrived at pick up location and waiting for client',
            order: value.orderId,
            status: enum_1.ORDER_HISTORY.PICKED_UP,
            merchantID: isArrived.merchant,
        });
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').orderUpdatedSuccessfully,
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.pickUpOrder = pickUpOrder;
const sendEmailOrMobileOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, order_validation_1.orderIdValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        const orderExist = yield order_schema_1.default.findOne({
            orderId: value.orderId,
            status: { $ne: enum_1.ORDER_HISTORY.DELIVERED },
        });
        if (!orderExist) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').invalidOrder,
            });
        }
        const otp = process.env.ENV === 'DEV' ? 999999 : (0, common_1.generateIntRandomNo)(111111, 999999);
        if (process.env.ENV !== 'DEV') {
            yield (0, common_1.emailOrMobileOtp)(orderExist.pickupDetails.email, `This is your otp for identity verification ${otp}`);
        }
        const isAtPickUp = orderExist.status === enum_1.ORDER_HISTORY.ARRIVED;
        const email = isAtPickUp
            ? orderExist.pickupDetails.email
            : orderExist.deliveryDetails.email;
        const contactNumber = isAtPickUp
            ? orderExist.pickupDetails.mobileNumber
            : orderExist.deliveryDetails.mobileNumber;
        yield otp_schema_1.default.updateOne({
            value: otp,
            customerEmail: email,
            customerMobile: contactNumber,
        }, {
            value: otp,
            customerEmail: email,
            customerMobile: contactNumber,
            expiry: Date.now() + 600000,
        }, { upsert: true });
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').otpSentSuccess,
            data: process.env.ENV !== 'DEV' ? {} : { otp },
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.sendEmailOrMobileOtp = sendEmailOrMobileOtp;
const deliverOrder = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, order_validation_1.orderDeliverValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        const isArrived = yield order_schema_1.default.findOne({
            orderId: value.orderId,
            status: enum_1.ORDER_HISTORY.DEPARTED,
        });
        if (!isArrived) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidOrder });
        }
        const otpData = yield otp_schema_1.default.findOne({
            value: value.otp,
            customerEmail: isArrived.deliveryDetails.email,
            expiry: { $gte: Date.now() },
        });
        if (!otpData) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').otpExpired });
        }
        const signDocs = value.deliveryManSignature.split(',');
        value.deliveryManSignature = yield (0, common_1.uploadFile)(signDocs[0], signDocs[1], 'USER-SIGNATURE');
        const [paymentInfo] = yield Promise.all([
            paymentInfo_schema_1.default.findOne({ order: value.orderId }),
            order_schema_1.default.updateOne({ orderId: value.orderId }, {
                $set: {
                    'deliveryDetails.deliveryBoySignature': value.deliveryManSignature,
                    'deliveryDetails.orderTimestamp': value.deliverTimestamp,
                    status: enum_1.ORDER_HISTORY.DELIVERED,
                },
            }),
        ]);
        const admin = yield admin_schema_1.default.findOne();
        const assignData = yield orderAssignee_schema_1.default.findOne({
            order: value.orderId,
        });
        const city = yield city_schema_1.default.findById(isArrived.city);
        const chargeData = yield productCharges_schema_1.default.findOne({
            cityId: city._id,
            pickupRequest: isArrived.pickupDetails.request,
            isCustomer: isArrived.isCustomer,
        });
        const adminCommission = city.commissionType === enum_1.CHARGE_TYPE.PERCENTAGE
            ? isArrived.totalCharge * (chargeData.adminCommission / 100)
            : chargeData.adminCommission;
        const message = `Order ${value.orderId} Amount`;
        if (isArrived.deliveryDetails.cashOnDelivery) {
            if (paymentInfo.status !== enum_1.PAYMENT_INFO.SUCCESS) {
                yield paymentInfo_schema_1.default.updateOne({ order: value.orderId }, { $set: { status: enum_1.PAYMENT_INFO.SUCCESS } });
            }
            yield (0, common_1.updateWallet)(adminCommission, admin._id.toString(), req.id.toString(), enum_1.TRANSACTION_TYPE.WITHDRAW, `Order ${value.orderId} Admin Commission`, false);
        }
        else if (paymentInfo.paymentThrough === enum_1.PAYMENT_TYPE.WALLET) {
            yield Promise.all([
                (0, common_1.updateWallet)(isArrived.totalCharge, admin._id.toString(), 
                // assignData.customer.toString(),
                assignData.merchant.toString(), enum_1.TRANSACTION_TYPE.WITHDRAW, message),
                (0, common_1.updateWallet)(isArrived.totalCharge - adminCommission, admin._id.toString(), req.id.toString(), enum_1.TRANSACTION_TYPE.DEPOSIT, message, false),
            ]);
        }
        else if (paymentInfo.paymentThrough === enum_1.PAYMENT_TYPE.ONLINE) {
            yield (0, common_1.updateWallet)(isArrived.totalCharge - adminCommission, admin._id.toString(), req.id.toString(), enum_1.TRANSACTION_TYPE.DEPOSIT, message, false);
        }
        else {
            yield (0, common_1.updateWallet)(adminCommission, admin._id.toString(), req.id.toString(), enum_1.TRANSACTION_TYPE.WITHDRAW, `Order ${value.orderId} Admin Commission`, false);
        }
        yield orderHistory_schema_1.default.create({
            message: `Your order ${value.orderId} has been successfully delivered`,
            order: value.orderId,
            status: enum_1.ORDER_HISTORY.DELIVERED,
            merchantID: isArrived.merchant,
        });
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').orderUpdatedSuccessfully,
        });
    }
    catch (error) {
        console.log('🚀 ~ deliverOrder ~ error:', error);
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.deliverOrder = deliverOrder;
const OrderAssigneeSchemaData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield orderAssignee_schema_1.default.find();
        res.status(200).json({
            data: data,
        });
    }
    catch (error) {
        console.log('🚀 ~ deliverOrder ~ error:', error);
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.OrderAssigneeSchemaData = OrderAssigneeSchemaData;
const getOrderById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orderId } = req.params; // Extract orderId from the request parameters
        console.log(orderId);
        const data = yield order_schema_1.default
            .findById(orderId)
            .populate('country')
            .populate('city')
            .populate('vehicle');
        // Set city and country to null
        if (data) {
            data.city = null;
            data.country = null;
        }
        return res.ok({ data: data }); // Return the single order (since it's by ID)
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.getOrderById = getOrderById;
