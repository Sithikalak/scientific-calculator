/**
 * history.js
 * Manages calculation history, persistent storage via localStorage,
 * and callback subscriptions for UI updates.
 */

export class HistoryManager {
  constructor(storageKey = 'quantum_calc_history', maxEntries = 50) {
    this.storageKey = storageKey;
    this.maxEntries = maxEntries;
    this.subscribers = [];
    this.items = this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
    }
    return [];
  }

  save() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
    this.notify();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    callback(this.items);
    return () => {
      this.subscribers = this.subscribers.filter((cb) => cb !== callback);
    };
  }

  notify() {
    for (const callback of this.subscribers) {
      callback(this.items);
    }
  }

  addEntry({ expression, result, plainResult, angleMode }) {
    if (!expression || result === undefined) return;

    // Avoid duplicate if same as most recent
    if (this.items.length > 0) {
      const latest = this.items[0];
      if (latest.expression === expression && latest.result === result) {
        return;
      }
    }

    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      expression,
      result,
      plainResult: plainResult || result,
      angleMode: angleMode || 'DEG',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.items.unshift(entry);

    if (this.items.length > this.maxEntries) {
      this.items = this.items.slice(0, this.maxEntries);
    }

    this.save();
    return entry;
  }

  clear() {
    this.items = [];
    this.save();
  }

  removeEntry(id) {
    this.items = this.items.filter((item) => item.id !== id);
    this.save();
  }

  getItems() {
    return [...this.items];
  }
}
