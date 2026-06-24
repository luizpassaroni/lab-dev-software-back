import { Test, TestingModule } from '@nestjs/testing';
import { FavoriteController } from './favorite.controller';
import { FavoriteService } from './favorite.service';
import { TitleType } from '../../titles/dto/title-type.enum';

describe('FavoriteController', () => {
  let controller: FavoriteController;
  const mockService = { add: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FavoriteController],
      providers: [{ provide: FavoriteService, useValue: mockService }],
    }).compile();

    controller = module.get<FavoriteController>(FavoriteController);
  });

  it('POST usa o userId do token (ownership) e favorita', async () => {
    mockService.add.mockResolvedValue(undefined);
    const req = { user: { userId: 42 } };

    const res = await controller.favorite(TitleType.MOVIE, 872585, req);

    expect(mockService.add).toHaveBeenCalledWith(42, TitleType.MOVIE, 872585);
    expect(res).toEqual({ favorite: true });
  });

  it('DELETE usa o userId do token e desfavorita', async () => {
    mockService.remove.mockResolvedValue(undefined);
    const req = { user: { userId: 7 } };

    await controller.unfavorite(TitleType.TV, 100, req);

    expect(mockService.remove).toHaveBeenCalledWith(7, TitleType.TV, 100);
  });
});