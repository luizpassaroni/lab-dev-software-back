import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;
  let jwtService: JwtService;

  const mockJwtService = {
    sign: jest.fn((payload) => {
      return `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify(payload)).toString('base64')}.signature`;
    }),
    verify: jest.fn(() => {
      return { sub: 123, email: 'test@example.com' };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('deve gerar um token JWT válido', () => {
      const payload = { sub: 123, email: 'test@example.com' };
      const result = service.generateToken(payload);

      expect(typeof result).toBe('string');
      expect(jwtService.sign).toHaveBeenCalledWith(payload);
    });

    it('deve retornar a string assinada', () => {
      const payload = { sub: 456, email: 'another@example.com' };
      const result = service.generateToken(payload);

      expect(result).toEqual(expect.any(String));
    });
  });

  describe('validateToken', () => {
    it('deve validar e decodificar um token JWT válido', () => {
      const token = 'valid-jwt-token';
      const result = service.validateToken(token);

      expect(result).toEqual({ sub: 123, email: 'test@example.com' });
      expect(jwtService.verify).toHaveBeenCalledWith(token);
    });

    it('deve lançar erro se o token for inválido', () => {
      const mockJwtServiceError = {
        verify: jest.fn(() => {
          throw new Error('Invalid token');
        }),
      };

      (service as any).jwtService = mockJwtServiceError;

      expect(() => service.validateToken('invalid-token')).toThrow(
        'Invalid token',
      );
    });
  });

  describe('createPayload', () => {
    it('deve criar um payload JWT com userId e email', () => {
      const userId = 789;
      const email = 'user@example.com';
      const result = service.createPayload(userId, email);

      expect(result).toHaveProperty('sub', userId);
      expect(result).toHaveProperty('email', email);
      expect(result).toHaveProperty('iat');
      expect(typeof result.iat).toBe('number');
    });

    it('deve incluir timestamp de emissão (iat)', () => {
      const result = service.createPayload(123, 'test@example.com');
      const now = Math.floor(Date.now() / 1000);

      expect(result.iat).toBeLessThanOrEqual(now + 1);
      expect(result.iat).toBeGreaterThanOrEqual(now - 1);
    });
  });
});
