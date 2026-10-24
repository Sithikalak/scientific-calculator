/**
 * mathEngine.js
 * Robust Mathematical Expression Lexer, Parser & Evaluator.
 * 
 * Implements a recursive-descent / shunting-yard AST evaluator with:
 * - NO eval() or Function() constructor.
 * - Proper operator precedence and right-associative exponentiation.
 * - Implicit multiplication (e.g. 2π, 3(4+5), 5sin(30)).
 * - Scientific functions & constants.
 * - Degrees (DEG) and Radians (RAD) angle mode support with exact precision hooks.
 * - Domain validation & human-friendly error messages.
 */

export class MathEngine {
  constructor(options = {}) {
    this.angleMode = options.angleMode || 'DEG'; // 'DEG' or 'RAD'
  }

  setAngleMode(mode) {
    if (mode === 'DEG' || mode === 'RAD') {
      this.angleMode = mode;
    }
  }

  /**
   * Tokenizes an expression string.
   */
  tokenize(rawExpression) {
    if (!rawExpression || typeof rawExpression !== 'string') {
      return [];
    }

    // Normalize display symbols to standard internal symbols
    let expr = rawExpression
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/−/g, '-')
      .replace(/–/g, '-')
      .replace(/\u00D7/g, '*') // multiplication sign
      .replace(/\u00F7/g, '/') // division sign
      .replace(/π/g, 'pi')
      .replace(/√/g, 'sqrt')
      .replace(/∛/g, 'cbrt')
      .replace(/sin⁻¹/g, 'asin')
      .replace(/cos⁻¹/g, 'acos')
      .replace(/tan⁻¹/g, 'atan')
      .replace(/e\^/g, 'exp')
      .replace(/10\^/g, 'tenpow');

    const tokens = [];
    let i = 0;
    const len = expr.length;

    const isDigit = (c) => c >= '0' && c <= '9';
    const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');

    while (i < len) {
      const c = expr[i];

      // Whitespace
      if (/\s/.test(c)) {
        i++;
        continue;
      }

      // Numbers (including scientific notation like 1.5e3 or 1.5e-3 when after digit)
      if (isDigit(c) || (c === '.' && i + 1 < len && isDigit(expr[i + 1]))) {
        let numStr = '';
        let hasDot = false;

        while (i < len) {
          const ch = expr[i];
          if (isDigit(ch)) {
            numStr += ch;
            i++;
          } else if (ch === '.' && !hasDot) {
            hasDot = true;
            numStr += ch;
            i++;
          } else if ((ch === 'e' || ch === 'E') && numStr.length > 0) {
            // Check if scientific notation (e.g. 1.2e+4 or 1.2e-4 or 1.2e4)
            const nextCh = expr[i + 1];
            const nextNextCh = expr[i + 2];
            if (nextCh === '+' || nextCh === '-') {
              if (nextNextCh && isDigit(nextNextCh)) {
                numStr += ch + nextCh + nextNextCh;
                i += 3;
                while (i < len && isDigit(expr[i])) {
                  numStr += expr[i];
                  i++;
                }
                break;
              }
            } else if (nextCh && isDigit(nextCh)) {
              numStr += ch + nextCh;
              i += 2;
              while (i < len && isDigit(expr[i])) {
                numStr += expr[i];
                i++;
              }
              break;
            }
            break;
          } else {
            break;
          }
        }

        tokens.push({ type: 'NUMBER', value: parseFloat(numStr), raw: numStr });
        continue;
      }

      // Identifiers: functions, constants
      if (isLetter(c)) {
        let ident = '';
        while (i < len && isLetter(expr[i])) {
          ident += expr[i];
          i++;
        }

        const lower = ident.toLowerCase();

        // Check constants
        if (lower === 'pi') {
          tokens.push({ type: 'CONSTANT', value: Math.PI, name: 'π' });
          continue;
        }
        if (lower === 'e') {
          tokens.push({ type: 'CONSTANT', value: Math.E, name: 'e' });
          continue;
        }

        // Check known functions
        const knownFunctions = [
          'sin', 'cos', 'tan',
          'asin', 'acos', 'atan',
          'sinh', 'cosh', 'tanh',
          'log', 'ln', 'log10', 'log2',
          'sqrt', 'cbrt', 'abs', 'exp',
          'tenpow'
        ];

        if (knownFunctions.includes(lower)) {
          tokens.push({ type: 'FUNCTION', name: lower });
          continue;
        }

        throw new Error(`Unknown identifier: "${ident}"`);
      }

      // Operators and punctuation
      if (c === '+') {
        tokens.push({ type: 'OP', value: '+', precedence: 2, assoc: 'L' });
        i++;
        continue;
      }
      if (c === '-') {
        tokens.push({ type: 'OP', value: '-', precedence: 2, assoc: 'L' });
        i++;
        continue;
      }
      if (c === '*' || c === '×') {
        tokens.push({ type: 'OP', value: '*', precedence: 3, assoc: 'L' });
        i++;
        continue;
      }
      if (c === '/' || c === '÷') {
        tokens.push({ type: 'OP', value: '/', precedence: 3, assoc: 'L' });
        i++;
        continue;
      }
      if (c === '^') {
        tokens.push({ type: 'OP', value: '^', precedence: 4, assoc: 'R' });
        i++;
        continue;
      }
      if (c === '%') {
        tokens.push({ type: 'POSTFIX', value: '%', precedence: 5 });
        i++;
        continue;
      }
      if (c === '!') {
        tokens.push({ type: 'POSTFIX', value: '!', precedence: 5 });
        i++;
        continue;
      }
      if (c === '(') {
        tokens.push({ type: 'LPAREN', value: '(' });
        i++;
        continue;
      }
      if (c === ')') {
        tokens.push({ type: 'RPAREN', value: ')' });
        i++;
        continue;
      }
      if (c === ',') {
        tokens.push({ type: 'COMMA', value: ',' });
        i++;
        continue;
      }

      throw new Error(`Unexpected character: "${c}"`);
    }

    // Insert implicit multiplication tokens
    return this.insertImplicitMultiplication(tokens);
  }

  /**
   * Inserts implicit multiplication where mathematically assumed:
   * e.g. 2(3) -> 2*(3), (2)(3) -> (2)*(3), 2pi -> 2*pi, 2sqrt(4) -> 2*sqrt(4), (4)pi -> (4)*pi
   */
  insertImplicitMultiplication(tokens) {
    const result = [];
    const isOperand = (t) => t && (t.type === 'NUMBER' || t.type === 'CONSTANT' || t.type === 'RPAREN' || t.type === 'POSTFIX');
    const isNextFactor = (t) => t && (t.type === 'NUMBER' || t.type === 'CONSTANT' || t.type === 'LPAREN' || t.type === 'FUNCTION');

    for (let i = 0; i < tokens.length; i++) {
      const curr = tokens[i];
      const next = tokens[i + 1];

      result.push(curr);

      if (next) {
        // e.g. 5( -> 5 * (
        // e.g. )5 -> ) * 5
        // e.g. ) ( -> ) * (
        // e.g. 5 pi -> 5 * pi
        // e.g. pi 5 -> pi * 5
        // e.g. 5 sin -> 5 * sin
        // e.g. ) sin -> ) * sin
        // e.g. 5! 2 -> 5! * 2
        const needsMult =
          (isOperand(curr) && (next.type === 'LPAREN' || next.type === 'CONSTANT' || next.type === 'FUNCTION')) ||
          ((curr.type === 'NUMBER' || curr.type === 'CONSTANT' || curr.type === 'POSTFIX') && next.type === 'NUMBER') ||
          (curr.type === 'RPAREN' && (next.type === 'NUMBER' || next.type === 'CONSTANT'));

        if (needsMult) {
          result.push({ type: 'OP', value: '*', precedence: 3, assoc: 'L', implicit: true });
        }
      }
    }
    return result;
  }

  /**
   * Shunting-Yard Algorithm to convert tokens into Reverse Polish Notation (RPN),
   * handling unary plus/minus, operator precedence, associativity, and function calls.
   */
  toRPN(tokens) {
    const outputQueue = [];
    const operatorStack = [];
    let prevToken = null;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      if (token.type === 'NUMBER' || token.type === 'CONSTANT') {
        outputQueue.push(token);
      } else if (token.type === 'FUNCTION') {
        operatorStack.push(token);
      } else if (token.type === 'POSTFIX') {
        // Postfix operators like ! and % bind immediately to the previous operand
        outputQueue.push(token);
      } else if (token.type === 'OP') {
        // Check for unary minus or plus:
        // Occurs at the start of expression, or immediately after an OP, LPAREN, or COMMA
        const isUnary =
          prevToken === null ||
          prevToken.type === 'OP' ||
          prevToken.type === 'LPAREN' ||
          prevToken.type === 'COMMA';

        if (isUnary) {
          if (token.value === '-') {
            operatorStack.push({
              type: 'UNARY_OP',
              value: 'neg',
              precedence: 4.5,
              assoc: 'R'
            });
            prevToken = token;
            continue;
          } else if (token.value === '+') {
            // Unary plus is a no-op, ignore
            prevToken = token;
            continue;
          } else {
            throw new Error(`Unexpected operator "${token.value}"`);
          }
        }

        const o1 = token;
        while (operatorStack.length > 0) {
          const o2 = operatorStack[operatorStack.length - 1];
          if (o2.type === 'LPAREN') break;

          const o1Prec = o1.precedence;
          const o2Prec = o2.precedence;

          if (
            (o1.assoc === 'L' && o1Prec <= o2Prec) ||
            (o1.assoc === 'R' && o1Prec < o2Prec)
          ) {
            outputQueue.push(operatorStack.pop());
          } else {
            break;
          }
        }
        operatorStack.push(o1);
      } else if (token.type === 'COMMA') {
        while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type !== 'LPAREN') {
          outputQueue.push(operatorStack.pop());
        }
        if (operatorStack.length === 0) {
          throw new Error('Misplaced comma or missing opening parenthesis');
        }
      } else if (token.type === 'LPAREN') {
        operatorStack.push(token);
      } else if (token.type === 'RPAREN') {
        let foundLeftParen = false;
        while (operatorStack.length > 0) {
          const top = operatorStack.pop();
          if (top.type === 'LPAREN') {
            foundLeftParen = true;
            break;
          } else {
            outputQueue.push(top);
          }
        }
        if (!foundLeftParen) {
          throw new Error('Mismatched parentheses: extra closing parenthesis');
        }

        // If top of stack is a function, pop it to output
        if (operatorStack.length > 0 && operatorStack[operatorStack.length - 1].type === 'FUNCTION') {
          outputQueue.push(operatorStack.pop());
        }
      }

      prevToken = token;
    }

    while (operatorStack.length > 0) {
      const top = operatorStack.pop();
      if (top.type === 'LPAREN' || top.type === 'RPAREN') {
        throw new Error('Mismatched parentheses: unclosed parenthesis');
      }
      outputQueue.push(top);
    }

    return outputQueue;
  }

  /**
   * Evaluates the RPN queue.
   */
  evaluateRPN(rpnQueue) {
    const stack = [];

    for (let i = 0; i < rpnQueue.length; i++) {
      const token = rpnQueue[i];

      if (token.type === 'NUMBER' || token.type === 'CONSTANT') {
        stack.push(token.value);
      } else if (token.type === 'UNARY_OP' && token.value === 'neg') {
        if (stack.length < 1) throw new Error('Invalid syntax: missing operand for negation');
        const val = stack.pop();
        stack.push(-val);
      } else if (token.type === 'POSTFIX') {
        if (stack.length < 1) throw new Error(`Invalid syntax: missing operand for ${token.value}`);
        const val = stack.pop();
        if (token.value === '!') {
          stack.push(this.computeFactorial(val));
        } else if (token.value === '%') {
          stack.push(val / 100);
        }
      } else if (token.type === 'OP') {
        if (stack.length < 2) throw new Error(`Invalid syntax: missing operand for "${token.value}"`);
        const b = stack.pop();
        const a = stack.pop();

        switch (token.value) {
          case '+':
            stack.push(a + b);
            break;
          case '-':
            stack.push(a - b);
            break;
          case '*':
            stack.push(a * b);
            break;
          case '/':
            if (b === 0) {
              throw new Error('Cannot divide by zero');
            }
            stack.push(a / b);
            break;
          case '^':
            if (a < 0 && !Number.isInteger(b)) {
              throw new Error('Invalid operation: negative base with fractional exponent');
            }
            stack.push(Math.pow(a, b));
            break;
          default:
            throw new Error(`Unsupported operator: ${token.value}`);
        }
      } else if (token.type === 'FUNCTION') {
        if (stack.length < 1) throw new Error(`Function "${token.name}" requires an argument`);
        const arg = stack.pop();
        stack.push(this.applyFunction(token.name, arg));
      }
    }

    if (stack.length !== 1) {
      throw new Error('Malformed expression');
    }

    let finalVal = stack[0];
    if (typeof finalVal !== 'number' || isNaN(finalVal)) {
      throw new Error('Calculation resulted in undefined (NaN)');
    }

    // Clean up floating point precision issues (e.g., 0.1 + 0.2 = 0.3)
    return this.cleanFloat(finalVal);
  }

  /**
   * Applies scientific functions respecting current angle mode (DEG or RAD).
   */
  applyFunction(name, arg) {
    const isDeg = this.angleMode === 'DEG';

    switch (name) {
      case 'sin': {
        if (isDeg) {
          // Normalize angle to [0, 360)
          const norm = ((arg % 360) + 360) % 360;
          if (norm === 0 || norm === 180) return 0;
          if (norm === 90) return 1;
          if (norm === 270) return -1;
          if (norm === 30 || norm === 150) return 0.5;
          if (norm === 210 || norm === 330) return -0.5;
          return Math.sin((arg * Math.PI) / 180);
        }
        return Math.sin(arg);
      }

      case 'cos': {
        if (isDeg) {
          const norm = ((arg % 360) + 360) % 360;
          if (norm === 90 || norm === 270) return 0;
          if (norm === 0) return 1;
          if (norm === 180) return -1;
          if (norm === 60 || norm === 300) return 0.5;
          if (norm === 120 || norm === 240) return -0.5;
          return Math.cos((arg * Math.PI) / 180);
        }
        return Math.cos(arg);
      }

      case 'tan': {
        if (isDeg) {
          const norm = ((arg % 180) + 180) % 180;
          if (norm === 90) throw new Error('Tangent undefined at 90° + k·180°');
          if (norm === 0) return 0;
          if (norm === 45) return 1;
          if (norm === 135) return -1;
          return Math.tan((arg * Math.PI) / 180);
        }
        // In radians, check close to pi/2 + k*pi
        const radMod = Math.abs(arg % Math.PI);
        if (Math.abs(radMod - Math.PI / 2) < 1e-15) {
          throw new Error('Tangent undefined at π/2 + k·π');
        }
        return Math.tan(arg);
      }

      case 'asin': {
        if (arg < -1 || arg > 1) {
          throw new Error('Domain error: sin⁻¹ input must be between -1 and 1');
        }
        const rad = Math.asin(arg);
        return isDeg ? (rad * 180) / Math.PI : rad;
      }

      case 'acos': {
        if (arg < -1 || arg > 1) {
          throw new Error('Domain error: cos⁻¹ input must be between -1 and 1');
        }
        const rad = Math.acos(arg);
        return isDeg ? (rad * 180) / Math.PI : rad;
      }

      case 'atan': {
        const rad = Math.atan(arg);
        return isDeg ? (rad * 180) / Math.PI : rad;
      }

      case 'log':
      case 'log10': {
        if (arg <= 0) {
          throw new Error('Logarithm undefined for numbers ≤ 0');
        }
        return Math.log10(arg);
      }

      case 'ln': {
        if (arg <= 0) {
          throw new Error('Natural logarithm undefined for numbers ≤ 0');
        }
        return Math.log(arg);
      }

      case 'log2': {
        if (arg <= 0) {
          throw new Error('Logarithm undefined for numbers ≤ 0');
        }
        return Math.log2(arg);
      }

      case 'sqrt': {
        if (arg < 0) {
          throw new Error('Cannot calculate square root of a negative number');
        }
        return Math.sqrt(arg);
      }

      case 'cbrt': {
        return Math.cbrt(arg);
      }

      case 'abs': {
        return Math.abs(arg);
      }

      case 'exp': {
        const res = Math.exp(arg);
        if (!isFinite(res)) throw new Error('Exponential overflow');
        return res;
      }

      case 'tenpow': {
        const res = Math.pow(10, arg);
        if (!isFinite(res)) throw new Error('Power overflow');
        return res;
      }

      default:
        throw new Error(`Unsupported function: ${name}`);
    }
  }

  /**
   * Factorial calculation with strict validation.
   */
  computeFactorial(n) {
    if (!Number.isInteger(n) || n < 0) {
      throw new Error('Factorial requires a non-negative integer');
    }
    if (n > 170) {
      throw new Error('Factorial overflow (n must be ≤ 170)');
    }
    if (n === 0 || n === 1) return 1;

    let result = 1;
    for (let i = 2; i <= n; i++) {
      result *= i;
    }
    return result;
  }

  /**
   * Cleans floating point representation to eliminate 0.0000000000000004 quirks.
   */
  cleanFloat(num) {
    if (!isFinite(num)) return num;
    // 14 significant digits cleanup
    const fixed = parseFloat(num.toPrecision(14));
    return Math.abs(fixed) < 1e-15 ? 0 : fixed;
  }

  /**
   * Main evaluate method.
   * Takes a raw mathematical expression string and returns the evaluated number.
   */
  evaluate(rawExpression) {
    if (!rawExpression || !rawExpression.trim()) {
      return 0;
    }
    const tokens = this.tokenize(rawExpression.trim());
    if (tokens.length === 0) return 0;
    const rpn = this.toRPN(tokens);
    return this.evaluateRPN(rpn);
  }
}
