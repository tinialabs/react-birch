import { IDisposable, EventEmitter } from 'react-birch-event-emitter'
import {
  EnumBirchDecorationEvent,
  EnumBirchDecorationsTargetMatchMode,
  EnumTreeItemType
} from 'react-birch-types'
import type { IBirchFolder, IBirchItem } from 'react-birch-types'

export class BirchDecoration {
  /**
   * Do not mutate directly, use `BirchDecoration#addCSSClass()` / `BirchDecoration#removeCSSClass` instead
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
    EnumBirchDecorationsTargetMatchMode
  > = new Map()
  private _negatedTargets: Map<
    IBirchItem | IBirchFolder,
    EnumBirchDecorationsTargetMatchMode
  > = new Map()
  private _disabled: boolean = false

  private events: EventEmitter<EnumBirchDecorationEvent> =
    new EventEmitter<EnumBirchDecorationEvent>()

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
        ? EnumBirchDecorationEvent.DecorationDisabled
        : EnumBirchDecorationEvent.DecorationEnabled,
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
    this.events.emit(EnumBirchDecorationEvent.AddCSSClassname, this, classname)
  }

  public removeCSSClass(classname: string): void {
    if (!this.cssClasslist.has(classname)) {
      return
    }
    this.cssClasslist.delete(classname)
    this.events.emit(
      EnumBirchDecorationEvent.RemoveCSSClassname,
      this,
      classname
    )
  }

  public addTarget(
    folder: IBirchFolder,
    flags: EnumBirchDecorationsTargetMatchMode
  ): void
  public addTarget(item: IBirchItem): void
  public addTarget(
    target: IBirchItem | IBirchFolder,
    flags: EnumBirchDecorationsTargetMatchMode = EnumBirchDecorationsTargetMatchMode.Self
  ): void {
    const existingFlags = this._appliedTargets.get(target)
    if (existingFlags === flags) {
      return
    }
    this._appliedTargets.set(target, flags)
    this.events.emit(EnumBirchDecorationEvent.AddTarget, this, target, flags)
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
      this.events.emit(EnumBirchDecorationEvent.RemoveTarget, this, target)
    }
  }

  public negateTarget(
    folder: IBirchFolder,
    flags: EnumBirchDecorationsTargetMatchMode
  ): void
  public negateTarget(item: IBirchItem): void
  public negateTarget(
    target: IBirchItem | IBirchFolder,
    flags: EnumBirchDecorationsTargetMatchMode = EnumBirchDecorationsTargetMatchMode.Self
  ): void {
    const existingFlags = this._negatedTargets.get(target)
    if (existingFlags === flags) {
      return
    }
    if (!(target.type === EnumTreeItemType.Item)) {
      return
    }
    this._negatedTargets.set(target, flags)
    this.events.emit(EnumBirchDecorationEvent.NegateTarget, this, target, flags)
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
      this.events.emit(EnumBirchDecorationEvent.UnNegateTarget, this, target)
    }
  }

  public onDidAddTarget(
    callback: (
      decoration: BirchDecoration,
      target: IBirchItem | IBirchFolder,
      flags: EnumBirchDecorationsTargetMatchMode
    ) => void
  ): IDisposable {
    return this.events.on(EnumBirchDecorationEvent.AddTarget, callback)
  }

  public onDidRemoveTarget(
    callback: (
      decoration: BirchDecoration,
      target: IBirchItem | IBirchFolder
    ) => void
  ): IDisposable {
    return this.events.on(EnumBirchDecorationEvent.RemoveTarget, callback)
  }

  public onDidNegateTarget(
    callback: (
      decoration: BirchDecoration,
      target: IBirchItem | IBirchFolder,
      flags: EnumBirchDecorationsTargetMatchMode
    ) => void
  ): IDisposable {
    return this.events.on(EnumBirchDecorationEvent.NegateTarget, callback)
  }

  public onDidUnNegateTarget(
    callback: (
      decoration: BirchDecoration,
      target: IBirchItem | IBirchFolder
    ) => void
  ): IDisposable {
    return this.events.on(EnumBirchDecorationEvent.UnNegateTarget, callback)
  }

  public onDidRemoveCSSClassname(
    callback: (decoration: BirchDecoration, classname: string) => void
  ): IDisposable {
    return this.events.on(EnumBirchDecorationEvent.RemoveCSSClassname, callback)
  }

  public onDidAddCSSClassname(
    callback: (decoration: BirchDecoration, classname: string) => void
  ): IDisposable {
    return this.events.on(EnumBirchDecorationEvent.AddCSSClassname, callback)
  }

  public onDidEnableDecoration(
    callback: (decoration: BirchDecoration) => void
  ): IDisposable {
    return this.events.on(EnumBirchDecorationEvent.DecorationEnabled, callback)
  }

  public onDidDisableDecoration(
    callback: (decoration: BirchDecoration) => void
  ): IDisposable {
    return this.events.on(EnumBirchDecorationEvent.DecorationDisabled, callback)
  }
}
