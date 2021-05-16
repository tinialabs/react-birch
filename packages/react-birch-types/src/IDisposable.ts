export interface IDisposable {
  dispose(...args)
}

export interface IDisposablesComposite {
  add(disposable: IDisposable): IDisposable
  dispose(...args: any[]): void
}
