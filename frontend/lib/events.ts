type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Record<string, EventCallback[]> = {};

  on(event: string, callback: EventCallback): void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: EventCallback): void {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter((cb) => cb !== callback);
  }

  emit(event: string, ...args: any[]): void {
    if (!this.events[event]) return;
    this.events[event].forEach((callback) => callback(...args));
  }
}

// Create singleton instances for specific event types
export const threadEvents = new EventEmitter();

// Event constants
export const THREAD_CREATED = "thread:created";
export const THREAD_DELETED = "thread:deleted";
export const THREAD_UPDATED = "thread:updated";
