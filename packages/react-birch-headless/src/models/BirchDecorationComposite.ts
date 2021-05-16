import { DisposablesComposite } from 'react-birch-event-emitter'
import {
  EnumBirchDecorationsTargetMatchMode,
  EnumBirchDecorationCompositeType,
  EnumBirchDecorationChangeReason
} from 'react-birch-types'
import type {
  IBirchItem,
  IBirchFolder,
  IBirchDecoration
} from 'react-birch-types'

/**
 * The "consumer level" part of IBirchDecoration
 *
 * `BirchDecorationClasslistComposite` contains composited classnames from all the decorations applicable to a target
 *
 * The composite includes all the applicable inheritances and negations.
 *
 * Note that due to performance considerations, `BirchDecorationClasslistComposite` is one of the few cases where
 * we *do not* use `Disposables` for event management and instead use old school `addChangeListener`/`removeChangeListener` methods.
 *
 * Remember to pass same **named** function reference to `addChangeListener` and `removeChangeLiseneer` while subscribing and unsusbscribing
 * in `componentDidMount` and `componentWillUnmount` respectively.
 *
 * Note: You should also implement a `componentDidUpdate` hook where you can unsubscribe from previous decoration object and subscribe to the new one.
 */
export class BirchDecorationClasslistComposite {
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

/**
 * Compositer for decorations
 *
 * When multiple `IBirchDecoration`s are applied to a target, they get grouped into a `BirchDecorationComposite`
 *
 * @internal
 */
export class BirchDecorationComposite {
  // speaking of memory consumption, next three Maps aren't constructed for each BirchDecorationComposite unless it becomes self owned (due to special application or negation)
  public renderedDecorations: Map<IBirchDecoration, DisposablesComposite>

  public targetedDecorations: Set<IBirchDecoration>

  public negatedDecorations: Set<IBirchDecoration>

  public parent: BirchDecorationComposite

  public compositeCssClasslist: BirchDecorationClasslistComposite

  private target: IBirchItem | IBirchFolder

  private type: EnumBirchDecorationCompositeType

  private selfOwned: boolean

  private linkedComposites: Set<BirchDecorationComposite>

  private classlistChangeCallbacks: Set<() => void>

  constructor(
    target: IBirchItem | IBirchFolder,
    type: EnumBirchDecorationCompositeType,
    parent: BirchDecorationComposite
  ) {
    this.target = target
    this.type = type
    this.linkedComposites = new Set()
    this.classlistChangeCallbacks = new Set()

    this.compositeCssClasslist = new BirchDecorationClasslistComposite(
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

  public changeParent(newParent: BirchDecorationComposite) {
    if (!this.selfOwned) {
      this.parentOwn(newParent)
      return
    }

    // first purge all the decorations (unless applicable)
    for (const [decoration] of this.renderedDecorations) {
      this.recursiveRefresh(
        this,
        false,
        EnumBirchDecorationChangeReason.UnTargetDecoration,
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
    for (const [decoration] of newParent.renderedDecorations) {
      this.recursiveRefresh(
        this,
        false,
        EnumBirchDecorationChangeReason.TargetDecoration,
        decoration,
        false
      )
    }
  }

  public add(decoration: IBirchDecoration): void {
    const applicationMode = decoration.appliedTargets.get(this.target)

    const applicableToSelf =
      applicationMode &&
      (applicationMode === EnumBirchDecorationsTargetMatchMode.Self ||
        applicationMode === EnumBirchDecorationsTargetMatchMode.SelfAndChildren)
    const applicableToChildren =
      applicationMode &&
      (applicationMode === EnumBirchDecorationsTargetMatchMode.Children ||
        applicationMode === EnumBirchDecorationsTargetMatchMode.SelfAndChildren)

    if (
      this.type === EnumBirchDecorationCompositeType.Applicable &&
      !applicableToSelf
    ) {
      return
    }
    if (
      this.type === EnumBirchDecorationCompositeType.Inheritable &&
      !applicableToChildren
    ) {
      return
    }

    if (!this.selfOwned) {
      this.selfOwn(EnumBirchDecorationChangeReason.TargetDecoration, decoration)
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
      EnumBirchDecorationChangeReason.TargetDecoration,
      decoration
    )
  }

  public remove(decoration: IBirchDecoration): void {
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
        this.parentOwn(
          null,
          EnumBirchDecorationChangeReason.UnTargetDecoration,
          decoration
        )
        return
      }
      this.recursiveRefresh(
        this,
        false,
        EnumBirchDecorationChangeReason.UnTargetDecoration,
        decoration
      )
    }
  }

  public negate(decoration: IBirchDecoration): void {
    const negationMode = decoration.negatedTargets.get(this.target)

    const negatedOnSelf =
      negationMode &&
      (negationMode === EnumBirchDecorationsTargetMatchMode.Self ||
        negationMode === EnumBirchDecorationsTargetMatchMode.SelfAndChildren)
    const negatedOnChildren =
      negationMode &&
      (negationMode === EnumBirchDecorationsTargetMatchMode.Children ||
        negationMode === EnumBirchDecorationsTargetMatchMode.SelfAndChildren)

    if (
      this.type === EnumBirchDecorationCompositeType.Applicable &&
      !negatedOnSelf
    ) {
      return
    }
    if (
      this.type === EnumBirchDecorationCompositeType.Inheritable &&
      !negatedOnChildren
    ) {
      return
    }

    if (!this.selfOwned) {
      this.selfOwn(
        EnumBirchDecorationChangeReason.UnTargetDecoration,
        decoration
      )
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
  public unNegate(decoration: IBirchDecoration): void {
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
          EnumBirchDecorationChangeReason.TargetDecoration,
          decoration
        )
      }
    }
  }

  private selfOwn(
    reason: EnumBirchDecorationChangeReason,
    decoration: IBirchDecoration
  ) {
    if (this.selfOwned) {
      throw new Error(`BirchDecorationComposite is already self owned`)
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
          EnumBirchDecorationChangeReason.TargetDecoration,
          inheritedDecoration
        )
      }
    }

    // perhaps negation is why this composite branched off
    if (
      reason === EnumBirchDecorationChangeReason.UnTargetDecoration &&
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
    newParent?: BirchDecorationComposite,
    reason?: EnumBirchDecorationChangeReason,
    decoration?: IBirchDecoration
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
    reason: EnumBirchDecorationChangeReason,
    decoration: IBirchDecoration
  ): boolean {
    if (!this.selfOwned) {
      throw new Error(`BirchDecorationComposite is not self owned`)
    }
    if (reason === EnumBirchDecorationChangeReason.UnTargetDecoration) {
      const disposable = this.renderedDecorations.get(decoration)
      if (disposable) {
        const applicationMode = decoration.appliedTargets.get(this.target)

        const applicableToSelf =
          applicationMode &&
          (applicationMode === EnumBirchDecorationsTargetMatchMode.Self ||
            applicationMode ===
              EnumBirchDecorationsTargetMatchMode.SelfAndChildren)
        const applicableToChildren =
          applicationMode &&
          (applicationMode === EnumBirchDecorationsTargetMatchMode.Children ||
            applicationMode ===
              EnumBirchDecorationsTargetMatchMode.SelfAndChildren)

        if (
          applicableToSelf &&
          this.type === EnumBirchDecorationCompositeType.Applicable
        ) {
          return false
        }

        if (
          applicableToChildren &&
          this.type === EnumBirchDecorationCompositeType.Inheritable
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

    if (reason === EnumBirchDecorationChangeReason.TargetDecoration) {
      const negationMode = decoration.negatedTargets.get(this.target)

      const negatedOnSelf =
        negationMode &&
        (negationMode === EnumBirchDecorationsTargetMatchMode.Self ||
          negationMode === EnumBirchDecorationsTargetMatchMode.SelfAndChildren)
      const negatedOnChildren =
        negationMode &&
        (negationMode === EnumBirchDecorationsTargetMatchMode.Children ||
          negationMode === EnumBirchDecorationsTargetMatchMode.SelfAndChildren)

      if (
        negatedOnSelf &&
        this.type === EnumBirchDecorationCompositeType.Applicable
      ) {
        return false
      }

      if (
        negatedOnChildren &&
        this.type === EnumBirchDecorationCompositeType.Inheritable
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
    origin: BirchDecorationComposite,
    updateReferences: boolean,
    reason?: EnumBirchDecorationChangeReason,
    decoration?: IBirchDecoration,
    notifyListeners: boolean = true
  ) {
    // references changed
    if (!this.selfOwned && updateReferences) {
      this.renderedDecorations = this.parent.renderedDecorations
      this.compositeCssClasslist.classlist =
        this.parent.compositeCssClasslist.classlist
    }

    if (this.selfOwned && updateReferences && origin !== this) {
      // purge all the decorations (unless applicable)
      for (const [renderedDecoration] of this.renderedDecorations) {
        this.processCompositeAlteration(
          EnumBirchDecorationChangeReason.UnTargetDecoration,
          renderedDecoration
        )
      }

      // then add all the inherited decorations (unless not applicable)
      for (const [inheritedDecoration] of this.parent.renderedDecorations) {
        this.processCompositeAlteration(
          EnumBirchDecorationChangeReason.TargetDecoration,
          inheritedDecoration
        )
      }

      if (notifyListeners) {
        this.notifyClasslistChange(false)
      }
    } else if (
      this.selfOwned &&
      reason === EnumBirchDecorationChangeReason.UnTargetDecoration &&
      this.renderedDecorations.has(decoration)
    ) {
      this.processCompositeAlteration(reason, decoration)
      if (notifyListeners) {
        this.notifyClasslistChange(false)
      }
    } else if (
      this.selfOwned &&
      reason === EnumBirchDecorationChangeReason.TargetDecoration &&
      this.processCompositeAlteration(reason, decoration) &&
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
    decoration: IBirchDecoration,
    classname: string
  ) => {
    if (!this.selfOwned) {
      throw new Error(
        `[INTERNAL] A non-self owned composite must not be incharge of IBirchDecoration events`
      )
    }
    ;(this.compositeCssClasslist.classlist as string[]).push(classname)
    this.notifyClasslistChange()
  }

  private handleDecorationDidRemoveClassname = (
    decoration: IBirchDecoration,
    classname: string
  ) => {
    if (!this.selfOwned) {
      throw new Error(
        `[INTERNAL] A non-self owned composite must not be incharge of IBirchDecoration events`
      )
    }
    const idx = this.compositeCssClasslist.classlist.indexOf(classname)
    if (idx > -1) {
      ;(this.compositeCssClasslist.classlist as string[]).splice(idx, 1)
      this.notifyClasslistChange()
    }
  }

  private mergeDecorationClasslist = (decoration: IBirchDecoration) => {
    if (!this.selfOwned) {
      throw new Error(
        `[INTERNAL] A non-self owned composite must not be incharge of IBirchDecoration events`
      )
    }
    ;(this.compositeCssClasslist.classlist as string[]).push(
      ...decoration.cssClasslist
    )
    this.notifyClasslistChange()
  }

  private removeDecorationClasslist(
    decoration: IBirchDecoration,
    notifyAll: boolean = true
  ) {
    if (!this.selfOwned) {
      throw new Error(
        `[INTERNAL] A non-self owned composite must not be incharge of IBirchDecoration events`
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
