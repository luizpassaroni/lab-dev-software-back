import { Test, TestingModule } from '@nestjs/testing';
import { WatchedController } from './watched.controller';
import { WatchedService } from './watched.service';
import { TitleType } from '../../titles/dto/title-type.enum';

describe('WatchedController', () => {
  let controller: WatchedController;
  const mockService = { mark: jest.fn(), unmark: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WatchedController],
      providers: [{ provide: WatchedService, useValue: mockService }],
    }).compile();

    controller = module.get<WatchedController>(WatchedController);
  });

  it('POST usa o userId do token (ownership) e marca o visto', async () => {
    mockService.mark.mockResolvedValue({ watched: { origem: 'manual' } });
    const req = { user: { userId: 42 } };

    const res = await controller.markWatched(TitleType.MOVIE, 872585, req);

    expect(mockService.mark).toHaveBeenCalledWith(42, TitleType.MOVIE, 872585);
    expect(res).toEqual({ watched: { origem: 'manual' } });
  });

  it('DELETE usa o userId do token e desmarca o visto', async () => {
    mockService.unmark.mockResolvedValue(undefined);
    const req = { user: { userId: 7 } };

    await controller.unmarkWatched(TitleType.TV, 100, req);

    expect(mockService.unmark).toHaveBeenCalledWith(7, TitleType.TV, 100);
  });
});
