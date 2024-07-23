import { CODE_OPENER, CODE_CLOSER } from "./enums";

/***
 * Helper function for validating text for code injections.
 * Utilizes a stack.
 */
export function validateCodeInjection(text) {
  const stack = [];
  let substring = "";

  for (const char of text) {
    if (CODE_CLOSER.includes(char)) {
      substring = substring.concat(char);
      if (substring === CODE_OPENER) {
        if (stack.length !== 0) {
          return false;
        }
        stack.push(CODE_OPENER);
        substring = "";
      } else if (substring === CODE_CLOSER) {
        substring = "";
        const lastChar = stack.pop();
        if (lastChar !== CODE_OPENER) {
          return false;
        }
      }
    }
  }

  if (stack.length === 0) {
    return true;
  } else {
    return false;
  }
}
