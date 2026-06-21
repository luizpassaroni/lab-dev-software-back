import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { AllExceptionsFilter } from './all-exceptions.filters';

describe('AllExceptionsFilter', () => {
  const createHost = () => {
    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const request = {
      url: '/test',
      method: 'GET',
    };
    const host = {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    return { host, response };
  };

  it('returns a generic 500 body for unhandled errors', () => {
    const logger = { error: jest.fn() } as unknown as Logger;
    const filter = new AllExceptionsFilter(logger);
    const { host, response } = createHost();

    filter.catch(new Error('database failure'), host);

    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json).toHaveBeenCalledWith({ message: 'Erro interno.' });
    expect(JSON.stringify(response.json.mock.calls)).not.toContain('stack');
    expect(logger.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'database failure',
        path: '/test',
        method: 'GET',
      }),
      'Unhandled exception',
    );
  });

  it('preserves explicit HTTP exception responses', () => {
    const logger = { error: jest.fn() } as unknown as Logger;
    const filter = new AllExceptionsFilter(logger);
    const { host, response } = createHost();
    const exception = new HttpException(
      { message: 'bad request' },
      HttpStatus.BAD_REQUEST,
    );

    filter.catch(exception, host);

    expect(response.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(response.json).toHaveBeenCalledWith({ message: 'bad request' });
    expect(logger.error).not.toHaveBeenCalled();
  });
});
