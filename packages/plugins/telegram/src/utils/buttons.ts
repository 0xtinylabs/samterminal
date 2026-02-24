/**
 * Button utilities for Telegram inline keyboards
 */

import type TelegramBot from 'node-telegram-bot-api';
import type { TelegramButton } from '../types/index.js';

/**
 * Convert plugin buttons to Telegram inline keyboard format
 */
export function convertButtons(
  buttons: TelegramButton[],
): TelegramBot.InlineKeyboardMarkup {
  const keyboard: TelegramBot.InlineKeyboardButton[][] = [];

  for (const button of buttons) {
    const telegramButton = convertButton(button);
    if (telegramButton) {
      keyboard.push([telegramButton]);
    }
  }

  return { inline_keyboard: keyboard };
}

/**
 * Convert a single button to Telegram format
 */
export function convertButton(
  button: TelegramButton,
): TelegramBot.InlineKeyboardButton | null {
  if (!button.label) {
    return null;
  }

  switch (button.type) {
    case 'link':
      if (!button.data) return null;
      return {
        text: button.label,
        url: button.data,
      };

    case 'callback':
      return {
        text: button.label,
        callback_data: button.data ?? button.label,
      };

    default:
      return null;
  }
}

/**
 * Create a link button
 */
export function createLinkButton(label: string, url: string): TelegramButton {
  return {
    label,
    data: url,
    type: 'link',
  };
}

/**
 * Create a callback button
 */
export function createCallbackButton(
  label: string,
  callbackData?: string,
): TelegramButton {
  return {
    label,
    data: callbackData ?? label,
    type: 'callback',
  };
}

/**
 * Create a row of buttons
 */
export function createButtonRow(
  ...buttons: TelegramButton[]
): TelegramBot.InlineKeyboardButton[] {
  return buttons
    .map(convertButton)
    .filter((b): b is TelegramBot.InlineKeyboardButton => b !== null);
}
