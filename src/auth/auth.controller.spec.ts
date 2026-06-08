import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';

jest.mock('bcrypt');

describe('AuthController', () => {
  let controller: AuthController;
  let jwtService: JwtService;

  const user = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  };

  const mockUserService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      imports: [
        JwtModule.register({
          secret: 'test-secret',
          signOptions: { expiresIn: '24h' },
        }),
      ],
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('login', () => {
    it('autentica e devolve access_token e user', async () => {
      mockUserService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await controller.login({
        email: user.email,
        password: 'password123',
      });

      expect(typeof result.access_token).toBe('string');
      expect(result.access_token.split('.')).toHaveLength(3);

      const decoded = jwtService.decode(result.access_token) as {
        sub: number;
        iat: number;
        exp: number;
      };
      expect(decoded.sub).toBe(user.id);
      expect(decoded.exp - decoded.iat).toBe(86400);

      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      });
    });

    it('rejeita senha incorreta com a mensagem genérica', async () => {
      mockUserService.findByEmail.mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        controller.login({ email: user.email, password: 'wrong-password' }),
      ).rejects.toThrow(new UnauthorizedException('Credenciais inválidas'));
    });

    it('usa a mesma mensagem genérica para email inexistente', async () => {
      mockUserService.findByEmail.mockResolvedValue(null);

      await expect(
        controller.login({
          email: 'ghost@example.com',
          password: 'password123',
        }),
      ).rejects.toThrow(new UnauthorizedException('Credenciais inválidas'));
    });
  });

  describe('getProfile', () => {
    it('devolve { user } com os dados completos do usuário', async () => {
      mockUserService.findById.mockResolvedValue(user);

      const result = await controller.getProfile({ user: { userId: user.id } });

      expect(mockUserService.findById).toHaveBeenCalledWith(user.id);
      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      });
    });
  });
});
