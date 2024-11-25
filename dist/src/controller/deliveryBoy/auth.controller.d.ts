import { Response } from 'express';
import { RequestParams } from '../../utils/types/expressTypes';
export declare const verifyPassword: ({ password, hash, }: {
    password: string;
    hash: string;
}) => Promise<boolean>;
export declare const signUp: (req: RequestParams, res: Response) => Promise<void>;
export declare const updatePassword: (req: RequestParams, res: Response) => Promise<void>;
export declare const updateDeliveryManStatus: (req: RequestParams, res: Response) => Promise<void | Response<any, Record<string, any>>>;
export declare const getDeliveryBoysForMerchant: (req: RequestParams, res: Response) => Promise<void>;
export declare const updateLocation: (req: RequestParams, res: Response) => Promise<void>;
export declare const getDeliveryManProfile: (req: RequestParams, res: Response) => Promise<void>;
export declare const deleteDeliveryMan: (req: RequestParams, res: Response) => Promise<void>;
export declare const updateDeliveryManProfile: (req: RequestParams, res: Response) => Promise<void>;
export declare const moveToTrashDeliveryMan: (req: RequestParams, res: Response) => Promise<void>;
