/**
 * Token security provider tests
 */


import { createTokenSecurityProvider } from './security.js';
import type { TokenDataPluginConfig, TokenSecurity } from '../types/index.js';
import type { MoralisClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('TokenSecurityProvider', () => {
  let mockMoralis: MoralisClient;
  let mockCache: Cache<TokenSecurity>;
  let config: TokenDataPluginConfig;

  beforeEach(() => {
    mockMoralis = {
      getTokenSecurity: jest.fn(),
    } as unknown as MoralisClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<TokenSecurity>;

    config = {
      defaultChain: 'base',
      enableCache: true,
      cacheTtl: 30000,
    };
  });

  const createContext = (query: unknown): ProviderContext => ({
    query,
    params: {},
    user: undefined,
    metadata: {},
  });

  describe('provider metadata', () => {
    it('should have correct name and type', () => {
      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('tokendata:security');
      expect(provider.type).toBe('token');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token address is required');
    });

    it('should return cached data when available', async () => {
      const cachedSecurity: TokenSecurity = {
        address: '0xToken',
        chainId: 'base',
        isVerified: true,
        isHoneypot: false,
        isMintable: false,
        isProxy: false,
        hasBlacklist: false,
        hasWhitelist: false,
        hasTradingCooldown: false,
        isOwnerRenounced: true,
        riskLevel: 'low',
        warnings: [],
        lastUpdated: new Date().toISOString(),
      };

      jest.mocked(mockCache.get).mockReturnValue(cachedSecurity);

      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedSecurity);
      expect(mockMoralis.getTokenSecurity).not.toHaveBeenCalled();
    });

    it('should return error when Moralis client is not available', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);

      const provider = createTokenSecurityProvider(
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Moralis API key required for security analysis');
    });

    it('should fetch security data from Moralis', async () => {
      const mockSecurityData: TokenSecurity = {
        address: '0xToken',
        chainId: 'base',
        isVerified: true,
        isHoneypot: false,
        isMintable: false,
        isProxy: false,
        hasBlacklist: false,
        hasWhitelist: false,
        hasTradingCooldown: false,
        isOwnerRenounced: false,
        riskLevel: 'low',
        warnings: [],
        lastUpdated: new Date().toISOString(),
      };

      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getTokenSecurity).mockResolvedValue(mockSecurityData);

      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockSecurityData);
      expect(mockMoralis.getTokenSecurity).toHaveBeenCalledWith('base', '0xToken');
    });

    it('should use query chainId over default', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getTokenSecurity).mockResolvedValue({} as any);

      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xToken', chainId: 'ethereum' }));

      expect(mockMoralis.getTokenSecurity).toHaveBeenCalledWith('ethereum', '0xToken');
    });

    it('should return error when token not found', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getTokenSecurity).mockResolvedValue(null);

      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xNonExistent' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Token not found or security data unavailable');
    });

    it('should cache result with extended TTL', async () => {
      const mockSecurityData: TokenSecurity = {
        address: '0xToken',
        chainId: 'base',
        isVerified: true,
        isHoneypot: false,
        isMintable: false,
        isProxy: false,
        hasBlacklist: false,
        hasWhitelist: false,
        hasTradingCooldown: false,
        isOwnerRenounced: true,
        riskLevel: 'low',
        warnings: [],
        lastUpdated: new Date().toISOString(),
      };

      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getTokenSecurity).mockResolvedValue(mockSecurityData);

      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xToken' }));

      // Security data should be cached with 10x TTL (300000ms = 5 minutes)
      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        mockSecurityData,
        300000, // 30000 * 10
      );
    });

    it('should not use cache when disabled', async () => {
      const noCacheConfig: TokenDataPluginConfig = {
        ...config,
        enableCache: false,
      };

      jest.mocked(mockMoralis.getTokenSecurity).mockResolvedValue({} as any);

      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        noCacheConfig,
      );

      await provider.get(createContext({ address: '0xToken' }));

      expect(mockCache.get).not.toHaveBeenCalled();
      expect(mockCache.set).not.toHaveBeenCalled();
    });

    it('should handle Moralis errors', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getTokenSecurity).mockRejectedValue(new Error('API Error'));

      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xToken' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });

    it('should include deepScan flag in cache key', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getTokenSecurity).mockResolvedValue({} as any);

      const provider = createTokenSecurityProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      await provider.get(createContext({
        address: '0xToken',
        deepScan: true,
      }));

      // Verify cache key includes deepScan
      expect(mockCache.get).toHaveBeenCalledWith(
        expect.stringContaining('deepScan=true'),
      );
    });
  });
});
