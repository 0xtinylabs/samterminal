/**
 * Axios mocks for testing
 */

/**
 * Mock axios response
 */
export interface MockAxiosResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  config: Record<string, unknown>;
}

/**
 * Mock axios error
 */
export interface MockAxiosError {
  message: string;
  response?: MockAxiosResponse;
  code?: string;
  isAxiosError: true;
}

/**
 * Mock axios instance interface
 */
export interface MockAxiosInstance {
  get: jest.Mock;
  post: jest.Mock;
  put: jest.Mock;
  delete: jest.Mock;
  patch: jest.Mock;
  request: jest.Mock;
  defaults: {
    baseURL?: string;
    headers: Record<string, Record<string, string>>;
    timeout?: number;
  };
  interceptors: {
    request: { use: jest.Mock; eject: jest.Mock };
    response: {
      use: jest.Mock;
      eject: jest.Mock;
    };
  };
}

/**
 * Create a mock axios instance
 */
export function createMockAxiosInstance(
  defaultResponse?: unknown,
): MockAxiosInstance {
  const mockResponse: MockAxiosResponse = {
    data: defaultResponse ?? {},
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  };

  return {
    get: jest.fn().mockResolvedValue(mockResponse),
    post: jest.fn().mockResolvedValue(mockResponse),
    put: jest.fn().mockResolvedValue(mockResponse),
    delete: jest.fn().mockResolvedValue(mockResponse),
    patch: jest.fn().mockResolvedValue(mockResponse),
    request: jest.fn().mockResolvedValue(mockResponse),
    defaults: {
      headers: {
        common: {},
        get: {},
        post: {},
        put: {},
        delete: {},
        patch: {},
      },
    },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  };
}

/**
 * Create mock axios module
 */
export function createMockAxios(): {
  default: MockAxiosInstance & { create: jest.Mock };
  create: jest.Mock;
  isAxiosError: (error: unknown) => error is MockAxiosError;
} {
  const instance = createMockAxiosInstance();

  const create = jest.fn().mockReturnValue(createMockAxiosInstance());

  const axiosMock = {
    ...instance,
    create,
  };

  return {
    default: axiosMock,
    create,
    isAxiosError: (error: unknown): error is MockAxiosError => {
      return (
        typeof error === 'object' &&
        error !== null &&
        'isAxiosError' in error &&
        (error as MockAxiosError).isAxiosError === true
      );
    },
  };
}

/**
 * Create a mock axios error
 */
export function createMockAxiosError(
  message: string,
  status?: number,
  data?: unknown,
): MockAxiosError {
  const error: MockAxiosError = {
    message,
    isAxiosError: true,
    code: status ? `ERR_${status}` : 'ERR_NETWORK',
  };

  if (status) {
    error.response = {
      data: data ?? { error: message },
      status,
      statusText: getStatusText(status),
      headers: {},
      config: {},
    };
  }

  return error;
}

/**
 * Get HTTP status text
 */
function getStatusText(status: number): string {
  const statusTexts: Record<number, string> = {
    200: 'OK',
    201: 'Created',
    400: 'Bad Request',
    401: 'Unauthorized',
    403: 'Forbidden',
    404: 'Not Found',
    429: 'Too Many Requests',
    500: 'Internal Server Error',
    502: 'Bad Gateway',
    503: 'Service Unavailable',
  };
  return statusTexts[status] ?? 'Unknown';
}

/**
 * Reset mock axios instance
 */
export function resetMockAxiosInstance(instance: MockAxiosInstance): void {
  instance.get.mockClear();
  instance.post.mockClear();
  instance.put.mockClear();
  instance.delete.mockClear();
  instance.patch.mockClear();
  instance.request.mockClear();
}

/**
 * Setup mock axios to return specific responses for URLs
 */
export function setupMockAxiosResponses(
  instance: MockAxiosInstance,
  responses: Record<string, unknown>,
): void {
  instance.get.mockImplementation(async (url: string) => {
    const data = responses[url];
    if (data === undefined) {
      throw createMockAxiosError(`No mock response for GET ${url}`, 404);
    }
    return { data, status: 200, statusText: 'OK', headers: {}, config: {} };
  });

  instance.post.mockImplementation(async (url: string) => {
    const data = responses[url];
    if (data === undefined) {
      throw createMockAxiosError(`No mock response for POST ${url}`, 404);
    }
    return { data, status: 200, statusText: 'OK', headers: {}, config: {} };
  });
}
