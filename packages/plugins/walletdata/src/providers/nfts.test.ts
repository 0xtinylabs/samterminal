/**
 * Wallet NFTs provider tests
 */


import { createWalletNftsProvider } from './nfts.js';
import type { WalletDataPluginConfig, WalletNft } from '../types/index.js';
import type { MoralisWalletClient } from '../utils/moralis.js';
import type { Cache } from '../utils/cache.js';
import type { ProviderContext } from '@samterminal/core';

describe('WalletNftsProvider', () => {
  let mockMoralis: MoralisWalletClient;
  let mockCache: Cache<WalletNft[]>;
  let config: WalletDataPluginConfig;

  beforeEach(() => {
    mockMoralis = {
      getWalletNfts: jest.fn(),
    } as unknown as MoralisWalletClient;

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      has: jest.fn(),
      delete: jest.fn(),
      clear: jest.fn(),
    } as unknown as Cache<WalletNft[]>;

    config = {
      defaultChain: 'base',
      enableCache: true,
      cacheTtl: 30000,
      excludeSpam: true,
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
      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      expect(provider.name).toBe('walletdata:nfts');
      expect(provider.type).toBe('wallet');
    });
  });

  describe('get', () => {
    it('should return error when address is missing', async () => {
      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({}));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Wallet address is required');
    });

    it('should return error when Moralis not available', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);

      const provider = createWalletNftsProvider(
        () => null,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('Moralis API key required for NFTs');
    });

    it('should return cached data when available', async () => {
      const cachedNfts: WalletNft[] = [
        {
          contractAddress: '0xCollection',
          tokenId: '1',
          chainId: 'base',
          name: 'NFT #1',
          collectionName: 'My Collection',
          standard: 'ERC721',
          amount: 1,
        },
      ];

      jest.mocked(mockCache.get).mockReturnValue(cachedNfts);

      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.cached).toBe(true);
      expect(result.data).toEqual(cachedNfts);
    });

    it('should fetch NFTs from Moralis', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletNfts).mockResolvedValue({
        result: [
          {
            token_address: '0xCollection',
            token_id: '1',
            name: 'My Collection',
            symbol: 'MC',
            contract_type: 'ERC721',
            amount: '1',
            possible_spam: false,
            floor_price_usd: '100.50',
            normalized_metadata: {
              name: 'NFT #1',
              description: 'A cool NFT',
              image: 'https://images.com/nft1.png',
              animation_url: 'https://videos.com/nft1.mp4',
              attributes: [
                { trait_type: 'Rarity', value: 'Rare' },
              ],
            },
          },
        ],
      } as any);

      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual(expect.objectContaining({
        contractAddress: '0xCollection',
        tokenId: '1',
        name: 'NFT #1',
        description: 'A cool NFT',
        imageUrl: 'https://images.com/nft1.png',
        animationUrl: 'https://videos.com/nft1.mp4',
        collectionName: 'My Collection',
        collectionSymbol: 'MC',
        standard: 'ERC721',
        amount: 1,
        floorPriceUsd: 100.50,
      }));
    });

    it('should filter out spam NFTs', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletNfts).mockResolvedValue({
        result: [
          {
            token_address: '0xLegit',
            token_id: '1',
            name: 'Legit Collection',
            contract_type: 'ERC721',
            amount: '1',
            possible_spam: false,
            normalized_metadata: { name: 'NFT #1' },
          },
          {
            token_address: '0xSpam',
            token_id: '1',
            name: 'Spam Collection',
            contract_type: 'ERC721',
            amount: '1',
            possible_spam: true,
            normalized_metadata: { name: 'Spam NFT' },
          },
        ],
      } as any);

      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data).toHaveLength(1);
      expect(result.data[0].contractAddress).toBe('0xLegit');
    });

    it('should handle ERC1155 tokens', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletNfts).mockResolvedValue({
        result: [
          {
            token_address: '0xCollection',
            token_id: '1',
            name: 'Multi Collection',
            contract_type: 'ERC1155',
            amount: '5',
            possible_spam: false,
            normalized_metadata: { name: 'NFT #1' },
          },
        ],
      } as any);

      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.data[0].standard).toBe('ERC1155');
      expect(result.data[0].amount).toBe(5);
    });

    it('should filter by collection', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletNfts).mockResolvedValue({
        result: [],
      } as any);

      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      await provider.get(createContext({
        address: '0xWallet',
        collection: '0xSpecificCollection',
      }));

      expect(mockMoralis.getWalletNfts).toHaveBeenCalledWith(
        '0xWallet',
        'base',
        expect.objectContaining({
          tokenAddresses: ['0xSpecificCollection'],
        }),
      );
    });

    it('should use collection name when metadata name is missing', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletNfts).mockResolvedValue({
        result: [
          {
            token_address: '0xCollection',
            token_id: '123',
            name: 'My Collection',
            contract_type: 'ERC721',
            amount: '1',
            possible_spam: false,
            normalized_metadata: null,
          },
        ],
      } as any);

      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      // When metadata.name is null, falls back to nft.name (collection name)
      expect(result.data[0].name).toBe('My Collection');
    });

    it('should use tokenId as name when no name available', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletNfts).mockResolvedValue({
        result: [
          {
            token_address: '0xCollection',
            token_id: '456',
            name: null, // No collection name
            contract_type: 'ERC721',
            amount: '1',
            possible_spam: false,
            normalized_metadata: null, // No metadata name either
          },
        ],
      } as any);

      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      // Falls back to #tokenId when both metadata.name and nft.name are null
      expect(result.data[0].name).toBe('#456');
    });

    it('should cache result after fetching', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletNfts).mockResolvedValue({
        result: [
          {
            token_address: '0xCollection',
            token_id: '1',
            name: 'Collection',
            contract_type: 'ERC721',
            amount: '1',
            possible_spam: false,
            normalized_metadata: { name: 'NFT' },
          },
        ],
      } as any);

      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      await provider.get(createContext({ address: '0xWallet' }));

      expect(mockCache.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([
          expect.objectContaining({ contractAddress: '0xCollection' }),
        ]),
        30000,
      );
    });

    it('should handle Moralis errors', async () => {
      jest.mocked(mockCache.get).mockReturnValue(undefined);
      jest.mocked(mockMoralis.getWalletNfts).mockRejectedValue(new Error('API Error'));

      const provider = createWalletNftsProvider(
        () => mockMoralis,
        () => mockCache,
        config,
      );

      const result = await provider.get(createContext({ address: '0xWallet' }));

      expect(result.success).toBe(false);
      expect(result.error).toBe('API Error');
    });
  });
});
