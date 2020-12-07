import { IDisposable, EventEmitter } from 'birch-event-emitter'
import { EnumTreeItemType, IBirchFolder, IBirchItem } from 'react-birch-types'

export enum EnumDecorationTargetMatchMode {
  None = 1,
  Self,
  Children,
  SelfAndChildren
}

enum DecorationEvent {
  DidUpdateResolvedDecorations = 1,
  AddCSSClassname,
  RemoveCSSClassname,
  ChangeCSSClasslist,
  AddTarget,
  RemoveTarget,
  NegateTarget,
  UnNegateTarget,
  DecorationEnabled,
  DecorationDisabled
}

export class Decoration {
  /**
   * Do not mutate directly, use `Decoration#addCSSClass()` / `Decoration#removeCSSClass` instead
   */
  public readonly cssClasslist: Set<string>

  private _appliedTargetsDisposables: WeakMap<
    IBirchItem | IBirchFolder,
    IDisposable
  > = new WeakMap()
  private _negatedTargetsDisposables: WeakMap<
    IBirchItem | IBirchFolder,
    IDisposable
  > = new WeakMap()

  private _appliedTargets: Map<
    IBirchItem | IBirchFolder,
    EnumDecorationTargetMatchMode
  > = new Map()
  private _negatedTargets: Map<
    IBirchItem | IBirchFolder,
    EnumDecorationTargetMatchMode
  > = new Map()
  private _disabled: boolean = false

  private events: EventEmitter<DecorationEvent> = new EventEmitter<DecorationEvent>()

  constructor()
  constructor(...cssClasslist: string[])
  constructor(...cssClasslist: string[]) {
    if (Array.isArray(cssClasslist)) {
      if (cssClasslist.every((classname) => typeof classname === 'string')) {
        this.cssClasslist = new Set(cssClasslist)
      } else {
        throw new TypeError('classlist must be of type `Array<string>`')
      }
    } else {
      this.cssClasslist = new Set()
    }
  }

  get disabled() {
    return this._disabled
  }

  set disabled(disabled: boolean) {
    this._disabled = disabled
    this.events.emit(
      disabled
        ? DecorationEvent.DecorationDisabled
        : DecorationEvent.DecorationEnabled,
      this
    )
  }

  get appliedTargets() {
    return this._appliedTargets
  }

  get negatedTargets() {
    return this._negatedTargets
  }

  public addCSSClass(classname: string): void {
    if (this.cssClasslist.has(classname)) {
      return
    }
    this.cssClasslist.add(classname)
    this.events.emit(DecorationEvent.AddCSSClassname, this, classname)
  }

  public removeCSSClass(classname: string): void {
    if (!this.cssClasslist.has(classname)) {
      return
    }
    this.cssClasslist.delete(classname)
    this.events.emit(DecorationEvent.RemoveCSSClassname, this, classname)
  }

  public addTarget(
    folder: IBirchFolder,
    flags: EnumDecorationTargetMatchMode
  ): void
  public addTarget(item: IBirchItem): void
  public addTarget(
    target: IBirchItem | IBirchFolder,
    flags: EnumDecorationTargetMatchMode = EnumDecorationTargetMatchMode.Self
  ): void {
    const existingFlags = this._appliedTargets.get(target)
    if (existingFlags === flags) {
      return
    }
    if (!(target.type === EnumTreeItemType.Item)) {
      return
    }
    this._appliedTargets.set(target, flags)
    this.events.emit(DecorationEvent.AddTarget, this, target, flags)
    this._appliedTargetsDisposables.set(
      target,
      target.root.onOnceDisposed(target, () => this.removeTarget(target))
    )
  }

  public removeTarget(folder: IBirchFolder): void
  public removeTarget(item: IBirchItem): void
  public removeTarget(target: IBirchItem | IBirchFolder): void {
    if (this._appliedTargets.delete(target)) {
      const disposable = this._appliedTargetsDisposables.get(target)
      if (disposable) {
        disposable.dispose()
      }
      this.events.emit(DecorationEvent.RemoveTarget, this, target)
    }
  }

  public negateTarget(
    folder: IBirchFolder,
    flags: EnumDecorationTargetMatchMode
  ): void
  public negateTarget(item: IBirchItem): void
  public negateTarget(
    target: IBirchItem | IBirchFolder,
    flags: EnumDecorationTargetMatchMode = EnumDecorationTargetMatchMode.Self
  ): void {
    const existingFlags = this._negatedTargets.get(target)
    if (existingFlags === flags) {
      return
    }
    if (!(target.type === EnumTreeItemType.Item)) {
      return
    }
    this._negatedTargets.set(target, flags)
    this.events.emit(DecorationEvent.NegateTarget, this, target, flags)
    this._negatedTargetsDisposables.set(
      target,
      target.root.onOnceDisposed(target, () => this.unNegateTarget(target))
    )
  }

  public unNegateTarget(folder: IBirchFolder): void
  public unNegateTarget(item: IBirchItem): void
  public unNegateTarget(target: IBirchItem | IBirchFolder): void {
    if (this._negatedTargets.delete(target)) {
      const disposable = this._negatedTargetsDisposables.get(target)
      if (disposable) {
        disposable.dispose()
      }
      this.events.emit(DecorationEvent.UnNegateTarget, this, target)
    }
  }

  public onDidAddTarget(
    callback: (
      decoration: Decoration,
      target: IBirchItem | IBirchFolder,
      flags: EnumDecorationTargetMatchMode
    ) => void
  ): IDisposable {
    return this.events.on(DecorationEvent.AddTarget, callback)
  }

  public onDidRemoveTarget(
    callback: (
      decoration: Decoration,
      target: IBirchItem | IBirchFolder
    ) => void
  ): IDisposable {
    return this.events.on(DecorationEvent.RemoveTarget, callback)
  }

  public onDidNegateTarget(
    callback: (
      decoration: Decoration,
      target: IBirchItem | IBirchFolder,
      flags: EnumDecorationTargetMatchMode
    ) => void
  ): IDisposable {
    return this.events.on(DecorationEvent.NegateTarget, callback)
  }

  public onDidUnNegateTarget(
    callback: (
      decoration: Decoration,
      target: IBirchItem | IBirchFolder
    ) => void
  ): IDisposable {
    return this.events.on(DecorationEvent.UnNegateTarget, callback)
  }

  public onDidRemoveCSSClassname(
    callback: (decoration: Decoration, classname: string) => void
  ): IDisposable {
    return this.events.on(DecorationEvent.RemoveCSSClassname, callback)
  }

  public onDidAddCSSClassname(
    callback: (decoration: Decoration, classname: string) => void
  ): IDisposable {
    return this.events.on(DecorationEvent.AddCSSClassname, callback)
  }

  public onDidEnableDecoration(
    callback: (decoration: Decoration) => void
  ): IDisposable {
    return this.events.on(DecorationEvent.DecorationEnabled, callback)
  }

  public onDidDisableDecoration(
    callback: (decoration: Decoration) => void
  ): IDisposable {
    return this.events.on(DecorationEvent.DecorationDisabled, callback)
  }
}
