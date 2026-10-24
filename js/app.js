/**
 * app.js
 * Main Controller for the Scientific Calculator Web Application.
 */

import { MathEngine } from './mathEngine.js';
import { Formatter } from './formatter.js';
import { HistoryManager } from './history.js';
import { SoundManager } from './sound.js';
import { KeyboardHandler } from './keyboard.js';

class CalculatorApp {
  constructor() {
    // Persistent angle mode & memory
    const savedMode = localStorage.getItem('quantum_calc_angle_mode') || 'DEG';
    const savedMemory = parseFloat(localStorage.getItem('quantum_calc_memory') || '0');

    this.engine = new MathEngine({ angleMode: savedMode });
    this.historyManager = new HistoryManager();
    this.soundManager = new SoundManager();

    // Application state
    this.expression = '';
    this.result = 0;
    this.hasCalculated = false;
    this.angleMode = savedMode;
    this.isSecondActive = false;
    this.memoryValue = isNaN(savedMemory) ? 0 : savedMemory;
    this.errorMessage = null;
    this.livePreview = '';

    // Cache DOM Elements
    this.dom = {
      expressionDisplay: document.getElementById('display-expression'),
      resultDisplay: document.getElementById('display-result'),
      previewDisplay: document.getElementById('display-preview'),
      errorBadge: document.getElementById('display-error'),
      degRadBtn: document.getElementById('btn-mode-deg-rad'),
      secondBtn: document.getElementById('btn-2nd'),
      memoryIndicator: document.getElementById('indicator-memory'),
      angleIndicator: document.getElementById('indicator-angle'),
      historyPanel: document.getElementById('history-panel'),
      historyList: document.getElementById('history-list'),
      historyEmpty: document.getElementById('history-empty'),
      historyCountBadge: document.getElementById('history-count-badge'),
      shortcutsModal: document.getElementById('shortcuts-modal'),
      toastContainer: document.getElementById('toast-container'),
      soundToggleBtn: document.getElementById('btn-toggle-sound'),
      copyBtn: document.getElementById('btn-copy-result'),
      historyBackdrop: document.getElementById('history-backdrop')
    };

    this.init();
  }

  init() {
    // Setup keyboard handler
    this.keyboardHandler = new KeyboardHandler(this);

    // Setup history subscription
    this.historyManager.subscribe((items) => this.renderHistory(items));

    // Bind event listeners
    this.bindEvents();

    // Initialize display & UI elements
    this.updateDisplay();
    this.updateAngleModeUI();
    this.updateMemoryUI();
    this.updateSoundButtonUI();
  }

  bindEvents() {
    // Keypad button click delegation
    const keypad = document.getElementById('calculator-keypad');
    if (keypad) {
      keypad.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const action = btn.dataset.action;
        const value = btn.dataset.value;

        // Button press ripple animation
        this.triggerButtonRipple(btn);

        this.handleButtonAction(action, value, btn);
      });
    }

    // Top Bar buttons
    if (this.dom.degRadBtn) {
      this.dom.degRadBtn.addEventListener('click', () => {
        this.triggerButtonRipple(this.dom.degRadBtn);
        this.toggleAngleMode();
      });
    }

    if (this.dom.secondBtn) {
      this.dom.secondBtn.addEventListener('click', () => {
        this.triggerButtonRipple(this.dom.secondBtn);
        this.toggleSecondFunction();
      });
    }

    // Memory buttons
    document.querySelectorAll('[data-mem]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.triggerButtonRipple(btn);
        const memAction = btn.dataset.mem;
        this.handleMemoryAction(memAction);
      });
    });

    // History Panel toggle buttons
    const historyToggleBtn = document.getElementById('btn-toggle-history');
    if (historyToggleBtn) {
      historyToggleBtn.addEventListener('click', () => this.toggleHistoryPanel());
    }

    const historyCloseBtn = document.getElementById('btn-close-history');
    if (historyCloseBtn) {
      historyCloseBtn.addEventListener('click', () => this.toggleHistoryPanel(false));
    }

    if (this.dom.historyBackdrop) {
      this.dom.historyBackdrop.addEventListener('click', () => this.toggleHistoryPanel(false));
    }

    const clearHistoryBtn = document.getElementById('btn-clear-history');
    if (clearHistoryBtn) {
      clearHistoryBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all calculation history?')) {
          this.historyManager.clear();
          this.showToast('Calculation history cleared');
        }
      });
    }

    // Sound toggle button
    if (this.dom.soundToggleBtn) {
      this.dom.soundToggleBtn.addEventListener('click', () => {
        const isEnabled = this.soundManager.toggle();
        this.updateSoundButtonUI();
        this.showToast(isEnabled ? 'Sound effects enabled' : 'Sound effects muted');
      });
    }

    // Copy result button
    if (this.dom.copyBtn) {
      this.dom.copyBtn.addEventListener('click', () => this.copyResult());
    }

    // Shortcuts modal toggle buttons
    const shortcutsBtn = document.getElementById('btn-open-shortcuts');
    if (shortcutsBtn) {
      shortcutsBtn.addEventListener('click', () => this.toggleShortcutsModal(true));
    }

    const closeShortcutsBtn = document.getElementById('btn-close-shortcuts');
    if (closeShortcutsBtn) {
      closeShortcutsBtn.addEventListener('click', () => this.toggleShortcutsModal(false));
    }

    // Backdrop click closes modal
    if (this.dom.shortcutsModal) {
      this.dom.shortcutsModal.addEventListener('click', (e) => {
        if (e.target === this.dom.shortcutsModal) {
          this.toggleShortcutsModal(false);
        }
      });
    }

    // Prevent double tap zooming on iOS / mobile
    document.addEventListener('gesturestart', (e) => e.preventDefault());
  }

  handleButtonAction(action, value, btn) {
    switch (action) {
      case 'num':
        this.appendCharacter(value);
        this.soundManager.playClick();
        break;

      case 'operator':
        this.appendOperator(value);
        this.soundManager.playOperator();
        break;

      case 'func':
        this.appendFunction(value);
        this.soundManager.playFunction();
        break;

      case 'constant':
        this.appendCharacter(value);
        this.soundManager.playClick();
        break;

      case 'calculate':
        this.calculate();
        break;

      case 'clear':
        this.clearAll();
        this.soundManager.playClear();
        break;

      case 'delete':
        this.deleteLast();
        this.soundManager.playClick();
        break;

      case 'sign':
        this.toggleSign();
        this.soundManager.playOperator();
        break;

      case 'sqr':
        this.appendOperator('^2');
        this.soundManager.playOperator();
        break;

      case 'cube':
        this.appendOperator('^3');
        this.soundManager.playOperator();
        break;

      case 'recip':
        this.applyReciprocal();
        this.soundManager.playOperator();
        break;

      case 'exp-notation':
        this.appendCharacter('*10^(');
        this.soundManager.playOperator();
        break;

      default:
        break;
    }
  }

  handleMemoryAction(memAction) {
    this.soundManager.playClick();
    switch (memAction) {
      case 'mc':
        this.memoryValue = 0;
        localStorage.setItem('quantum_calc_memory', '0');
        this.updateMemoryUI();
        this.showToast('Memory Cleared (MC)');
        break;

      case 'mr':
        if (this.hasCalculated) {
          this.expression = '';
          this.hasCalculated = false;
        }
        this.appendCharacter(this.memoryValue.toString());
        this.showToast(`Memory Recalled: ${this.memoryValue}`);
        break;

      case 'm+': {
        const val = this.getCurrentNumericValue();
        this.memoryValue += val;
        localStorage.setItem('quantum_calc_memory', this.memoryValue.toString());
        this.updateMemoryUI();
        this.showToast(`Added to Memory (M+): ${val}`);
        break;
      }

      case 'm-': {
        const val = this.getCurrentNumericValue();
        this.memoryValue -= val;
        localStorage.setItem('quantum_calc_memory', this.memoryValue.toString());
        this.updateMemoryUI();
        this.showToast(`Subtracted from Memory (M-): ${val}`);
        break;
      }

      case 'ms': {
        const val = this.getCurrentNumericValue();
        this.memoryValue = val;
        localStorage.setItem('quantum_calc_memory', this.memoryValue.toString());
        this.updateMemoryUI();
        this.showToast(`Stored in Memory (MS): ${val}`);
        break;
      }
    }
  }

  getCurrentNumericValue() {
    if (this.errorMessage) return 0;
    if (this.result !== null && !isNaN(this.result)) return this.result;
    try {
      if (this.expression) {
        return this.engine.evaluate(this.expression);
      }
    } catch (e) {}
    return 0;
  }

  appendCharacter(char) {
    if (this.hasCalculated) {
      // If user typed a digit or constant immediately after evaluation, start new calculation
      if (!'+-*/×÷^%!'.includes(char)) {
        this.expression = '';
      }
      this.hasCalculated = false;
    }

    this.errorMessage = null;

    // Prevent multiple consecutive decimals in the current number segment
    if (char === '.') {
      const segments = this.expression.split(/[-+*\/×÷^%!()]/);
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment.includes('.')) {
        return;
      }
      if (this.expression === '' || /[-+*\/×÷^(]$/.test(this.expression)) {
        this.expression += '0.';
        this.updateDisplay();
        this.evaluateLivePreview();
        return;
      }
    }

    this.expression += char;
    this.updateDisplay();
    this.evaluateLivePreview();
  }

  appendOperator(op) {
    if (this.hasCalculated) {
      // Continue chaining operations using the previous result
      if (this.errorMessage) {
        this.expression = '0' + op;
      } else {
        this.expression = Formatter.toPlainString(this.result) + op;
      }
      this.hasCalculated = false;
      this.errorMessage = null;
      this.updateDisplay();
      this.evaluateLivePreview();
      return;
    }

    this.errorMessage = null;

    // If expression is empty and operator is minus, allow unary minus
    if (this.expression === '') {
      if (op === '−' || op === '-') {
        this.expression = '-';
        this.updateDisplay();
      }
      return;
    }

    // Replace last operator if user presses a different binary operator
    const lastChar = this.expression.slice(-1);
    const binaryOps = ['+', '-', '−', '*', '×', '/', '÷', '^'];

    if (binaryOps.includes(lastChar) && binaryOps.includes(op)) {
      this.expression = this.expression.slice(0, -1) + op;
      this.updateDisplay();
      return;
    }

    this.expression += op;
    this.updateDisplay();
    this.evaluateLivePreview();
  }

  appendFunction(fn) {
    if (this.hasCalculated) {
      this.expression = '';
      this.hasCalculated = false;
    }
    this.errorMessage = null;
    this.expression += fn;
    this.updateDisplay();
    this.evaluateLivePreview();
  }

  deleteLast() {
    this.errorMessage = null;
    if (this.hasCalculated) {
      this.clearAll();
      return;
    }

    if (!this.expression) return;

    // Detect and delete multi-character function tokens cleanly
    const multiCharTokens = [
      'sin⁻¹(', 'cos⁻¹(', 'tan⁻¹(',
      'asin(', 'acos(', 'atan(',
      'sin(', 'cos(', 'tan(',
      'log(', 'ln(', 'sqrt(', 'cbrt(', 'abs(', 'exp(',
      '*10^('
    ];

    for (const token of multiCharTokens) {
      if (this.expression.endsWith(token)) {
        this.expression = this.expression.slice(0, -token.length);
        this.updateDisplay();
        this.evaluateLivePreview();
        return;
      }
    }

    this.expression = this.expression.slice(0, -1);
    this.updateDisplay();
    this.evaluateLivePreview();
  }

  clearAll() {
    this.expression = '';
    this.result = 0;
    this.hasCalculated = false;
    this.errorMessage = null;
    this.livePreview = '';
    this.updateDisplay();
  }

  toggleSign() {
    if (this.hasCalculated) {
      if (this.result !== null && !isNaN(this.result)) {
        this.result = -this.result;
        this.expression = Formatter.toPlainString(this.result);
        this.updateDisplay();
        return;
      }
    }

    if (!this.expression) {
      this.expression = '-';
      this.updateDisplay();
      return;
    }

    // Toggle negation on current expression
    if (this.expression.startsWith('-(') && this.expression.endsWith(')')) {
      this.expression = this.expression.slice(2, -1);
    } else if (this.expression.startsWith('-')) {
      this.expression = this.expression.slice(1);
    } else {
      this.expression = `-(${this.expression})`;
    }

    this.updateDisplay();
    this.evaluateLivePreview();
  }

  applyReciprocal() {
    if (this.hasCalculated && this.result !== null && !isNaN(this.result)) {
      this.expression = `1/(${Formatter.toPlainString(this.result)})`;
      this.hasCalculated = false;
    } else if (this.expression) {
      this.expression = `1/(${this.expression})`;
    } else {
      this.expression = '1/(';
    }
    this.updateDisplay();
    this.evaluateLivePreview();
  }

  toggleAngleMode() {
    this.angleMode = this.angleMode === 'DEG' ? 'RAD' : 'DEG';
    this.engine.setAngleMode(this.angleMode);
    localStorage.setItem('quantum_calc_angle_mode', this.angleMode);

    this.updateAngleModeUI();
    this.soundManager.playOperator();
    this.showToast(`Switched to ${this.angleMode === 'DEG' ? 'Degrees (DEG)' : 'Radians (RAD)'}`);

    // Re-evaluate live preview or recalculate if hasCalculated
    if (this.hasCalculated && this.expression) {
      this.calculate();
    } else {
      this.evaluateLivePreview();
    }
  }

  toggleSecondFunction() {
    this.isSecondActive = !this.isSecondActive;
    if (this.dom.secondBtn) {
      this.dom.secondBtn.classList.toggle('active', this.isSecondActive);
    }

    // Update 2nd function key labels and actions
    const keyMap = [
      { id: 'btn-sin', primary: 'sin', second: 'sin⁻¹', action: 'func', val1: 'sin(', val2: 'sin⁻¹(' },
      { id: 'btn-cos', primary: 'cos', second: 'cos⁻¹', action: 'func', val1: 'cos(', val2: 'cos⁻¹(' },
      { id: 'btn-tan', primary: 'tan', second: 'tan⁻¹', action: 'func', val1: 'tan(', val2: 'tan⁻¹(' },
      { id: 'btn-sqr', primary: 'x²', second: 'x³', action: this.isSecondActive ? 'cube' : 'sqr', val1: '^2', val2: '^3' },
      { id: 'btn-sqrt', primary: '√', second: '∛', action: 'func', val1: 'sqrt(', val2: 'cbrt(' },
      { id: 'btn-log', primary: 'log', second: '10ˣ', action: 'func', val1: 'log(', val2: '10^(' },
      { id: 'btn-ln', primary: 'ln', second: 'eˣ', action: 'func', val1: 'ln(', val2: 'e^(' }
    ];

    for (const item of keyMap) {
      const el = document.getElementById(item.id);
      if (el) {
        el.innerHTML = this.isSecondActive ? item.second : item.primary;
        el.dataset.value = this.isSecondActive ? item.val2 : item.val1;
        if (item.action) el.dataset.action = item.action;
      }
    }

    this.soundManager.playClick();
  }

  calculate() {
    if (!this.expression) return;

    try {
      // Auto-close open parentheses before evaluation if needed
      let openCount = 0;
      for (const char of this.expression) {
        if (char === '(') openCount++;
        if (char === ')') openCount--;
      }
      let balancedExpr = this.expression;
      while (openCount > 0) {
        balancedExpr += ')';
        openCount--;
      }

      const calculated = this.engine.evaluate(balancedExpr);
      this.result = calculated;
      this.errorMessage = null;
      this.hasCalculated = true;
      this.livePreview = '';

      // Play success chime
      this.soundManager.playEquals();

      // Add to history
      const formattedResult = Formatter.formatResult(calculated);
      const plainResult = Formatter.toPlainString(calculated);

      this.historyManager.addEntry({
        expression: this.expression,
        result: formattedResult,
        plainResult: plainResult,
        angleMode: this.angleMode
      });

      this.updateDisplay();

      // Pulse display animation
      if (this.dom.resultDisplay) {
        this.dom.resultDisplay.classList.remove('pulse-result');
        void this.dom.resultDisplay.offsetWidth; // trigger reflow
        this.dom.resultDisplay.classList.add('pulse-result');
      }
    } catch (err) {
      this.errorMessage = err.message || 'Error';
      this.soundManager.playError();
      this.updateDisplay();
    }
  }

  evaluateLivePreview() {
    if (!this.expression || this.hasCalculated) {
      this.livePreview = '';
      this.updateDisplay();
      return;
    }

    try {
      // Try evaluating balanced clone
      let openCount = 0;
      for (const char of this.expression) {
        if (char === '(') openCount++;
        if (char === ')') openCount--;
      }
      let clone = this.expression;
      while (openCount > 0) {
        clone += ')';
        openCount--;
      }

      const previewVal = this.engine.evaluate(clone);
      if (isFinite(previewVal)) {
        this.livePreview = `= ${Formatter.formatResult(previewVal)}`;
      } else {
        this.livePreview = '';
      }
    } catch (e) {
      this.livePreview = '';
    }

    this.updateDisplay();
  }

  updateDisplay() {
    // Expression line
    if (this.dom.expressionDisplay) {
      this.dom.expressionDisplay.innerHTML = Formatter.highlightExpression(this.expression);
      // Auto-scroll expression to right
      this.dom.expressionDisplay.scrollLeft = this.dom.expressionDisplay.scrollWidth;
    }

    // Result line / Error line
    if (this.errorMessage) {
      if (this.dom.errorBadge) {
        this.dom.errorBadge.textContent = this.errorMessage;
        this.dom.errorBadge.style.display = 'block';
      }
      if (this.dom.resultDisplay) {
        this.dom.resultDisplay.textContent = 'Error';
        this.dom.resultDisplay.classList.add('error-state');
      }
      if (this.dom.previewDisplay) {
        this.dom.previewDisplay.textContent = '';
      }
    } else {
      if (this.dom.errorBadge) {
        this.dom.errorBadge.style.display = 'none';
      }
      if (this.dom.resultDisplay) {
        this.dom.resultDisplay.classList.remove('error-state');
        const textVal = this.hasCalculated
          ? Formatter.formatResult(this.result)
          : (this.expression ? '' : '0');
        this.dom.resultDisplay.textContent = textVal;

        // Dynamic result font auto-scaling to prevent overflow on small screens
        const len = textVal.length;
        if (len > 18) {
          this.dom.resultDisplay.style.fontSize = 'clamp(1.05rem, 3.4vw, 1.35rem)';
        } else if (len > 14) {
          this.dom.resultDisplay.style.fontSize = 'clamp(1.25rem, 4vw, 1.65rem)';
        } else if (len > 10) {
          this.dom.resultDisplay.style.fontSize = 'clamp(1.45rem, 4.6vw, 1.95rem)';
        } else {
          this.dom.resultDisplay.style.fontSize = '';
        }
      }
      if (this.dom.previewDisplay) {
        this.dom.previewDisplay.textContent = this.livePreview;
      }
    }
  }

  updateAngleModeUI() {
    if (this.dom.degRadBtn) {
      this.dom.degRadBtn.textContent = this.angleMode;
      this.dom.degRadBtn.setAttribute('title', `Active mode: ${this.angleMode}. Click to toggle.`);
    }
    if (this.dom.angleIndicator) {
      this.dom.angleIndicator.textContent = this.angleMode;
    }
  }

  updateMemoryUI() {
    const hasMemory = Math.abs(this.memoryValue) > 1e-15;
    if (this.dom.memoryIndicator) {
      this.dom.memoryIndicator.style.display = hasMemory ? 'inline-flex' : 'none';
    }
    const mrBtn = document.getElementById('btn-mem-mr');
    const mcBtn = document.getElementById('btn-mem-mc');
    if (mrBtn) mrBtn.disabled = !hasMemory;
    if (mcBtn) mcBtn.disabled = !hasMemory;
  }

  updateSoundButtonUI() {
    if (this.dom.soundToggleBtn) {
      const enabled = this.soundManager.isEnabled();
      this.dom.soundToggleBtn.innerHTML = enabled
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>`;
      this.dom.soundToggleBtn.setAttribute('title', enabled ? 'Mute sound (Audio on)' : 'Enable sound (Audio muted)');
    }
  }

  renderHistory(items) {
    if (!this.dom.historyList) return;

    if (this.dom.historyCountBadge) {
      this.dom.historyCountBadge.textContent = items.length;
      this.dom.historyCountBadge.style.display = items.length > 0 ? 'inline-flex' : 'none';
    }

    if (!items || items.length === 0) {
      this.dom.historyList.innerHTML = `
        <div class="history-empty" id="history-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
          <p>No calculation history yet</p>
          <span>Calculations you perform will appear here</span>
        </div>
      `;
      return;
    }

    this.dom.historyList.innerHTML = items
      .map(
        (item) => `
        <div class="history-item" data-id="${item.id}">
          <div class="history-item-header">
            <span class="history-mode-tag">${item.angleMode || 'DEG'}</span>
            <span class="history-time">${item.timestamp}</span>
            <button class="history-item-del" data-action="del-item" data-id="${item.id}" title="Remove entry">✕</button>
          </div>
          <div class="history-item-expr" data-action="reuse-expr" data-expr="${Formatter.escapeHtml(item.expression)}" title="Click to reuse expression">
            ${Formatter.escapeHtml(item.expression)}
          </div>
          <div class="history-item-res" data-action="reuse-res" data-res="${Formatter.escapeHtml(item.plainResult)}" title="Click to use result">
            = ${Formatter.escapeHtml(item.result)}
          </div>
        </div>
      `
      )
      .join('');

    // Attach click events for history items
    this.dom.historyList.querySelectorAll('.history-item').forEach((el) => {
      el.addEventListener('click', (e) => {
        const delBtn = e.target.closest('[data-action="del-item"]');
        if (delBtn) {
          e.stopPropagation();
          this.historyManager.removeEntry(delBtn.dataset.id);
          return;
        }

        const exprEl = e.target.closest('[data-action="reuse-expr"]');
        if (exprEl) {
          this.expression = exprEl.dataset.expr;
          this.hasCalculated = false;
          this.errorMessage = null;
          this.updateDisplay();
          this.evaluateLivePreview();
          this.showToast('Loaded expression from history');
          if (window.innerWidth < 800) this.toggleHistoryPanel(false);
          return;
        }

        const resEl = e.target.closest('[data-action="reuse-res"]');
        if (resEl) {
          if (this.hasCalculated) {
            this.expression = '';
            this.hasCalculated = false;
          }
          this.appendCharacter(resEl.dataset.res);
          this.showToast('Inserted result from history');
          if (window.innerWidth < 800) this.toggleHistoryPanel(false);
          return;
        }

        // Clicking whole item loads result
        const defaultRes = el.querySelector('[data-action="reuse-res"]');
        if (defaultRes) {
          this.appendCharacter(defaultRes.dataset.res);
          this.showToast('Inserted result from history');
          if (window.innerWidth < 800) this.toggleHistoryPanel(false);
        }
      });
    });
  }

  toggleHistoryPanel(forceState) {
    if (!this.dom.historyPanel) return;
    const isOpen = forceState !== undefined ? forceState : !this.dom.historyPanel.classList.contains('open');
    this.dom.historyPanel.classList.toggle('open', isOpen);
    if (this.dom.historyBackdrop) {
      this.dom.historyBackdrop.classList.toggle('open', isOpen);
    }
    const toggleBtn = document.getElementById('btn-toggle-history');
    if (toggleBtn) toggleBtn.classList.toggle('active', isOpen);
  }

  toggleShortcutsModal(forceState) {
    if (!this.dom.shortcutsModal) return;
    const isOpen = forceState !== undefined ? forceState : !this.dom.shortcutsModal.classList.contains('open');
    this.dom.shortcutsModal.classList.toggle('open', isOpen);
  }

  isModalOpen() {
    return this.dom.shortcutsModal && this.dom.shortcutsModal.classList.contains('open');
  }

  closeModal() {
    this.toggleShortcutsModal(false);
  }

  async copyResult() {
    let textToCopy = '0';
    if (this.hasCalculated && !this.errorMessage) {
      textToCopy = Formatter.toPlainString(this.result);
    } else if (this.expression) {
      textToCopy = this.expression;
    }

    const success = await Formatter.copyToClipboard(textToCopy);
    if (success) {
      this.showToast(`Copied "${textToCopy}" to clipboard!`);
      if (this.dom.copyBtn) {
        this.dom.copyBtn.classList.add('copy-success');
        setTimeout(() => this.dom.copyBtn.classList.remove('copy-success'), 1200);
      }
    } else {
      this.showToast('Unable to copy to clipboard');
    }
  }

  triggerButtonRipple(btn) {
    if (!btn) return;
    btn.classList.remove('btn-pressed');
    void btn.offsetWidth; // trigger reflow
    btn.classList.add('btn-pressed');
    setTimeout(() => btn.classList.remove('btn-pressed'), 200);
  }

  animateButton(buttonId) {
    const btn = document.getElementById(buttonId);
    if (btn) {
      this.triggerButtonRipple(btn);
    }
  }

  showToast(message) {
    if (!this.dom.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.textContent = message;
    this.dom.toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2200);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.quantumCalc = new CalculatorApp();
});
