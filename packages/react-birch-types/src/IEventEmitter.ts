import { IDisposable } from './IDisposable'

type Listener = (...args: any[]) => any

export interface IEventEmitter<T> {
  emit(event: T, ...args: any[]): void
  on(event: T, cb: Listener): IDisposable
  once(event: T, cb: Listener): IDisposable
  emitWithReturn<K>(event: T, ...args: any[]): K[]
  clear(event?: T): void
}
