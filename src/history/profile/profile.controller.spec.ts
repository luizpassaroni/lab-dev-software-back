import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from './profile.service';

describe('ProfileController', () => {
  let controller: ProfileController;

  const mockProfileService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [{ provide: ProfileService, useValue: mockProfileService }],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('chama profileService.get com o userId do token', async () => {
    const mockResponse = {
      totais: { vistos: 2, avaliados: 1, favoritos: 1 },
      vistos: [],
      avaliados: [],
      favoritos: [],
    };
    mockProfileService.get.mockResolvedValue(mockResponse);

    const req = { user: { userId: 42 } };
    const result = await controller.getProfile(req);

    expect(mockProfileService.get).toHaveBeenCalledWith(42);
    expect(result).toEqual(mockResponse);
  });
});