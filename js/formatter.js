/**
 * formatter.js
 * Utility for formatting numbers and mathematical expressions cleanly,
 * and managing syntax-highlighted display representations.
 */

export class Formatter {
  /**
   * Formats a raw numerical result for display.
   * - Eliminates floating-point precision garbage.
   * - Uses scientific notation for very large (>= 1e12) or very small (< 1e-7) numbers.
   * - Inserts localized thousand-separators for readability when appropriate.
   */
  static formatResult(value, options = {}) {
    if (value === null || value === undefined) return '0';
    if (typeof value === 'string') return value;

    if (!isFinite(value)) {
      if (value === Infinity) return '∞ (Infinity)';
      if (value === -Infinity) return '-∞ (-Infinity)';
      return 'Undefined';
    }

    if (value === 0) return '0';

    const absVal = Math.abs(value);

    // If extremely large or extremely small, use scientific notation
    if (absVal >= 1e12 || (absVal < 1e-7 && absVal > 0)) {
      const expStr = value.toExponential(8);
      // Clean up trailing zeros in exponent mantissa: 1.20000000e+15 -> 1.2e+15
      const [mantissa, exp] = expStr.split('e');
      const cleanMantissa = parseFloat(mantissa).toString();
      const expNum = parseInt(exp, 10);
      return `${cleanMantissa} × 10${this.toSuperscript(expNum)}`;
    }

    // Standard decimal formatting: keep up to 10 decimal places, trimmed
    // Round to 12 significant digits first to eliminate 0.000000000000004
    const rounded = parseFloat(value.toPrecision(12));

    // Split integer and decimal parts
    const parts = rounded.toString().split('.');
    let intPart = parts[0];
    const decPart = parts[1];

    // Format integer part with commas (e.g. 1,000,000)
    intPart = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return decPart !== undefined ? `${intPart}.${decPart}` : intPart;
  }

  /**
   * Converts an integer power into unicode superscript string.
   * e.g. 12 -> ¹², -5 -> ⁻⁵
   */
  static toSuperscript(num) {
    const map = {
      '-': '⁻',
      '0': '⁰',
      '1': '¹',
      '2': '²',
      '3': '³',
      '4': '⁴',
      '5': '⁵',
      '6': '⁶',
      '7': '⁷',
      '8': '⁸',
      '9': '⁹'
    };
    return num
      .toString()
      .split('')
      .map((char) => map[char] || char)
      .join('');
  }

  /**
   * Formats a raw result into plain text suitable for copying to clipboard or history reuse.
   */
  static toPlainString(value) {
    if (value === null || value === undefined) return '0';
    if (!isFinite(value)) return String(value);
    const rounded = parseFloat(value.toPrecision(12));
    return rounded.toString();
  }

  /**
   * Produces HTML with syntax highlighting spans for the active expression.
   */
  static highlightExpression(expr) {
    if (!expr) return '<span class="expr-placeholder">0</span>';

    // Replace display operators
    let html = '';
    let i = 0;
    const len = expr.length;

    const isDigit = (c) => (c >= '0' && c <= '9') || c === '.';
    const isLetter = (c) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');

    while (i < len) {
      const c = expr[i];

      // Numbers
      if (isDigit(c)) {
        let num = '';
        while (i < len && isDigit(expr[i])) {
          num += expr[i];
          i++;
        }
        html += `<span class="token-number">${this.escapeHtml(num)}</span>`;
        continue;
      }

      // Words (functions, constants)
      if (isLetter(c) || c === 'π' || c === '√' || c === '∛') {
        let word = '';
        while (i < len && (isLetter(expr[i]) || expr[i] === '⁻' || expr[i] === '¹' || expr[i] === 'π' || expr[i] === '√' || expr[i] === '∛')) {
          word += expr[i];
          i++;
        }

        if (word === 'π' || word === 'e') {
          html += `<span class="token-constant">${this.escapeHtml(word)}</span>`;
        } else {
          html += `<span class="token-function">${this.escapeHtml(word)}</span>`;
        }
        continue;
      }

      // Parentheses
      if (c === '(' || c === ')') {
        html += `<span class="token-paren">${this.escapeHtml(c)}</span>`;
        i++;
        continue;
      }

      // Operators
      if ('+-*/×÷^%!'.includes(c)) {
        let displayOp = c;
        if (c === '*') displayOp = '×';
        if (c === '/') displayOp = '÷';
        if (c === '-') displayOp = '−';
        html += `<span class="token-operator">${this.escapeHtml(displayOp)}</span>`;
        i++;
        continue;
      }

      // Other / spaces
      html += this.escapeHtml(c);
      i++;
    }

    return html;
  }

  static escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  /**
   * Copies text to clipboard with fallback.
   */
  static async copyToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (err) {
        console.warn('Clipboard API failed, falling back to textarea', err);
      }
    }

    // Fallback using textarea element
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return successful;
    } catch (err) {
      document.body.removeChild(textArea);
      return false;
    }
  }
}
