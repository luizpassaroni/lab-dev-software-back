import { Test, TestingModule } from '@nestjs/testing';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { TitleType } from '../../titles/dto/title-type.enum';

describe('RatingController', () => {
  let controller: RatingController;
  const mockService = { set: jest.fn(), remove: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatingController],
      providers: [{ provide: RatingService, useValue: mockService }],
    }).compile();

    controller = module.get<RatingController>(RatingController);
  });

  it('POST usa o userId do token (ownership) e repassa o score', async () => {
    const payload = { rating: { score: 8 }, watched: { origem: 'auto' } };
    mockService.set.mockResolvedValue(payload);
    const req = { user: { userId: 42 } };

    const res = await controller.setRating(
      TitleType.MOVIE,
      872585,
      { score: 8 },
      req,
    );

    expect(mockService.set).toHaveBeenCalledWith(42, TitleType.MOVIE, 872585, 8);
    expect(res).toEqual(payload);
  });

  it('DELETE usa o userId do token e delega o remove', async () => {
    mockService.remove.mockResolvedValue(undefined);
    const req = { user: { userId: 7 } };

    await controller.removeRating(TitleType.TV, 100, req);

    expect(mockService.remove).toHaveBeenCalledWith(7, TitleType.TV, 100);
  });
});
