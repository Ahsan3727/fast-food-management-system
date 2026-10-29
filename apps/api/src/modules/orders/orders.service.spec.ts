import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { OrderStatus } from '@fastfood/shared-types';

jest.mock('@nestjs/bullmq', () => ({
  InjectQueue: () => () => {},
  Processor: () => () => {},
  WorkerHost: class {},
}));
jest.mock('bullmq', () => ({
  Queue: class {},
}));

import { OrdersService } from './orders.service';

function buildService(overrides: {
  existingOrder?: any;
  counterSeq?: number;
  itemSnapshots?: any[];
  subtotalPaisa?: number;
} = {}) {
  const savedOrders: any[] = [];

  const orderInstance = (data: any) => ({
    ...data,
    _id: { toString: () => 'order-id-123' },
    save: jest.fn().mockImplementation(async function (this: any) {
      savedOrders.push(this);
      return this;
    }),
  });

  const orderModel: any = jest.fn().mockImplementation(orderInstance);
  orderModel.findOne = jest.fn().mockReturnValue({
    lean: jest.fn().mockResolvedValue(null),
    sort: jest.fn().mockReturnValue({
      lean: jest.fn().mockResolvedValue({ orderNumber: 'FD-1050' }),
    }),
  });
  orderModel.findById = jest.fn().mockImplementation(async (id: string) => {
    if (overrides.existingOrder) {
      return {
        ...overrides.existingOrder,
        save: jest.fn().mockImplementation(async function (this: any) { return this; }),
      };
    }
    return null;
  });

  const counterModel: any = {
    findOneAndUpdate: jest.fn().mockResolvedValue({ seq: overrides.counterSeq ?? 1051 }),
  };

  const menuService: any = {
    validateCartAndPrice: jest.fn().mockResolvedValue({
      itemSnapshots: overrides.itemSnapshots ?? [
        { menuItemId: 'item-1', name: 'Burger', unitPricePaisa: 50000, quantity: 1, lineTotalPaisa: 50000 },
      ],
      totalPaisa: overrides.subtotalPaisa ?? 50000,
    }),
  };

  const notifications: any = {
    notifyCustomerOrderStatus: jest.fn(),
    notifyRiderDeliveryRequest: jest.fn(),
    sendToTokens: jest.fn(),
  };

  const gateway: any = {
    emitToRestaurant: jest.fn(),
    emitToOrder: jest.fn(),
    emitToCustomer: jest.fn(),
    emitToAvailableRiders: jest.fn(),
  };

  const usersService: any = {
    findById: jest.fn().mockResolvedValue({ _id: 'cust-1' }),
    findOnlineRiders: jest.fn().mockResolvedValue([]),
  };

  const ridersService: any = {
    addUnsettledCash: jest.fn(),
  };

  const service = new OrdersService(
    orderModel,
    counterModel,
    menuService,
    notifications,
    gateway,
    usersService,
    ridersService,
    null,
  );

  return { service, orderModel, counterModel, menuService, gateway, savedOrders };
}

describe('OrdersService (Phase 1)', () => {
  describe('create()', () => {
    it('calculates subtotal, delivery fee, total, and uses atomic counter', async () => {
      const { service, savedOrders } = buildService({ subtotalPaisa: 50000 }); // Rs. 500 (< Rs. 1000 free threshold)

      const order = await service.create('cust-1', {
        items: [{ menuItemId: '507f1f77bcf86cd799439011', quantity: 1 }],
        deliveryAddress: { lat: 31.5204, lng: 74.3587, addressLine: 'Main Gulberg, Lahore' },
        payment: { method: 'cod' },
      });

      expect(order.orderNumber).toBe('FD-1051');
      expect(order.subtotalPaisa).toBe(50000);
      expect(order.deliveryFeePaisa).toBe(10000); // Rs. 100 delivery fee
      expect(order.totalPaisa).toBe(60000); // 50000 + 10000
      expect(order.status).toBe(OrderStatus.PLACED);
    });

    it('waives delivery fee when subtotal is at or above free threshold', async () => {
      const { service } = buildService({ subtotalPaisa: 120000 }); // Rs. 1200 (>= Rs. 1000)

      const order = await service.create('cust-1', {
        items: [{ menuItemId: '507f1f77bcf86cd799439011', quantity: 2 }],
        deliveryAddress: { lat: 31.5204, lng: 74.3587, addressLine: 'DHA Phase 5, Lahore' },
        payment: { method: 'cod' },
      });

      expect(order.subtotalPaisa).toBe(120000);
      expect(order.deliveryFeePaisa).toBe(0);
      expect(order.totalPaisa).toBe(120000);
    });

    it('rejects order when delivery address is outside the delivery radius', async () => {
      const { service } = buildService();

      // Karachi coordinates (~1000 km away from Lahore restaurant)
      await expect(
        service.create('cust-1', {
          items: [{ menuItemId: '507f1f77bcf86cd799439011', quantity: 1 }],
          deliveryAddress: { lat: 24.8607, lng: 67.0011, addressLine: 'Clifton, Karachi' },
          payment: { method: 'cod' },
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('cancel()', () => {
    it('allows customer to cancel when order is in PLACED status', async () => {
      const existingOrder = {
        _id: { toString: () => 'order-123' },
        customerId: 'cust-1',
        status: OrderStatus.PLACED,
        statusHistory: [],
      };
      const { service, gateway } = buildService({ existingOrder });

      const cancelled = await service.cancel('order-123', 'cust-1', 'Changed my mind');

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
      expect(cancelled.cancellationReason).toBe('Changed my mind');
      expect(gateway.emitToOrder).toHaveBeenCalledWith('order-123', 'order:status', {
        orderId: 'order-123',
        status: OrderStatus.CANCELLED,
      });
      expect(gateway.emitToRestaurant).toHaveBeenCalledWith('order:status', {
        orderId: 'order-123',
        status: OrderStatus.CANCELLED,
      });
    });

    it('refuses customer cancellation when order has transitioned past PLACED', async () => {
      const existingOrder = {
        _id: { toString: () => 'order-123' },
        customerId: 'cust-1',
        status: OrderStatus.ACCEPTED,
        statusHistory: [],
      };
      const { service } = buildService({ existingOrder });

      await expect(
        service.cancel('order-123', 'cust-1', 'Changed my mind'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses cancellation if customerId does not match order owner', async () => {
      const existingOrder = {
        _id: { toString: () => 'order-123' },
        customerId: 'cust-original',
        status: OrderStatus.PLACED,
        statusHistory: [],
      };
      const { service } = buildService({ existingOrder });

      await expect(
        service.cancel('order-123', 'cust-other', 'Changed my mind'),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });
});
