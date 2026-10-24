/**
 * keyboard.js
 * Comprehensive keyboard shortcuts and physical key routing.
 */

export class KeyboardHandler {
  constructor(app) {
    this.app = app;
    this.init();
  }

  init() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleKeyDown(e) {
    // If user is inside an input or textarea (like searching or editing), don't intercept standard typing
    const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
    if (activeTag === 'input' || activeTag === 'textarea') {
      if (e.key === 'Escape') {
        document.activeElement.blur();
      }
      return;
    }

    // Modal close with Escape
    if (e.key === 'Escape') {
      if (this.app.isModalOpen()) {
        this.app.closeModal();
        e.preventDefault();
        return;
      }
      this.app.clearAll();
      e.preventDefault();
      return;
    }

    // Help modal toggle with '?'
    if (e.key === '?') {
      this.app.toggleShortcutsModal();
      e.preventDefault();
      return;
    }

    // Toggle history with 'h' or 'H'
    if ((e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey) {
      this.app.toggleHistoryPanel();
      e.preventDefault();
      return;
    }

    // Copy result with Ctrl+C or Cmd+C if nothing is text-selected
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
      const selection = window.getSelection().toString();
      if (!selection) {
        this.app.copyResult();
        e.preventDefault();
        return;
      }
    }

    // Digits
    if (e.key >= '0' && e.key <= '9') {
      this.app.appendCharacter(e.key);
      this.app.animateButton(`btn-num-${e.key}`);
      e.preventDefault();
      return;
    }

    // Decimal point
    if (e.key === '.') {
      this.app.appendCharacter('.');
      this.app.animateButton('btn-dot');
      e.preventDefault();
      return;
    }

    // Basic Operators
    if (e.key === '+') {
      this.app.appendOperator('+');
      this.app.animateButton('btn-add');
      e.preventDefault();
      return;
    }
    if (e.key === '-') {
      this.app.appendOperator('−');
      this.app.animateButton('btn-subtract');
      e.preventDefault();
      return;
    }
    if (e.key === '*' || e.key === 'x' || e.key === 'X') {
      this.app.appendOperator('×');
      this.app.animateButton('btn-multiply');
      e.preventDefault();
      return;
    }
    if (e.key === '/') {
      this.app.appendOperator('÷');
      this.app.animateButton('btn-divide');
      e.preventDefault();
      return;
    }
    if (e.key === '^') {
      this.app.appendOperator('^');
      this.app.animateButton('btn-pow');
      e.preventDefault();
      return;
    }
    if (e.key === '%') {
      this.app.appendOperator('%');
      this.app.animateButton('btn-percent');
      e.preventDefault();
      return;
    }
    if (e.key === '!') {
      this.app.appendOperator('!');
      this.app.animateButton('btn-fact');
      e.preventDefault();
      return;
    }

    // Parentheses
    if (e.key === '(') {
      this.app.appendCharacter('(');
      this.app.animateButton('btn-lparen');
      e.preventDefault();
      return;
    }
    if (e.key === ')') {
      this.app.appendCharacter(')');
      this.app.animateButton('btn-rparen');
      e.preventDefault();
      return;
    }

    // Equals / Enter
    if (e.key === 'Enter' || e.key === '=') {
      this.app.calculate();
      this.app.animateButton('btn-equals');
      e.preventDefault();
      return;
    }

    // Backspace / DEL
    if (e.key === 'Backspace') {
      this.app.deleteLast();
      this.app.animateButton('btn-del');
      e.preventDefault();
      return;
    }

    // Delete / Clear All
    if (e.key === 'Delete') {
      this.app.clearAll();
      this.app.animateButton('btn-ac');
      e.preventDefault();
      return;
    }

    // Constants
    if (e.key === 'p' || e.key === 'P') {
      this.app.appendCharacter('π');
      this.app.animateButton('btn-pi');
      e.preventDefault();
      return;
    }
    if (e.key === 'e' && !e.ctrlKey && !e.metaKey) {
      this.app.appendCharacter('e');
      this.app.animateButton('btn-e');
      e.preventDefault();
      return;
    }

    // Angle mode toggle (DEG / RAD) with 'd' or 'D'
    if (e.key === 'd' || e.key === 'D') {
      this.app.toggleAngleMode();
      this.app.animateButton('btn-mode-deg-rad');
      e.preventDefault();
      return;
    }

    // 2nd function toggle with Tab or ` (Backtick)
    if (e.key === 'Tab' || e.key === '`') {
      this.app.toggleSecondFunction();
      this.app.animateButton('btn-2nd');
      e.preventDefault();
      return;
    }

    // Scientific Functions Shortcuts
    if (e.key === 's') {
      this.app.appendFunction(this.app.isSecondActive ? 'asin(' : 'sin(');
      this.app.animateButton(this.app.isSecondActive ? 'btn-asin' : 'btn-sin');
      e.preventDefault();
      return;
    }
    if (e.key === 'S') {
      this.app.appendFunction('asin(');
      this.app.animateButton('btn-asin');
      e.preventDefault();
      return;
    }

    if (e.key === 'c') {
      this.app.appendFunction(this.app.isSecondActive ? 'acos(' : 'cos(');
      this.app.animateButton(this.app.isSecondActive ? 'btn-acos' : 'btn-cos');
      e.preventDefault();
      return;
    }
    if (e.key === 'C') {
      this.app.appendFunction('acos(');
      this.app.animateButton('btn-acos');
      e.preventDefault();
      return;
    }

    if (e.key === 't') {
      this.app.appendFunction(this.app.isSecondActive ? 'atan(' : 'tan(');
      this.app.animateButton(this.app.isSecondActive ? 'btn-atan' : 'btn-tan');
      e.preventDefault();
      return;
    }
    if (e.key === 'T') {
      this.app.appendFunction('atan(');
      this.app.animateButton('btn-atan');
      e.preventDefault();
      return;
    }

    if (e.key === 'l') {
      this.app.appendFunction('log(');
      this.app.animateButton('btn-log');
      e.preventDefault();
      return;
    }
    if (e.key === 'n') {
      this.app.appendFunction('ln(');
      this.app.animateButton('btn-ln');
      e.preventDefault();
      return;
    }
    if (e.key === 'r') {
      this.app.appendFunction('sqrt(');
      this.app.animateButton('btn-sqrt');
      e.preventDefault();
      return;
    }
  }
}
