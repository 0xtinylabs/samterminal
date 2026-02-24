// Setup file to expose Jest globals in ESM mode
import { jest } from '@jest/globals';

globalThis.jest = jest;
