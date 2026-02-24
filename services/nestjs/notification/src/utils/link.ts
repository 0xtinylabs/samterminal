export class LinkUtil {
  getTelegramBotStartLink(bot_name: string, ref: string) {
    return `https://t.me/${bot_name}?start=${ref}`;
  }
}

export const linkUtil = new LinkUtil();
