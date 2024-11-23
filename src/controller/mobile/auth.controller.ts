import { Response } from 'express';
import mongoose from 'mongoose';
import { JwtPayload, verify } from 'jsonwebtoken';
import { PERSON_TYPE } from '../../enum';
import { getLanguage } from '../../language/languageHelper';
import authTokenSchema from '../../models/authToken.schema';
import CurrencySchema from '../../models/currency.schema';
import deliveryManSchema from '../../models/deliveryMan.schema';
import otpSchema from '../../models/otp.schema';
import subcriptionSchema from '../../models/subcription.schema';
import subcriptionPurchaseSchema from '../../models/subcriptionPurchase.schema';
import merchantSchema from '../../models/user.schema';
import OrderHistorySchema from '../../models/orderHistory.schema';
import {
  createAuthTokens,
  emailOrMobileOtp,
  encryptPassword,
  generateIntRandomNo,
  passwordValidation,
  uploadFile,
  removeUploadedFile,
} from '../../utils/common';
import { RequestParams } from '../../utils/types/expressTypes';
import validateParamsWithJoi from '../../utils/validateRequest';
import {
  activateFreeSubcriptionValidation,
  otpVerifyValidation,
  renewTokenValidation,
  userSignInValidation,
  userSignUpValidation,
} from '../../utils/validation/auth.validation';
import path from 'path';
import orderHistorySchema from '../../models/orderHistory.schema';
import orderSchema from '../../models/order.schema';
import orderAssignSchema from '../../models/orderAssignee.schema';
import subscribedSchema from '../../models/subcription.schema';

export const signUp = async (req: RequestParams, res: Response) => {
  try {
    const validateRequest = validateParamsWithJoi<{
      name: string;
      email: string;
      password: string;
      contactNumber: number;
      countryCode: string;
      otp: number;
      image: string;
      medicalCertificateNumber: number;
      medicalCertificate: string;
      address: {
        street: string;
        city: string;
        // state: string;
        postalCode: string;
        country: string;
      };
    }>(req.body, userSignUpValidation);

    if (!validateRequest.isValid) {
      return res.badRequest({ message: validateRequest.message });
    }

    // const assetsFile = req.file;

    const { value } = validateRequest;

    const userExist = await merchantSchema.findOne({ email: value.email });

    if (userExist) {
      return res.badRequest({
        message: getLanguage('en').emailRegisteredAlready,
      });
    }

    if (!value.image) {
      value.image = process.env.DEFAULT_PROFILE_IMAGE;
    } else {
      const Image = value.image.split(',');
      value.image = await uploadFile(
        Image[0],
        Image[1],
        'MERCHANT(USER)-PROFILE',
      );
    }

    const otpData = await otpSchema.findOne({
      value: value.otp,
      customerEmail: value.email,
      expiry: { $gte: Date.now() },
    });

    if (!otpData) {
      return res.badRequest({ message: getLanguage('en').otpExpired });
    }

    const certificate = await merchantSchema.findOne({
      medicalCertificateNumber: value.medicalCertificateNumber,
    });

    if (certificate) {
      return res.badRequest({
        message: getLanguage('en').certificateRegisteredAlready,
      });
    }

    // value.medicalCertificate = path.join('uploads/', assetsFile.filename);
    // if (value?.medicalCertificate) {
    //   const Image = value.medicalCertificate.split(',');
    //   value.medicalCertificate = await uploadFile(Image[0], Image[1], 'MERCHANT-MEDICALCER');
    // }

    value.password = await encryptPassword({ password: value.password });

    await merchantSchema.create(value);

    return res.ok({ message: getLanguage('en').userRegistered });
  } catch (error) {
    console.log('error', error);
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const signIn = async (req: RequestParams, res: Response) => {
  try {
    const validateRequest = validateParamsWithJoi<{
      email: string;
      password: string;
      personType: PERSON_TYPE;
    }>(req.body, userSignInValidation);

    if (!validateRequest.isValid) {
      return res.badRequest({ message: validateRequest.message });
    }
    const { value } = validateRequest;

    let userExist;

    const isCustomer = value.personType === PERSON_TYPE.CUSTOMER;

    if (isCustomer) {
      userExist = await merchantSchema.findOne({ email: value.email }).lean();
    } else {
      userExist = await deliveryManSchema
        .findOne({ email: value.email })
        .lean();
    }

    if (!userExist) {
      return res.badRequest({
        message: getLanguage('en').invalidLoginCredentials,
      });
    }

    const isVerifyPassword = await passwordValidation(
      value.password,
      userExist.password as string,
    );

    console.log('🚀 ~ signIn ~ isVerifyPassword:', isVerifyPassword);
    if (!isVerifyPassword) {
      return res.badRequest({
        message: getLanguage('en').invalidLoginCredentials,
      });
    }

    const { accessToken, refreshToken } = createAuthTokens(userExist._id);

    const { bankData, providerId, ...userData } = userExist;

    const currency = await CurrencySchema.findOne(
      {},
      { _id: 0, name: 1, symbol: 1, position: 1 },
    );

    return res.ok({
      message: getLanguage('en').loginSuccessfully,
      data: {
        userData,
        userAuthData: { accessToken, refreshToken },
        currency,
      },
    });
  } catch (error) {
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const activateFreeSubcription = async (
  req: RequestParams,
  res: Response,
) => {
  try {
    const validateRequest = validateParamsWithJoi<{
      userId: string;
      medicalCertificateNumber: number;
      medicalCertificate: string;
    }>(req.body, activateFreeSubcriptionValidation);

    if (!validateRequest.isValid) {
      return res.badRequest({ message: validateRequest.message });
    }
    const { value } = validateRequest;

    const userExist = await merchantSchema.findOne({
      _id: value.userId,
      medicalCertificateNumber: value.medicalCertificateNumber,
    });

    if (!userExist) {
      return res.badRequest({
        message: getLanguage('en').userNotRegistered,
      });
    }

    if (
      !(await merchantSchema.findOne({
        medicalCertificateNumber: value.medicalCertificateNumber,
      }))
    ) {
      return res.badRequest({
        message: getLanguage('en').certificateNumberRegistered,
      });
    }

    const checkSubcriptionAlreadyExist =
      await subcriptionPurchaseSchema.findOne({
        // customer: req.id,
        merchant: req.id,
        expiry: { $gte: new Date() },
      });

    if (checkSubcriptionAlreadyExist) {
      return res.badRequest({
        message: getLanguage('en').errorSubcriptionAlreadyExist,
      });
    }

    const document = value.medicalCertificate.split(',');

    value.medicalCertificate = await uploadFile(
      document[0],
      document[1],
      'USER-CERTIFICATE',
    );

    const data = await subcriptionSchema.findOne({ amount: 0, isActive: true });

    if (!data) {
      return res.badRequest({ message: getLanguage('en').errorDataNotFound });
    }

    await Promise.all([
      subcriptionPurchaseSchema.create({
        subcriptionId: data._id,
        // customer: userExist._id,
        merchant: userExist._id,
        expiry: Date.now() + data.seconds * 1000, // 2592000
        status: 'APPROVED',
      }),
      merchantSchema.updateOne(
        {
          _id: req.id,
        },
        { $set: { medicalCertificate: value.medicalCertificate } },
      ),
    ]);

    return res.ok({
      message: getLanguage('en').accountActiveSuccessfully,
    });
  } catch (error) {
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const sendEmailOrMobileOtp = async (
  req: RequestParams,
  res: Response,
) => {
  try {
    const validateRequest = validateParamsWithJoi<{
      email: string;
      contactNumber: number;
      countryCode: string;
      personType: PERSON_TYPE;
    }>(req.body, otpVerifyValidation);

    if (!validateRequest.isValid) {
      return res.badRequest({ message: validateRequest.message });
    }
    const { value } = validateRequest;

    let userExist;

    const isCustomer = value.personType === PERSON_TYPE.CUSTOMER;

    if (isCustomer) {
      userExist = await merchantSchema.findOne({
        email: value.email,
        contactNumber: value.contactNumber,
        countryCode: value.countryCode,
      });
    } else {
      userExist = await deliveryManSchema.findOne({
        email: value.email,
        contactNumber: value.contactNumber,
        countryCode: value.countryCode,
      });
    }

    if (userExist) {
      return res.badRequest({
        message: getLanguage('en').emailRegisteredAlready,
      });
    }

    const otp =
      process.env.ENV === 'DEV' ? 999999 : generateIntRandomNo(111111, 999999);

    if (process.env.ENV !== 'DEV') {
      await emailOrMobileOtp(
        value.email,
        `This is your otp for registration ${otp}`,
      );
    }

    const data = await otpSchema.updateOne(
      {
        value: otp,
        customerEmail: value.email,
        customerMobile: value.contactNumber,
        action: value.personType,
      },
      {
        value: otp,
        customerEmail: value.email,
        customerMobile: value.contactNumber,
        expiry: Date.now() + 600000,
        action: value.personType,
      },
      { upsert: true },
    );

    if (!data.upsertedCount && !data.modifiedCount) {
      return res.badRequest({ message: getLanguage('en').invalidData });
    }

    return res.ok({
      message: getLanguage('en').otpSentSuccess,
      data: process.env.ENV !== 'DEV' ? {} : { otp },
    });
  } catch (error) {
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const renewToken = async (req: RequestParams, res: Response) => {
  try {
    const validateRequest = validateParamsWithJoi<{
      refreshToken: string;
      personType: PERSON_TYPE;
    }>(req.body, renewTokenValidation);

    if (!validateRequest.isValid) {
      return res.badRequest({ message: validateRequest.message });
    }

    const { value } = validateRequest;

    const data = verify(
      value.refreshToken,
      process.env.REFRESH_SECRET_KEY,
    ) as JwtPayload;

    if (!data?.accessToken) {
      return res.badRequest({ message: getLanguage('en').invalidToken });
    }

    const isCustomer = value.personType === PERSON_TYPE.CUSTOMER;

    let userVerify;

    if (isCustomer) {
      userVerify = await merchantSchema.findById(data.id);
    } else {
      userVerify = await deliveryManSchema.findById(data.id);
    }

    if (!userVerify) {
      return res.badRequest({ message: getLanguage('en').invalidToken });
    }

    await authTokenSchema.create({
      accessToken: data.accessToken,
      refreshToken: value.refreshToken,
    });

    const { accessToken, refreshToken } = createAuthTokens(userVerify._id);

    return res.ok({
      message: getLanguage('en').renewTokenSuccessfully,
      data: { accessToken, refreshToken },
    });
  } catch (error) {
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const logout = async (req: RequestParams, res: Response) => {
  try {
    const validateRequest = validateParamsWithJoi<{
      refreshToken: string;
      personType: PERSON_TYPE;
    }>(req.body, renewTokenValidation);

    if (!validateRequest.isValid) {
      return res.badRequest({ message: validateRequest.message });
    }

    const { value } = validateRequest;

    const data = verify(
      value.refreshToken,
      process.env.REFRESH_SECRET_KEY,
    ) as JwtPayload;

    if (!data?.accessToken) {
      return res.badRequest({ message: getLanguage('en').invalidToken });
    }

    const isCustomer = value.personType === PERSON_TYPE.CUSTOMER;

    let userVerify;

    if (isCustomer) {
      userVerify = await merchantSchema.findById(data.id);
    } else {
      userVerify = await deliveryManSchema.findById(data.id);
    }

    if (!userVerify) {
      return res.badRequest({ message: getLanguage('en').invalidToken });
    }

    const checkTokenExist = await authTokenSchema.findOne({
      accessToken: data.accessToken,
      refreshToken: value.refreshToken,
      isActive: false,
    });

    if (checkTokenExist) {
      return res.badRequest({ message: getLanguage('en').invalidToken });
    }

    await authTokenSchema.create({
      accessToken: data.accessToken,
      refreshToken: value.refreshToken,
    });

    return res.ok({
      message: getLanguage('en').logoutSuccessfully,
    });
  } catch (error) {
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const getLocationOfMerchant = async (
  req: RequestParams,
  res: Response,
) => {
  try {
    const pickupLocation = await merchantSchema.find(
      {},
      'name contactNumber countryCode address',
    );

    const formattedData = pickupLocation
      .map((location) => {
        const { name, contactNumber, countryCode, address } = location;

        if (address && address.street && address.city && address.country) {
          const fullAddress =
            `${address.street} ${address.city} ${address.country}`.trim(); // Combine address fields
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
  } catch (error) {
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const getProfileOfMerchant = async (
  req: RequestParams,
  res: Response,
) => {
  try {
    console.log('user', req.params.id);
    const data = await merchantSchema.find({ _id: req.params.id });
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
  } catch (error) {
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const updateProfileOfMerchant = async (
  req: RequestParams,
  res: Response,
) => {
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
    const updatedUser = await merchantSchema.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!updatedUser) {
      return res.badRequest({ message: getLanguage('en').userNotFound });
    }

    return res.ok({
      message: getLanguage('en').dataUpdatedSuccessfully,
      data: updatedUser,
    });
  } catch (error) {
    console.error('Error updating merchant(user) profile:', error);
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const getAllDeliveryManOfMerchant = async (
  req: RequestParams,
  res: Response,
) => {
  try {
    console.log('user', req.params.id);
    // const data = await deliveryManSchema.find({ merchantId: req.params.id });
    const data = await deliveryManSchema.aggregate([
      {
        $match: { merchantId: new mongoose.Types.ObjectId(req.params.id) },
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
  } catch (error) {
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const getOrderCounts = async (req: RequestParams, res: Response) => {
  try {
    let merchantID = req.params.id;
    const totalOrders = await orderSchema.countDocuments({
      merchant: merchantID,
    });

    const createdOrders = await orderHistorySchema.countDocuments({
      status: 'CREATED',
      merchantID: merchantID,
    });
    const assignedOrders = await orderHistorySchema.countDocuments({
      status: 'ASSIGNED',
      merchantID: merchantID,
    });
    const acceptedOrders = await orderAssignSchema.countDocuments({
      status: 'ACCEPTED',
      merchant: merchantID,
    });
    const arrivedOrders = await orderHistorySchema.countDocuments({
      status: 'ARRIVED',
      merchantID: merchantID,
    });
    const pickedOrders = await orderHistorySchema.countDocuments({
      status: 'PICKED_UP',
      merchantID: merchantID,
    });
    const departedOrders = await orderHistorySchema.countDocuments({
      status: 'DEPARTED',
      merchantID: merchantID,
    });
    const deliveredOrders = await orderHistorySchema.countDocuments({
      status: 'DELIVERED',
      merchantID: merchantID,
    });
    const cancelledOrders = await orderHistorySchema.countDocuments({
      status: 'CANCELLED',
      merchantID: merchantID,
    });
    const deliveryMan = await deliveryManSchema.countDocuments({
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
      message: getLanguage('en').countedData,
      data: totalCounts,
    });
  } catch (error) {
    console.log(error);
    return res.failureResponse({
      message: getLanguage('en').somethingWentWrong,
    });
  }
};

export const getorderHistory = async (req: RequestParams, res: Response) => {
  try {
    const data = await OrderHistorySchema.find();

    res.status(200).json({
      status: 'Sucess',
      data: data,
    });
  } catch (error) {
    res.status(401).json({
      status: 'Failed',
      error: error,
    });
  }
};
