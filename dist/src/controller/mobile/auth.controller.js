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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getorderHistory = exports.getOrderCounts = exports.getAllDeliveryManOfMerchant = exports.updateProfileOfMerchant = exports.getProfileOfMerchant = exports.getLocationOfMerchant = exports.logout = exports.renewToken = exports.sendEmailOrMobileOtp = exports.activateFreeSubcription = exports.signIn = exports.signUp = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const jsonwebtoken_1 = require("jsonwebtoken");
const enum_1 = require("../../enum");
const languageHelper_1 = require("../../language/languageHelper");
const authToken_schema_1 = __importDefault(require("../../models/authToken.schema"));
const currency_schema_1 = __importDefault(require("../../models/currency.schema"));
const deliveryMan_schema_1 = __importDefault(require("../../models/deliveryMan.schema"));
const otp_schema_1 = __importDefault(require("../../models/otp.schema"));
const subcription_schema_1 = __importDefault(require("../../models/subcription.schema"));
const subcriptionPurchase_schema_1 = __importDefault(require("../../models/subcriptionPurchase.schema"));
const user_schema_1 = __importDefault(require("../../models/user.schema"));
const orderHistory_schema_1 = __importDefault(require("../../models/orderHistory.schema"));
const common_1 = require("../../utils/common");
const validateRequest_1 = __importDefault(require("../../utils/validateRequest"));
const auth_validation_1 = require("../../utils/validation/auth.validation");
const orderHistory_schema_2 = __importDefault(require("../../models/orderHistory.schema"));
const order_schema_1 = __importDefault(require("../../models/order.schema"));
const orderAssignee_schema_1 = __importDefault(require("../../models/orderAssignee.schema"));
const signUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, auth_validation_1.userSignUpValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        // const assetsFile = req.file;
        const { value } = validateRequest;
        const userExist = yield user_schema_1.default.findOne({ email: value.email });
        if (userExist) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').emailRegisteredAlready,
            });
        }
        if (!value.image) {
            value.image = process.env.DEFAULT_PROFILE_IMAGE;
        }
        else {
            const Image = value.image.split(',');
            value.image = yield (0, common_1.uploadFile)(Image[0], Image[1], 'MERCHANT(USER)-PROFILE');
        }
        const otpData = yield otp_schema_1.default.findOne({
            value: value.otp,
            customerEmail: value.email,
            expiry: { $gte: Date.now() },
        });
        if (!otpData) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').otpExpired });
        }
        const certificate = yield user_schema_1.default.findOne({
            medicalCertificateNumber: value.medicalCertificateNumber,
        });
        if (certificate) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').certificateRegisteredAlready,
            });
        }
        // value.medicalCertificate = path.join('uploads/', assetsFile.filename);
        // if (value?.medicalCertificate) {
        //   const Image = value.medicalCertificate.split(',');
        //   value.medicalCertificate = await uploadFile(Image[0], Image[1], 'MERCHANT-MEDICALCER');
        // }
        value.password = yield (0, common_1.encryptPassword)({ password: value.password });
        yield user_schema_1.default.create(value);
        return res.ok({ message: (0, languageHelper_1.getLanguage)('en').userRegistered });
    }
    catch (error) {
        console.log('error', error);
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.signUp = signUp;
const signIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, auth_validation_1.userSignInValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        let userExist;
        const isCustomer = value.personType === enum_1.PERSON_TYPE.CUSTOMER;
        if (isCustomer) {
            userExist = yield user_schema_1.default.findOne({ email: value.email }).lean();
        }
        else {
            userExist = yield deliveryMan_schema_1.default
                .findOne({ email: value.email })
                .lean();
        }
        if (!userExist) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').invalidLoginCredentials,
            });
        }
        const isVerifyPassword = yield (0, common_1.passwordValidation)(value.password, userExist.password);
        console.log('🚀 ~ signIn ~ isVerifyPassword:', isVerifyPassword);
        if (!isVerifyPassword) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').invalidLoginCredentials,
            });
        }
        const { accessToken, refreshToken } = (0, common_1.createAuthTokens)(userExist._id);
        const { bankData, providerId } = userExist, userData = __rest(userExist, ["bankData", "providerId"]);
        const currency = yield currency_schema_1.default.findOne({}, { _id: 0, name: 1, symbol: 1, position: 1 });
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').loginSuccessfully,
            data: {
                userData,
                userAuthData: { accessToken, refreshToken },
                currency,
            },
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.signIn = signIn;
const activateFreeSubcription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, auth_validation_1.activateFreeSubcriptionValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        const userExist = yield user_schema_1.default.findOne({
            _id: value.userId,
            medicalCertificateNumber: value.medicalCertificateNumber,
        });
        if (!userExist) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').userNotRegistered,
            });
        }
        if (!(yield user_schema_1.default.findOne({
            medicalCertificateNumber: value.medicalCertificateNumber,
        }))) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').certificateNumberRegistered,
            });
        }
        const checkSubcriptionAlreadyExist = yield subcriptionPurchase_schema_1.default.findOne({
            // customer: req.id,
            merchant: req.id,
            expiry: { $gte: new Date() },
        });
        if (checkSubcriptionAlreadyExist) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').errorSubcriptionAlreadyExist,
            });
        }
        const document = value.medicalCertificate.split(',');
        value.medicalCertificate = yield (0, common_1.uploadFile)(document[0], document[1], 'USER-CERTIFICATE');
        const data = yield subcription_schema_1.default.findOne({ amount: 0, isActive: true });
        if (!data) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').errorDataNotFound });
        }
        yield Promise.all([
            subcriptionPurchase_schema_1.default.create({
                subcriptionId: data._id,
                // customer: userExist._id,
                merchant: userExist._id,
                expiry: Date.now() + data.seconds * 1000, // 2592000
                status: 'APPROVED',
            }),
            user_schema_1.default.updateOne({
                _id: req.id,
            }, { $set: { medicalCertificate: value.medicalCertificate } }),
        ]);
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').accountActiveSuccessfully,
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.activateFreeSubcription = activateFreeSubcription;
const sendEmailOrMobileOtp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, auth_validation_1.otpVerifyValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        let userExist;
        const isCustomer = value.personType === enum_1.PERSON_TYPE.CUSTOMER;
        if (isCustomer) {
            userExist = yield user_schema_1.default.findOne({
                email: value.email,
                contactNumber: value.contactNumber,
                countryCode: value.countryCode,
            });
        }
        else {
            userExist = yield deliveryMan_schema_1.default.findOne({
                email: value.email,
                contactNumber: value.contactNumber,
                countryCode: value.countryCode,
            });
        }
        if (userExist) {
            return res.badRequest({
                message: (0, languageHelper_1.getLanguage)('en').emailRegisteredAlready,
            });
        }
        const otp = process.env.ENV === 'DEV' ? 999999 : (0, common_1.generateIntRandomNo)(111111, 999999);
        if (process.env.ENV !== 'DEV') {
            yield (0, common_1.emailOrMobileOtp)(value.email, `This is your otp for registration ${otp}`);
        }
        const data = yield otp_schema_1.default.updateOne({
            value: otp,
            customerEmail: value.email,
            customerMobile: value.contactNumber,
            action: value.personType,
        }, {
            value: otp,
            customerEmail: value.email,
            customerMobile: value.contactNumber,
            expiry: Date.now() + 600000,
            action: value.personType,
        }, { upsert: true });
        if (!data.upsertedCount && !data.modifiedCount) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidData });
        }
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
const renewToken = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, auth_validation_1.renewTokenValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        const data = (0, jsonwebtoken_1.verify)(value.refreshToken, process.env.REFRESH_SECRET_KEY);
        if (!(data === null || data === void 0 ? void 0 : data.accessToken)) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidToken });
        }
        const isCustomer = value.personType === enum_1.PERSON_TYPE.CUSTOMER;
        let userVerify;
        if (isCustomer) {
            userVerify = yield user_schema_1.default.findById(data.id);
        }
        else {
            userVerify = yield deliveryMan_schema_1.default.findById(data.id);
        }
        if (!userVerify) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidToken });
        }
        yield authToken_schema_1.default.create({
            accessToken: data.accessToken,
            refreshToken: value.refreshToken,
        });
        const { accessToken, refreshToken } = (0, common_1.createAuthTokens)(userVerify._id);
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').renewTokenSuccessfully,
            data: { accessToken, refreshToken },
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.renewToken = renewToken;
const logout = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateRequest = (0, validateRequest_1.default)(req.body, auth_validation_1.renewTokenValidation);
        if (!validateRequest.isValid) {
            return res.badRequest({ message: validateRequest.message });
        }
        const { value } = validateRequest;
        const data = (0, jsonwebtoken_1.verify)(value.refreshToken, process.env.REFRESH_SECRET_KEY);
        if (!(data === null || data === void 0 ? void 0 : data.accessToken)) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidToken });
        }
        const isCustomer = value.personType === enum_1.PERSON_TYPE.CUSTOMER;
        let userVerify;
        if (isCustomer) {
            userVerify = yield user_schema_1.default.findById(data.id);
        }
        else {
            userVerify = yield deliveryMan_schema_1.default.findById(data.id);
        }
        if (!userVerify) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidToken });
        }
        const checkTokenExist = yield authToken_schema_1.default.findOne({
            accessToken: data.accessToken,
            refreshToken: value.refreshToken,
            isActive: false,
        });
        if (checkTokenExist) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').invalidToken });
        }
        yield authToken_schema_1.default.create({
            accessToken: data.accessToken,
            refreshToken: value.refreshToken,
        });
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').logoutSuccessfully,
        });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.logout = logout;
const getLocationOfMerchant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const pickupLocation = yield user_schema_1.default.find({}, 'name contactNumber countryCode address');
        const formattedData = pickupLocation
            .map((location) => {
            const { name, contactNumber, countryCode, address } = location;
            if (address && address.street && address.city && address.country) {
                const fullAddress = `${address.street} ${address.city} ${address.country}`.trim(); // Combine address fields
                return {
                    name,
                    contactNumber,
                    countryCode,
                    address: fullAddress,
                };
            }
            return null;
        })
            .filter(Boolean);
        return res.ok({ data: formattedData });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.getLocationOfMerchant = getLocationOfMerchant;
const getProfileOfMerchant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('user', req.params.id);
        const data = yield user_schema_1.default.find({ _id: req.params.id });
        console.log('data', data);
        // const data = await merchantSchema.aggregate([
        //   {
        //     $match: {
        //       _id: new mongoose.Types.ObjectId(req.params.id),
        //     },
        //   },
        //   {
        //     $project: {
        //       _id: 0,
        //       address: '$address',
        //       name: '$name',
        //       email: '$email',
        //       contactNumber: '$contactNumber',
        //       image: '$image',
        //       postCode: '$postCode',
        //       medicalCertificate: '$medicalCertificate',
        //       medicalCertificateNumber: '$medicalCertificateNumber',
        //       createdDate: '$createdAt',
        //     },
        //   },
        // ]);
        return res.ok({ data: data });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.getProfileOfMerchant = getProfileOfMerchant;
const updateProfileOfMerchant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const updateData = req.body;
        // if (updateData?.image) {
        //   const Image = updateData.image.split(',');
        //   const customerData = await merchantSchema.findOne(
        //     { _id: id },
        //     { image: 1 },
        //   );
        //   if (customerData?.image) {
        //     removeUploadedFile(customerData.image);
        //   }
        //   updateData.image = await uploadFile(
        //     Image[0],
        //     Image[1],
        //     'MERCHANT(USER)-PROFILE',
        //   );
        // }
        const updatedUser = yield user_schema_1.default.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });
        if (!updatedUser) {
            return res.badRequest({ message: (0, languageHelper_1.getLanguage)('en').userNotFound });
        }
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').dataUpdatedSuccessfully,
            data: updatedUser,
        });
    }
    catch (error) {
        console.error('Error updating merchant(user) profile:', error);
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.updateProfileOfMerchant = updateProfileOfMerchant;
const getAllDeliveryManOfMerchant = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log('user', req.params.id);
        // const data = await deliveryManSchema.find({ merchantId: req.params.id });
        const data = yield deliveryMan_schema_1.default.aggregate([
            {
                $match: { merchantId: new mongoose_1.default.Types.ObjectId(req.params.id) },
            },
            {
                $lookup: {
                    from: 'country',
                    localField: 'countryId',
                    foreignField: '_id',
                    as: 'countryData',
                },
            },
            {
                $unwind: {
                    path: '$countryData',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $lookup: {
                    from: 'city',
                    localField: 'cityId',
                    foreignField: '_id',
                    as: 'cityData',
                },
            },
            {
                $unwind: {
                    path: '$cityData',
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $sort: { createdAt: -1 },
            },
            {
                $project: {
                    name: 1,
                    firstName: 1,
                    lastName: 1,
                    countryCode: 1,
                    contactNumber: 1,
                    email: 1,
                    status: 1,
                    country: '$countryData.countryName',
                    city: '$cityData.cityName',
                    merchantId: 1,
                    createdByMerchant: 1,
                    createdByAdmin: 1,
                    registerDate: '$createdAt',
                    isVerified: 1,
                    location: {
                        latitude: { $arrayElemAt: ['$location.coordinates', 0] },
                        longitude: { $arrayElemAt: ['$location.coordinates', 1] },
                    },
                },
            },
        ]);
        console.log('data', data);
        return res.ok({ data: data });
    }
    catch (error) {
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.getAllDeliveryManOfMerchant = getAllDeliveryManOfMerchant;
const getOrderCounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let merchantID = req.params.id;
        const totalOrders = yield order_schema_1.default.countDocuments({
            merchant: merchantID,
        });
        const createdOrders = yield orderHistory_schema_2.default.countDocuments({
            status: 'CREATED',
            merchantID: merchantID,
        });
        const assignedOrders = yield orderHistory_schema_2.default.countDocuments({
            status: 'ASSIGNED',
            merchantID: merchantID,
        });
        const acceptedOrders = yield orderAssignee_schema_1.default.countDocuments({
            status: 'ACCEPTED',
            merchant: merchantID,
        });
        const arrivedOrders = yield orderHistory_schema_2.default.countDocuments({
            status: 'ARRIVED',
            merchantID: merchantID,
        });
        const pickedOrders = yield orderHistory_schema_2.default.countDocuments({
            status: 'PICKED_UP',
            merchantID: merchantID,
        });
        const departedOrders = yield orderHistory_schema_2.default.countDocuments({
            status: 'DEPARTED',
            merchantID: merchantID,
        });
        const deliveredOrders = yield orderHistory_schema_2.default.countDocuments({
            status: 'DELIVERED',
            merchantID: merchantID,
        });
        const cancelledOrders = yield orderHistory_schema_2.default.countDocuments({
            status: 'CANCELLED',
            merchantID: merchantID,
        });
        const deliveryMan = yield deliveryMan_schema_1.default.countDocuments({
            merchantId: merchantID,
        });
        let totalCounts = {
            totalOrders,
            createdOrders,
            assignedOrders,
            acceptedOrders,
            arrivedOrders,
            pickedOrders,
            departedOrders,
            deliveredOrders,
            cancelledOrders,
            deliveryMan,
        };
        // return res.status(200).json({
        //   success: true,
        //   data: totalCounts
        // });
        return res.ok({
            message: (0, languageHelper_1.getLanguage)('en').countedData,
            data: totalCounts,
        });
    }
    catch (error) {
        console.log(error);
        return res.failureResponse({
            message: (0, languageHelper_1.getLanguage)('en').somethingWentWrong,
        });
    }
});
exports.getOrderCounts = getOrderCounts;
const getorderHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield orderHistory_schema_1.default.find();
        res.status(200).json({
            status: 'Sucess',
            data: data,
        });
    }
    catch (error) {
        res.status(401).json({
            status: 'Failed',
            error: error,
        });
    }
});
exports.getorderHistory = getorderHistory;
