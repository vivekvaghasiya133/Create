import express from 'express';
import {
  signUp,
  getDeliveryBoysForMerchant,
  getDeliveryManProfile,
  updateDeliveryManProfile,
  updatePassword,
  updateDeliveryManStatus,
  deleteDeliveryMan,
  moveToTrashDeliveryMan,
} from '../../controller/deliveryBoy/auth.controller';
import { OrderAssigneeSchemaData } from '../../controller/deliveryBoy/order.controller';

const router = express.Router();

/**
 * @swagger
 * /deliveryBoy/auth/signUp:
 *   post:
 *     summary: Sign Up
 *     tags: [ Delivery Boy - Auth ]
 *     requestBody:
 *      description: for sign up
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: "#/components/schemas/DeliveryManSignUp"
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.post('/signUp', signUp);
router.get(
  '/getDeliveryBoysForMerchant/:merchantId',
  getDeliveryBoysForMerchant,
);
router.get('/getDeliveryManProfile/:id', getDeliveryManProfile);
router.put('/updateDeliveryManProfile/:id', updateDeliveryManProfile);
router.patch('/updateDeliveryManPassword', updatePassword);
router.patch('/updateDeliveryManStatus/:id', updateDeliveryManStatus);

router.get('/all', OrderAssigneeSchemaData);

export default router;
