import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { DiscoverQueryDto } from './discover-query.dto';

describe('DiscoverQueryDto', () => {
  it.each([
    [{ genre: 'ação' }, 'genre não inteiro'],
    [{ genre: '28.5' }, 'genre decimal'],
    [{ genre: '28', page: '0' }, 'page menor que 1'],
  ])('rejeita %s (%s)', async (query) => {
    const dto = plainToInstance(DiscoverQueryDto, query);

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });

  it('aceita genre inteiro e aplica page 1 por padrão', async () => {
    const dto = plainToInstance(DiscoverQueryDto, { genre: '28' });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ genre: 28, page: 1 });
  });

  it('aceita genre ausente e aplica page 1 por padrão', async () => {
    const dto = plainToInstance(DiscoverQueryDto, {});

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto).toMatchObject({ page: 1 });
    expect(dto.genre).toBeUndefined();
  });
});
