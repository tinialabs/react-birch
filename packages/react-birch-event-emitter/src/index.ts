type Disposer = () => void
type Listener = (...args: any[]) => any
export interface IDisposable {
  dispose(...args: any[])
}

export class Disposable implements IDisposable {
  private disposer: Disposer

  constructor(disposer: Disposer) {
    this.disposer = disposer
  }

  dispose(...args: any[]) {
    this.disposer.apply(this.disposer, args)
  }
}

export class DisposablesComposite {
  private disposables: Set<IDisposable>

  constructor() {
    this.disposables = new Set()
  }

  add(disposable: IDisposable) {
    this.disposables.add(disposable)
    return disposable
  }

  dispose(...args: any[]) {
    this.disposables.forEach((disposable) => {
      disposable.dispose.apply(disposable, args)
    })
    this.disposables = new Set()
  }
}

export class EventEmitter<T> {
  private listeners: Map<T, Set<Listener>>

  private onceListeners: Map<T, Set<Listener>>

  constructor() {
    this.listeners = new Map()
    this.onceListeners = new Map()
  }

  emit(event: T, ...args: any[]) {
    const callbacks = this.listeners.get(event)
    if (callbacks) {
      callbacks.forEach((cb) => cb(...args))
    }
    const onceCallbacks = this.onceListeners.get(event)
    if (onceCallbacks) {
      onceCallbacks.forEach((cb) => cb(...args))
      this.onceListeners.delete(event)
    }
  }

  on(event: T, cb: Listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    const existing = this.listeners.get(event)!
    existing.add(cb)
    return new Disposable(() => {
      existing.delete(cb)
    })
  }

  once(event: T, cb: Listener) {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set())
    }
    const existing = this.onceListeners.get(event)!
    existing.add(cb)
    return new Disposable(() => {
      existing.delete(cb)
    })
  }

  emitWithReturn<K>(event: T, ...args: any[]): K[] {
    const callbacks = Array.from(this.listeners.get(event) || [])
    return callbacks.map((cb) => cb(...args))
  }

  clear(event?: T) {
    if (event) {
      this.listeners.delete(event)
      this.onceListeners.delete(event)
    } else {
      this.listeners.clear()
      this.onceListeners.clear()
    }
  }
}
