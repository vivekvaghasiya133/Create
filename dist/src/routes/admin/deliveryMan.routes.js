"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const deliveryMan_controller_1 = require("../../controller/admin/deliveryMan.controller");
const router = (0, express_1.Router)();
/**
 * @swagger
 * /admin/deliveryMan/updateVerificationStatus:
 *   patch:
 *     security:
 *      - bearerAuth: []
 *     summary: Update Verification Status
 *     tags: [ Admin - Delivery Man ]
 *     requestBody:
 *      description: Update verification status
 *      required: true
 *      content:
 *        application/json:
 *          schema:
 *            $ref: "#/components/schemas/AdminCreateDeliveryMan"
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.patch('/updateVerificationStatus', deliveryMan_controller_1.updateVerificationStatus);
/**
 * @swagger
 * /admin/deliveryMan/documents:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Get Delivery Man Documents
 *     tags: [ Admin - Delivery Man ]
 *     parameters:
 *     - name: pageCount
 *       in: query
 *     - name: pageLimit
 *       in: query
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.get('/documents', deliveryMan_controller_1.getDeliveryManDocuments);
/**
 * @swagger
 * /admin/deliveryMan/locations:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Get Delivery Man Locations
 *     tags: [ Admin - Delivery Man ]
 *     parameters:
 *     - name: pageCount
 *       in: query
 *     - name: pageLimit
 *       in: query
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.get('/locations', deliveryMan_controller_1.getDeliveryManLocations);
/**
 * @swagger
 * /admin/deliveryMan:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Get Delivery Mans
 *     tags: [ Admin - Delivery Man ]
 *     parameters:
 *     - name: pageCount
 *       in: query
 *     - name: pageLimit
 *       in: query
 *     - name: searchValue
 *       in: query
 *     - name: isVerified
 *       in: query
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.get('/', deliveryMan_controller_1.getDeliveryMans);
router.get('/getAllDeliveryMans', deliveryMan_controller_1.getAllDeliveryMans);
router.get('/getAllDeliveryMansFromAdmin', deliveryMan_controller_1.getAllDeliveryMansFromAdmin);
/**
 * @swagger
 * /admin/deliveryMan/orders/{deliveryManId}:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Get Delivery Man Orders
 *     tags: [ Admin - Delivery Man ]
 *     parameters:
 *     - name: deliveryManId
 *       in: path
 *     - name: pageCount
 *       in: query
 *     - name: pageLimit
 *       in: query
 *     - name: orderListType
 *       in: query
 *       schema:
 *        type: string
 *        enum:
 *        - PENDING
 *        - COMPLETED
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.get('/orders/:deliveryManId', deliveryMan_controller_1.getDeliveryManOrders);
/**
 * @swagger
 * /admin/deliveryMan/assignInfo/{orderId}:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Get Delivery Man Admin Assign Info
 *     tags: [ Admin - Delivery Man ]
 *     parameters:
 *     - name: orderId
 *       in: path
 *     - name: pageCount
 *       in: query
 *     - name: pageLimit
 *       in: query
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.get('/assignInfo/:orderId', deliveryMan_controller_1.getDeliveryManInfo);
/**
 * @swagger
 * /admin/deliveryMan/names:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Get Delivery Man Names
 *     tags: [ Admin - Delivery Man ]
 *     parameters:
 *     - name: pageCount
 *       in: query
 *     - name: pageLimit
 *       in: query
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.get('/names', deliveryMan_controller_1.getDeliveryManNames);
/**
 * @swagger
 * /admin/deliveryMan/{deliveryManId}:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Get Delivery Man By Id
 *     tags: [ Admin - Delivery Man ]
 *     parameters:
 *     - name: deliveryManId
 *       in: path
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.get('/:deliveryManId', deliveryMan_controller_1.getDeliveryManProfileById);
/**
 * @swagger
 * /admin/deliveryMan/wallet-history/{deliveryManId}:
 *   get:
 *     security:
 *      - bearerAuth: []
 *     summary: Get Delivery Man Names
 *     tags: [ Admin - Delivery Man ]
 *     parameters:
 *     - name: deliveryManId
 *       in: path
 *     - name: transactionType
 *       in: query
 *       schema:
 *        $ref: "#/components/schemas/DeliveryManWalletList"
 *     - name: pageCount
 *       in: query
 *     - name: pageLimit
 *       in: query
 *     responses:
 *       200:
 *         description: Your request is successfully executed.
 *       400:
 *         description: Bad Request Client Error
 *       500:
 *         description: Something went wrong
 */
router.get('/wallet-history/:deliveryManId', deliveryMan_controller_1.getDeliveryManWalletHistory);
router.post('/addDeliveryMan', deliveryMan_controller_1.addDeliveryMan);
router.delete('/deleteDeliveryMan/:deliveryManId', deliveryMan_controller_1.deleteDeliveryMan);
exports.default = router;
