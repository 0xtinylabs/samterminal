import { faker } from '@faker-js/faker';

export class CodeUtil {
  public chars = [
    'a',
    'b',
    'c',
    'd',
    'e',
    'f',
    'g',
    'h',
    'i',
    'j',
    'k',
    'l',
    'm',
    'n',
    'o',
    'p',
    'q',
    'r',
    's',
    't',
    'u',
    'v',
    'y',
    'z',
    'x',
  ];

  public numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];

  generateCode(length: number) {
    let result = '';
    for (let i = 0; i < length; i++) {
      const isChar = Math.random() > 0.5;
      if (isChar) {
        const char =
          this.chars[faker.number.int({ min: 0, max: this.chars.length - 1 })];
        result += char.toUpperCase();
      } else {
        const char =
          this.numbers[
            faker.number.int({ min: 0, max: this.numbers.length - 1 })
          ];
        result += char.toUpperCase();
      }
    }
    return result;
  }
}

export const codeUtil = new CodeUtil();
