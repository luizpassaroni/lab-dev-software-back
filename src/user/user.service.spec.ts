import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UserService } from './user.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  const createUserDto = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('faz hash da senha antes de persistir o usuário', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const createdUser = {
        id: 1,
        name: createUserDto.name,
        email: createUserDto.email,
        passwordHash: 'hashed-password',
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };
      mockPrismaService.user.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: {
          name: createUserDto.name,
          email: createUserDto.email,
          passwordHash: 'hashed-password',
        },
      });
      expect(result).toEqual(createdUser);
    });

    it('lança ConflictException quando o email já está cadastrado (P2002)', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrismaService.user.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '7.8.0',
        }),
      );

      await expect(service.create(createUserDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('propaga erros de banco que não são P2002', async () => {
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      const dbError = new Error('Database connection lost');
      mockPrismaService.user.create.mockRejectedValue(dbError);

      await expect(service.create(createUserDto)).rejects.toBe(dbError);
    });
  });
});
