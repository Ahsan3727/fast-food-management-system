import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { createHash } from 'crypto';
import { Role } from '@fastfood/shared-types';
import { AuthService } from './auth.service';

const user = (over: Record<string, unknown> = {}) => ({
  _id: { toString: () => 'user-1' },
  name: 'Existing',
  phone: '03001234567',
  role: Role.CUSTOMER,
  isSuspended: false,
  ...over,
});

function build(
  existingUser: ReturnType<typeof user> | null,
  existingOtp: Record<string, unknown> | null = null,
) {
  const users = {
    findByPhone: jest.fn().mockResolvedValue(existingUser),
    create: jest.fn(async (d: Record<string, unknown>) => ({
      _id: { toString: () => 'new-1' },
      ...d,
    })),
    updateProfile: jest.fn(),
  };
  const jwt = { sign: jest.fn().mockReturnValue('access-token') };
  const config = { get: jest.fn().mockReturnValue('x') };
  const refreshModel: any = function () {
    return { save: jest.fn().mockResolvedValue(undefined) };
  };

  const phoneOtpModel: any = {
    findOne: jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(existingOtp),
    }),
    findOneAndUpdate: jest.fn().mockResolvedValue({}),
    updateOne: jest.fn().mockResolvedValue({}),
    deleteOne: jest.fn().mockResolvedValue({}),
  };

  const service = new AuthService(
    users as any,
    jwt as any,
    config as any,
    refreshModel,
    phoneOtpModel,
  );

  return { service, users, jwt, phoneOtpModel };
}

describe('AuthService.customerSession (Phase 0)', () => {
  it.each([Role.RIDER, Role.STAFF, Role.ADMIN])('refuses a %s account and issues no token', async (role) => {
    const { service, jwt } = build(user({ role }));
    await expect(service.customerSession('Anyone', '03001234567')).rejects.toBeInstanceOf(ForbiddenException);
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('refuses a suspended customer', async () => {
    const { service, jwt } = build(user({ isSuspended: true }));
    await expect(service.customerSession('Anyone', '03001234567')).rejects.toBeInstanceOf(ForbiddenException);
    expect(jwt.sign).not.toHaveBeenCalled();
  });

  it('gives every refusal the same message', async () => {
    const rider = build(user({ role: Role.RIDER }));
    const suspended = build(user({ isSuspended: true }));
    const a = await rider.service.customerSession('x', '03001234567').catch((e) => e.message);
    const b = await suspended.service.customerSession('x', '03001234567').catch((e) => e.message);
    expect(a).toBe(b);
  });

  it('resumes an active customer without renaming the account', async () => {
    const { service, users } = build(user());
    const res = await service.customerSession('A Different Name', '03001234567');
    expect(res.accessToken).toBe('access-token');
    expect(res.user.role).toBe(Role.CUSTOMER);
    expect(res.user.name).toBe('Existing');
    expect(users.updateProfile).not.toHaveBeenCalled();
  });

  it('creates a new customer for an unknown phone', async () => {
    const { service, users } = build(null);
    const res = await service.customerSession('New Person', ' 03009998888 ');
    expect(users.create).toHaveBeenCalledWith({ name: 'New Person', phone: '03009998888', role: Role.CUSTOMER });
    expect(res.user.role).toBe(Role.CUSTOMER);
  });

  it('rejects an empty phone', async () => {
    const { service } = build(null);
    await expect(service.customerSession('x', '   ')).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('AuthService.requestOtp and verifyOtp (Phase 3)', () => {
  it('requests OTP successfully and returns cooldown', async () => {
    const { service, phoneOtpModel } = build(null);
    const res = await service.requestOtp('03001234567');
    expect(res.success).toBe(true);
    expect(res.cooldownSeconds).toBe(60);
    expect(phoneOtpModel.findOneAndUpdate).toHaveBeenCalled();
  });

  it('enforces 60s cooldown if code was requested recently', async () => {
    const existingOtp = {
      phone: '03001234567',
      lastSentAt: new Date(Date.now() - 30_000), // 30s ago
      hourlyCount: 1,
    };
    const { service } = build(null, existingOtp);
    await expect(service.requestOtp('03001234567')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('enforces hourly cap of 5 OTP requests', async () => {
    const existingOtp = {
      phone: '03001234567',
      lastSentAt: new Date(Date.now() - 70_000), // > 60s ago
      hourlyCount: 5,
    };
    const { service } = build(null, existingOtp);
    await expect(service.requestOtp('03001234567')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects verification if OTP expired or not found', async () => {
    const { service } = build(null, null);
    await expect(service.verifyOtp('03001234567', '123456')).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects verification on wrong code and increments attempts', async () => {
    const validCode = '123456';
    const codeHash = createHash('sha256').update(validCode).digest('hex');
    const existingOtp = {
      _id: 'otp-1',
      phone: '03001234567',
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const { service, phoneOtpModel } = build(null, existingOtp);
    await expect(service.verifyOtp('03001234567', '999999')).rejects.toBeInstanceOf(BadRequestException);
    expect(phoneOtpModel.updateOne).toHaveBeenCalledWith({ _id: 'otp-1' }, { $inc: { attempts: 1 } });
  });

  it('verifies code successfully and issues tokens for valid customer', async () => {
    const validCode = '654321';
    const codeHash = createHash('sha256').update(validCode).digest('hex');
    const existingOtp = {
      _id: 'otp-1',
      phone: '03001234567',
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const { service, phoneOtpModel } = build(user(), existingOtp);
    const res = await service.verifyOtp('03001234567', '654321');
    expect(res.accessToken).toBe('access-token');
    expect(res.user.phone).toBe('03001234567');
    expect(phoneOtpModel.deleteOne).toHaveBeenCalledWith({ _id: 'otp-1' });
  });

  it('refuses to verify OTP into a staff account', async () => {
    const validCode = '654321';
    const codeHash = createHash('sha256').update(validCode).digest('hex');
    const existingOtp = {
      _id: 'otp-1',
      phone: '03001234567',
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    };
    const { service } = build(user({ role: Role.STAFF }), existingOtp);
    await expect(service.verifyOtp('03001234567', '654321')).rejects.toBeInstanceOf(ForbiddenException);
  });
});
