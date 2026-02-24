/**
 * Button utilities tests
 */


import {
  convertButtons,
  convertButton,
  createLinkButton,
  createCallbackButton,
  createButtonRow,
} from './buttons.js';
import type { TelegramButton } from '../types/index.js';

describe('Button Utilities', () => {
  describe('convertButton', () => {
    it('should convert link button', () => {
      const button: TelegramButton = {
        label: 'Visit Site',
        data: 'https://example.com',
        type: 'link',
      };

      const result = convertButton(button);

      expect(result).toEqual({
        text: 'Visit Site',
        url: 'https://example.com',
      });
    });

    it('should convert callback button with data', () => {
      const button: TelegramButton = {
        label: 'Click Me',
        data: 'action:click',
        type: 'callback',
      };

      const result = convertButton(button);

      expect(result).toEqual({
        text: 'Click Me',
        callback_data: 'action:click',
      });
    });

    it('should use label as callback_data when data is not provided', () => {
      const button: TelegramButton = {
        label: 'Click Me',
        type: 'callback',
      };

      const result = convertButton(button);

      expect(result).toEqual({
        text: 'Click Me',
        callback_data: 'Click Me',
      });
    });

    it('should return null for button without label', () => {
      const button: TelegramButton = {
        label: '',
        data: 'https://example.com',
        type: 'link',
      };

      const result = convertButton(button);

      expect(result).toBeNull();
    });

    it('should return null for link button without data', () => {
      const button: TelegramButton = {
        label: 'Visit',
        type: 'link',
      };

      const result = convertButton(button);

      expect(result).toBeNull();
    });

    it('should return null for unknown button type', () => {
      const button = {
        label: 'Test',
        type: 'unknown',
      } as TelegramButton;

      const result = convertButton(button);

      expect(result).toBeNull();
    });
  });

  describe('convertButtons', () => {
    it('should convert multiple buttons to inline keyboard', () => {
      const buttons: TelegramButton[] = [
        { label: 'Link 1', data: 'https://a.com', type: 'link' },
        { label: 'Callback 1', data: 'cb1', type: 'callback' },
      ];

      const result = convertButtons(buttons);

      expect(result.inline_keyboard).toHaveLength(2);
      expect(result.inline_keyboard[0][0]).toEqual({ text: 'Link 1', url: 'https://a.com' });
      expect(result.inline_keyboard[1][0]).toEqual({ text: 'Callback 1', callback_data: 'cb1' });
    });

    it('should filter out invalid buttons', () => {
      const buttons: TelegramButton[] = [
        { label: 'Valid', data: 'https://a.com', type: 'link' },
        { label: '', data: 'https://b.com', type: 'link' }, // Invalid - no label
        { label: 'Also Valid', data: 'cb', type: 'callback' },
      ];

      const result = convertButtons(buttons);

      expect(result.inline_keyboard).toHaveLength(2);
    });

    it('should return empty keyboard for empty array', () => {
      const result = convertButtons([]);

      expect(result.inline_keyboard).toHaveLength(0);
    });
  });

  describe('createLinkButton', () => {
    it('should create a link button', () => {
      const button = createLinkButton('Visit', 'https://example.com');

      expect(button).toEqual({
        label: 'Visit',
        data: 'https://example.com',
        type: 'link',
      });
    });
  });

  describe('createCallbackButton', () => {
    it('should create a callback button with data', () => {
      const button = createCallbackButton('Click', 'action:do');

      expect(button).toEqual({
        label: 'Click',
        data: 'action:do',
        type: 'callback',
      });
    });

    it('should use label as data when not provided', () => {
      const button = createCallbackButton('Click');

      expect(button).toEqual({
        label: 'Click',
        data: 'Click',
        type: 'callback',
      });
    });
  });

  describe('createButtonRow', () => {
    it('should create a row of buttons', () => {
      const button1 = createLinkButton('Link', 'https://a.com');
      const button2 = createCallbackButton('Callback', 'cb');

      const row = createButtonRow(button1, button2);

      expect(row).toHaveLength(2);
      expect(row[0]).toEqual({ text: 'Link', url: 'https://a.com' });
      expect(row[1]).toEqual({ text: 'Callback', callback_data: 'cb' });
    });

    it('should filter out null buttons', () => {
      const button1 = createLinkButton('Link', 'https://a.com');
      const button2: TelegramButton = { label: '', type: 'link' }; // Invalid

      const row = createButtonRow(button1, button2);

      expect(row).toHaveLength(1);
    });
  });
});
