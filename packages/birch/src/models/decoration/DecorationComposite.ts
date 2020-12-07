/* eslint-disable no-restricted-syntax */
import { DisposablesComposite } from 'birch-event-emitter'
import {
  IBirchItem,
  IBirchFolder,
  IDecoration,
  EnumDecorationTargetMatchMode
} from 'react-birch-types'

/**
 * The "consumer level" part of IDecoration
 *
 * `ClasslistComposite` contains composited classnames from all the decorations applicable to a target
 *
 * The composite includes all the applicable inheritances and negations.
 *
 * Note that due to performance considerations, `ClasslistComposite` is one of the few cases where
 * we *do not* use `Disposables` for event management and instead use old school `addChangeListener`/`removeChangeListener` methods.
 *
 * Remember to pass same **named** function reference to `addChangeListener` and `removeChangeLiseneer` while subscribing and unsusbscribing
 * in `componentDidMount` and `componentWillUnmount` respectively.
 *
 * Note: You should also implement a `componentDidUpdate` hook where you can unsubscribe from previous decoration object and subscribe to the new one.
 */
export class ClasslistComposite {
  public classlist: ReadonlyArray<string>

  /** @internal */
  // eslint-disable-next-line no-useless-constructor
  constructor(
    /**
     * Registers a function to be called when composited classlist changes
     *
     * *⚠ Remember not to use anonymous function!! (pass a named function reference instead)*
     */
    public readonly addChangeListener: (namedCallback: () => void) => void,
    /**
     * Unregisters a previsously registered classlist change listener
     *
     * *⚠ Remember not to use anonymous function!! (pass a named function reference instead)*
     */
    public readonly removeChangeListener: (namedCallback: () => void) => void
  ) {}
}

export enum DecorationCompositeType {
  Applicable = 1,
  Inheritable
}

export enum EnumChangeReason {
  UnTargetDecoration = 1,
  TargetDecoration
}

/**
 * Compositer for decorations
 *
 * When multiple `IDecoration`s are applied to a target, they get grouped into a `DecorationComposite`
 *
 * @internal
 */
export class DecorationComposite {
  // speaking of memory consumption, next three Maps aren't constructed for each DecorationComposite unless it becomes self owned (due to special application or negation)
  public renderedDecorations: Map<IDecoration, DisposablesComposite>

  public targetedDecorations: Set<IDecoration>

  public negatedDecorations: Set<IDecoration>

  public parent: DecorationComposite

  public compositeCssClasslist: ClasslistComposite

  private target: IBirchItem | IBirchFolder

  private type: DecorationCompositeType

  private selfOwned: boolean

  private linkedComposites: Set<DecorationComposite>

  private classlistChangeCallbacks: Set<() => void>

  constructor(
    target: IBirchItem | IBirchFolder,
    type: DecorationCompositeType,
    parent: DecorationComposite
  ) {
    this.target = target
    this.type = type
    this.linkedComposites = new Set()
    this.classlistChangeCallbacks = new Set()

    this.compositeCssClasslist = new ClasslistComposite(
      this.classlistChangeCallbacks.add.bind(this.classlistChangeCallbacks),
      this.classlistChangeCallbacks.delete.bind(this.classlistChangeCallbacks)
    )

    if (parent) {
      this.selfOwned = false
      this.parent = parent
      this.renderedDecorations = parent.renderedDecorations
      this.compositeCssClasslist.classlist =
        parent.compositeCssClasslist.classlist
      parent.linkedComposites.add(this)
    } else {
      this.renderedDecorations = new Map()
      this.targetedDecorations = new Set()
      this.negatedDecorations = new Set()
      this.compositeCssClasslist.classlist = []
      this.selfOwned = true
    }
  }

  public changeParent(newParent: DecorationComposite) {
    if (!this.selfOwned) {
      this.parentOwn(newParent)
      return
    }

    // first purge all the decorations (unless applicable)
    // eslint-disable-next-line no-restricted-syntax
    for (const [decoration] of this.renderedDecorations) {
      this.recursiveRefresh(
        this,
        false,
        EnumChangeReason.UnTargetDecoration,
        decoration,
        false
      )
    }
    if (this.parent !== newParent) {
      this.parent.linkedComposites.delete(this)
      this.parent = newParent
      newParent.linkedComposites.add(this)
    }

    // then add all the inherited decorations (unless not applicable)
    // eslint-disable-next-line no-restricted-syntax
    for (const [decoration] of newParent.renderedDecorations) {
      this.recursiveRefresh(
        this,
        false,
        EnumChangeReason.TargetDecoration,
        decoration,
        false
      )
    }
  }

  public add(decoration: IDecoration): void {
    const applicationMode = decoration.appliedTargets.get(this.target)

    const applicableToSelf =
      applicationMode &&
      (applicationMode === EnumDecorationTargetMatchMode.Self ||
        applicationMode === EnumDecorationTargetMatchMode.SelfAndChildren)
    const applicableToChildren =
      applicationMode &&
      (applicationMode === EnumDecorationTargetMatchMode.Children ||
        applicationMode === EnumDecorationTargetMatchMode.SelfAndChildren)

    if (this.type === DecorationCompositeType.Applicable && !applicableToSelf) {
      return
    }
    if (
      this.type === DecorationCompositeType.Inheritable &&
      !applicableToChildren
    ) {
      return
    }

    if (!this.selfOwned) {
      this.selfOwn(EnumChangeReason.TargetDecoration, decoration)
      this.targetedDecorations.add(decoration)
      return
    }
    if (this.targetedDecorations.has(decoration)) {
      return
    }
    this.targetedDecorations.add(decoration)
    this.recursiveRefresh(
      this,
      false,
      EnumChangeReason.TargetDecoration,
      decoration
    )
  }

  public remove(decoration: IDecoration): void {
    // a non-self owned composite wouldn't have had a decoration to begin with
    if (!this.selfOwned) {
      return
    }
    if (this.targetedDecorations.delete(decoration)) {
      if (
        this.negatedDecorations.size === 0 &&
        this.targetedDecorations.size === 0 &&
        this.parent
      ) {
        this.parentOwn(null!, EnumChangeReason.UnTargetDecoration, decoration)
        return
      }
      this.recursiveRefresh(
        this,
        false,
        EnumChangeReason.UnTargetDecoration,
        decoration
      )
    }
  }

  public negate(decoration: IDecoration): void {
    const negationMode = decoration.negatedTargets.get(this.target)

    const negatedOnSelf =
      negationMode &&
      (negationMode === EnumDecorationTargetMatchMode.Self ||
        negationMode === EnumDecorationTargetMatchMode.SelfAndChildren)
    const negatedOnChildren =
      negationMode &&
      (negationMode === EnumDecorationTargetMatchMode.Children ||
        negationMode === EnumDecorationTargetMatchMode.SelfAndChildren)

    if (this.type === DecorationCompositeType.Applicable && !negatedOnSelf) {
      return
    }
    if (
      this.type === DecorationCompositeType.Inheritable &&
      !negatedOnChildren
    ) {
      return
    }

    if (!this.selfOwned) {
      this.selfOwn(EnumChangeReason.UnTargetDecoration, decoration)
      this.negatedDecorations.add(decoration)
      return
    }
    if (this.negatedDecorations.has(decoration)) {
      return
    }
    this.negatedDecorations.add(decoration)
    if (this.renderedDecorations.has(decoration)) {
      this.removeDecorationClasslist(decoration)
    }
  }

  /**
   * unNegate doesn't mean "explicit apply"
   */
  public unNegate(decoration: IDecoration): void {
    // a non-self owned composite wouldn't have been negated to begin with
    if (!this.selfOwned) {
      return
    }
    if (this.negatedDecorations.delete(decoration)) {
      if (
        this.negatedDecorations.size === 0 &&
        this.targetedDecorations.size === 0 &&
        this.parent
      ) {
        this.parentOwn()
        return
      }
      // currently not present
      if (
        !this.renderedDecorations.has(decoration) &&
        // **and** either parent or itself has it applied
        (this.parent.renderedDecorations.has(decoration) ||
          decoration.appliedTargets.has(this.target))
      ) {
        this.recursiveRefresh(
          this,
          false,
          EnumChangeReason.TargetDecoration,
          decoration
        )
      }
    }
  }

  private selfOwn(reason: EnumChangeReason, decoration: IDecoration) {
    if (this.selfOwned) {
      throw new Error(`DecorationComposite is already self owned`)
    }
    const parent = this.parent
    this.selfOwned = true
    this.compositeCssClasslist.classlist = []
    this.renderedDecorations = new Map()
    this.targetedDecorations = new Set()
    this.negatedDecorations = new Set()

    // first process all the inherited decorations
    for (const [inheritedDecoration] of parent.renderedDecorations) {
      // fate of the decoration (second arg) will be decided in `#recursiveRefresh`
      if (inheritedDecoration !== decoration) {
        this.processCompositeAlteration(
          EnumChangeReason.TargetDecoration,
          inheritedDecoration
        )
      }
    }

    // perhaps negation is why this composite branched off
    if (
      reason === EnumChangeReason.UnTargetDecoration &&
      // parent had it
      this.parent.renderedDecorations.has(decoration) &&
      // this one won't
      !this.renderedDecorations.has(decoration)
    ) {
      // announce the change
      this.notifyClasslistChange(false)
    }

    // then move on to main business
    this.recursiveRefresh(this, true, reason, decoration)
  }

  private parentOwn(
    newParent?: DecorationComposite,
    reason?: EnumChangeReason,
    decoration?: IDecoration
  ) {
    this.selfOwned = false
    this.targetedDecorations = undefined
    this.negatedDecorations = undefined
    if (newParent && this.parent !== newParent) {
      if (this.parent) {
        this.parent.linkedComposites.delete(this)
      }
      newParent.linkedComposites.add(this)
      this.parent = newParent
    }

    this.recursiveRefresh(this, true, reason, decoration)
  }

  private processCompositeAlteration(
    reason: EnumChangeReason,
    decoration: IDecoration
  ): boolean {
    if (!this.selfOwned) {
      throw new Error(`DecorationComposite is not self owned`)
    }
    if (reason === EnumChangeReason.UnTargetDecoration) {
      const disposable = this.renderedDecorations.get(decoration)
      if (disposable) {
        const applicationMode = decoration.appliedTargets.get(this.target)

        const applicableToSelf =
          applicationMode &&
          (applicationMode === EnumDecorationTargetMatchMode.Self ||
            applicationMode === EnumDecorationTargetMatchMode.SelfAndChildren)
        const applicableToChildren =
          applicationMode &&
          (applicationMode === EnumDecorationTargetMatchMode.Children ||
            applicationMode === EnumDecorationTargetMatchMode.SelfAndChildren)

        if (
          applicableToSelf &&
          this.type === DecorationCompositeType.Applicable
        ) {
          return false
        }

        if (
          applicableToChildren &&
          this.type === DecorationCompositeType.Inheritable
        ) {
          return false
        }

        this.removeDecorationClasslist(decoration, false)

        if (disposable) {
          disposable.dispose()
        }
        return this.renderedDecorations.delete(decoration)
      }
      return false
    }

    if (reason === EnumChangeReason.TargetDecoration) {
      const negationMode = decoration.negatedTargets.get(this.target)

      const negatedOnSelf =
        negationMode &&
        (negationMode === EnumDecorationTargetMatchMode.Self ||
          negationMode === EnumDecorationTargetMatchMode.SelfAndChildren)
      const negatedOnChildren =
        negationMode &&
        (negationMode === EnumDecorationTargetMatchMode.Children ||
          negationMode === EnumDecorationTargetMatchMode.SelfAndChildren)

      if (negatedOnSelf && this.type === DecorationCompositeType.Applicable) {
        return false
      }

      if (
        negatedOnChildren &&
        this.type === DecorationCompositeType.Inheritable
      ) {
        return false
      }

      if (!this.renderedDecorations.has(decoration)) {
        const disposables = new DisposablesComposite()

        disposables.add(
          decoration.onDidAddCSSClassname(this.handleDecorationDidAddClassname)
        )
        disposables.add(
          decoration.onDidRemoveCSSClassname(
            this.handleDecorationDidRemoveClassname
          )
        )
        disposables.add(
          decoration.onDidDisableDecoration(this.removeDecorationClasslist)
        )
        disposables.add(
          decoration.onDidEnableDecoration(this.mergeDecorationClasslist)
        )
        this.renderedDecorations.set(decoration, disposables)
        if (!decoration.disabled) {
          ;(this.compositeCssClasslist.classlist as string[]).push(
            ...decoration.cssClasslist
          )
          return true
        }
        return false
      }
    }
    return false
  }

  private recursiveRefresh(
    origin: DecorationComposite,
    updateReferences: boolean,
    reason?: EnumChangeReason,
    decoration?: IDecoration,
    notifyListeners: boolean = true
  ) {
    // references changed
    if (!this.selfOwned && updateReferences) {
      this.renderedDecorations = this.parent.renderedDecorations
      this.compositeCssClasslist.classlist = this.parent.compositeCssClasslist.classlist
    }

    if (this.selfOwned && updateReferences && origin !== this) {
      // purge all the decorations (unless applicable)
      for (const [renderedDecoration] of this.renderedDecorations) {
        this.processCompositeAlteration(
          EnumChangeReason.UnTargetDecoration,
          renderedDecoration
        )
      }

      // then add all the inherited decorations (unless not applicable)
      for (const [inheritedDecoration] of this.parent.renderedDecorations) {
        this.processCompositeAlteration(
          EnumChangeReason.TargetDecoration,
          inheritedDecoration
        )
      }

      if (notifyListeners) {
        this.notifyClasslistChange(false)
      }
    } else if (
      this.selfOwned &&
      reason === EnumChangeReason.UnTargetDecoration &&
      this.renderedDecorations.has(decoration!)
    ) {
      this.processCompositeAlteration(reason, decoration!)
      if (notifyListeners) {
        this.notifyClasslistChange(false)
      }
    } else if (
      this.selfOwned &&
      reason === EnumChangeReason.TargetDecoration &&
      this.processCompositeAlteration(reason, decoration!) &&
      notifyListeners
    ) {
      this.notifyClasslistChange(false)
    } else if (!this.selfOwned && notifyListeners) {
      this.notifyClasslistChange(false)
    }

    for (const linkedComposite of this.linkedComposites) {
      linkedComposite.recursiveRefresh(
        origin,
        updateReferences,
        reason,
        decoration,
        notifyListeners
      )
    }
  }

  private handleDecorationDidAddClassname = (
    decoration: IDecoration,
    classname: string
  ) => {
    if (!this.selfOwned) {
      throw new Error(
        `[INTERNAL] A non-self owned composite must not be incharge of IDecoration events`
      )
    }
    ;(this.compositeCssClasslist.classlist as string[]).push(classname)
    this.notifyClasslistChange()
  }

  private handleDecorationDidRemoveClassname = (
    decoration: IDecoration,
    classname: string
  ) => {
    if (!this.selfOwned) {
      throw new Error(
        `[INTERNAL] A non-self owned composite must not be incharge of IDecoration events`
      )
    }
    const idx = this.compositeCssClasslist.classlist.indexOf(classname)
    if (idx > -1) {
      ;(this.compositeCssClasslist.classlist as string[]).splice(idx, 1)
      this.notifyClasslistChange()
    }
  }

  private mergeDecorationClasslist = (decoration: IDecoration) => {
    if (!this.selfOwned) {
      throw new Error(
        `[INTERNAL] A non-self owned composite must not be incharge of IDecoration events`
      )
    }
    ;(this.compositeCssClasslist.classlist as string[]).push(
      ...decoration.cssClasslist
    )
    this.notifyClasslistChange()
  }

  private removeDecorationClasslist(
    decoration: IDecoration,
    notifyAll: boolean = true
  ) {
    if (!this.selfOwned) {
      throw new Error(
        `[INTERNAL] A non-self owned composite must not be incharge of IDecoration events`
      )
    }
    for (const classname of decoration.cssClasslist) {
      const idx = this.compositeCssClasslist.classlist.indexOf(classname)
      if (idx > -1) {
        ;(this.compositeCssClasslist.classlist as string[]).splice(idx, 1)
      }
    }
    if (notifyAll) {
      this.notifyClasslistChange()
    }
  }

  private notifyClasslistChange(recursive: boolean = true) {
    // here it's important that we don't iterate directly over this.classlistChangeCallbacks, instead create a copy of them first
    // if one of the callbacks alters the Set by adding/removing callback (inside another callback) it makes this loop infinite
    for (const cb of [...this.classlistChangeCallbacks]) {
      cb()
    }
    if (recursive) {
      for (const linkedComposite of this.linkedComposites) {
        if (!linkedComposite.selfOwned) {
          linkedComposite.notifyClasslistChange()
        }
      }
    }
  }
}
