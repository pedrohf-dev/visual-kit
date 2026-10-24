export class HistoryManager<T> {
  private past: string[] = [];
  private future: string[] = [];
  constructor(private limit = 80) {}
  push(value: T) {
    const state = JSON.stringify(value);
    if (this.past.at(-1) === state) return;
    this.past.push(state);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }
  undo(): T | null {
    if (this.past.length < 2) return null;
    this.future.push(this.past.pop()!);
    return JSON.parse(this.past.at(-1)!);
  }
  redo(): T | null {
    const state = this.future.pop();
    if (!state) return null;
    this.past.push(state);
    return JSON.parse(state);
  }
}
