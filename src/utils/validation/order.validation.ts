import Joi from 'joi';
import {
  ORDER_HISTORY,
  ORDER_LOCATION,
  ORDER_REQUEST,
  PAYMENT_TYPE,
  PICKUP_REQUEST,
} from '../../enum';

export const orderCreateValidation = Joi.object({
  parcelType: Joi.string().required(),
  weight: Joi.number().required(),
  distance: Joi.number(),
  country: Joi.string().required(),
  city: Joi.string().required(),
  parcelsCount: Joi.number().required(),
  startPickupDate: Joi.date().timestamp(),
  endPickupDate: Joi.date().timestamp(),
  startDeliveryDate: Joi.date().timestamp(),
  endDeliveryDate: Joi.date().timestamp(),
  pickupDetails: Joi.object({
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    }).required(),
    dateTime: Joi.date().timestamp().required(),
    address: Joi.string().required(),
    countryCode: Joi.string().required(),
    mobileNumber: Joi.number().required(),
    email: Joi.string(),
    pickupRequest: Joi.string()
      .valid(PICKUP_REQUEST.REGULAR, PICKUP_REQUEST.EXPRESS)
      .default(PICKUP_REQUEST.REGULAR),
    description: Joi.string(),
    postCode: Joi.string()
      .regex(/^[A-Za-z0-9\s-]+$/)
      .required(),
  }),
  deliveryDetails: Joi.object({
    location: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    }).required(),
    dateTime: Joi.date().timestamp().required(),
    address: Joi.string().required(),
    countryCode: Joi.string().required(),
    mobileNumber: Joi.number().required(),
    email: Joi.string(),
    description: Joi.string(),
    postCode: Joi.string()
      .regex(/^[A-Za-z0-9\s-]+$/)
      .required(),
    cashCollection: Joi.number(),
  }),
  paymentCollection: Joi.string(),
  paymentOrderLocation: Joi.string().valid(
    ORDER_LOCATION.PICK_UP,
    ORDER_LOCATION.DELIVERY,
  ),
  cashOnDelivery: Joi.boolean().default(false),
  vehicle: Joi.string()
    .regex(/^[0-9a-fA-F]{24}$/)
    .required(),
  duration: Joi.string().required(),
  // deliveryManId: Joi.string()
  //   .valid(/^[0-9a-fA-F]{24}$/)
  //   .default(''),
  deliveryManId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow('')
    .default(''),
});

export const newOrderCreation = Joi.object({
  parcelsCount: Joi.number().required(),
  dateTime: Joi.date().timestamp().required(),
  paymentCollection: Joi.string(),
  paymentCollectionRupees: Joi.number(),
  description: Joi.string(),

  pickupDetails: Joi.object({
    // location: Joi.object({
    //   latitude: Joi.number().required(),
    //   longitude: Joi.number().required(),
    // }).required(),
    dateTime: Joi.date().timestamp().required(),
    address: Joi.string().required(),
    merchantId: Joi.string().required(),
    name: Joi.string().required(),
    // countryCode: Joi.string().required(),
    mobileNumber: Joi.number().required(),
    email: Joi.string(),
    pickupRequest: Joi.string()
      .valid(PICKUP_REQUEST.REGULAR, PICKUP_REQUEST.EXPRESS)
      .default(PICKUP_REQUEST.REGULAR),
    description: Joi.string(),
    postCode: Joi.string()
      .regex(/^[A-Za-z0-9\s-]+$/)
      .required(),
  }),
  deliveryDetails: Joi.object({
    // location: Joi.object({
    //   latitude: Joi.number().required(),
    //   longitude: Joi.number().required(),
    // }).required(),
    dateTime: Joi.date().timestamp(),
    address: Joi.string().required(),
    name: Joi.string().required(),
    // countryCode: Joi.string().required(),
    mobileNumber: Joi.number().required(),
    email: Joi.string(),
    description: Joi.string().allow(''),
    postCode: Joi.string()
      .regex(/^[A-Za-z0-9\s-]+$/)
      .required(),
    cashCollection: Joi.number(),
  }),
  cashOnDelivery: Joi.boolean().default(false),
  trashed: Joi.boolean().default(false),
  deliveryManId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .allow('')
    .default(''),
});

export const orderAssignValidation = Joi.object({
  deliveryManId: Joi.string()
    // .valid(/^[0-9a-fA-F]{24}$/)
    .required(),
  orderId: Joi.number().required(),
});

export const orderAcceptValidation = Joi.object({
  orderId: Joi.number().required(),
  status: Joi.string()
    .valid(ORDER_REQUEST.ACCEPTED, ORDER_REQUEST.REJECT)
    .required(),
});

export const orderArriveValidation = Joi.object({
  orderId: Joi.number().required(),
});

export const orderListByDeliveryManValidation = Joi.object({
  startDate: Joi.string(),
  endDate: Joi.string(),
  status: Joi.string()
    .valid(
      ORDER_HISTORY.CREATED,
      ORDER_HISTORY.ASSIGNED,
      ORDER_HISTORY.ACCEPTED,
      ORDER_HISTORY.ARRIVED,
      ORDER_HISTORY.PICKED_UP,
      ORDER_HISTORY.DELIVERED,
      ORDER_HISTORY.DEPARTED,
      ORDER_HISTORY.CANCELLED,
    )
    .allow(''),
  pageCount: Joi.number().required(),
  pageLimit: Joi.number().required(),
});

export const orderPickUpValidation = Joi.object({
  orderId: Joi.number().required(),
  userSignature: Joi.string()
    .regex(/^data:([-\w]+\/[-+\w.]+)?((?:;?[\w]+=[-\w]+)*)(;base64)?,(.*)/i)
    .required(),
  pickupTimestamp: Joi.date().timestamp().required(),
  otp: Joi.number(),
});

export const orderDeliverValidation = Joi.object({
  orderId: Joi.number().required(),
  deliveryManSignature: Joi.string()
    .regex(/^data:([-\w]+\/[-+\w.]+)?((?:;?[\w]+=[-\w]+)*)(;base64)?,(.*)/i)
    .required(),
  deliverTimestamp: Joi.date().timestamp().required(),
  otp: Joi.number(),
});

export const orderIdValidation = Joi.object({
  orderId: Joi.number().required(),
});

export const orderCancelValidation = Joi.object({
  orderId: Joi.number().required(),
  reason: Joi.string(),
});

export const orderAdminListValidation = Joi.object({
  date: Joi.string(),
  status: Joi.string().valid(...Object.keys(ORDER_HISTORY)),
  user: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  deliveryMan: Joi.string().regex(/^[0-9a-fA-F]{24}$/),
  orderId: Joi.number(),
  invoiceId: Joi.number(),
  pageCount: Joi.number().default(1),
  pageLimit: Joi.number().default(10),
});
