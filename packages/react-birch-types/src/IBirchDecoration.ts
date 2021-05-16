import { EnumBirchDecorationsTargetMatchMode } from './IBirchDecorationEnum'
import type { IDisposable } from './IDisposable'
import type { IBirchFolder } from './IBirchFolder'
import type { IBirchItem } from './IBirchItem'

export interface IBirchDecoration {
  /**
   * Do not mutate directly, use `IBirchDecoration#addCSSClass()` / `IBirchDecoration#removeCSSClass` instead
   */
  readonly cssClasslist: Set<string>
  disabled: boolean
  readonly appliedTargets: Map<
    IBirchItem | IBirchFolder,
    EnumBirchDecorationsTargetMatchMode
  >
  readonly negatedTargets: Map<
    IBirchItem | IBirchFolder,
    EnumBirchDecorationsTargetMatchMode
  >
  addCSSClass(classname: string): void
  removeCSSClass(classname: string): void
  addTarget(
    folder: IBirchFolder,
    flags: EnumBirchDecorationsTargetMatchMode
  ): void
  addTarget(item: IBirchItem): void
  removeTarget(folder: IBirchFolder): void
  removeTarget(item: IBirchItem): void
  negateTarget(
    folder: IBirchFolder,
    flags: EnumBirchDecorationsTargetMatchMode
  ): void
  negateTarget(item: IBirchItem): void
  unNegateTarget(folder: IBirchFolder): void
  unNegateTarget(item: IBirchItem): void
  onDidAddTarget(
    callback: (
      decoration: IBirchDecoration,
      target: IBirchItem | IBirchFolder,
      flags: EnumBirchDecorationsTargetMatchMode
    ) => void
  ): IDisposable
  onDidRemoveTarget(
    callback: (
      decoration: IBirchDecoration,
      target: IBirchItem | IBirchFolder
    ) => void
  ): IDisposable
  onDidNegateTarget(
    callback: (
      decoration: IBirchDecoration,
      target: IBirchItem | IBirchFolder,
      flags: EnumBirchDecorationsTargetMatchMode
    ) => void
  ): IDisposable
  onDidUnNegateTarget(
    callback: (
      decoration: IBirchDecoration,
      target: IBirchItem | IBirchFolder
    ) => void
  ): IDisposable
  onDidRemoveCSSClassname(
    callback: (decoration: IBirchDecoration, classname: string) => void
  ): IDisposable
  onDidAddCSSClassname(
    callback: (decoration: IBirchDecoration, classname: string) => void
  ): IDisposable
  onDidEnableDecoration(
    callback: (decoration: IBirchDecoration) => void
  ): IDisposable
  onDidDisableDecoration(
    callback: (decoration: IBirchDecoration) => void
  ): IDisposable
}

/**
 * The "consumer level" part of BirchDecoration
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
export interface IBirchDecorationClasslistComposite {
  /**
   * Registers a function to be called when composited classlist changes
   *
   * *⚠ Remember not to use anonymous function!! (pass a named function reference instead)*
   */
  readonly addChangeListener: (namedCallback: () => void) => void
  /**
   * Unregisters a previsously registered classlist change listener
   *
   * *⚠ Remember not to use anonymous function!! (pass a named function reference instead)*
   */
  readonly removeChangeListener: (namedCallback: () => void) => void
  classlist: ReadonlyArray<string>
}

/**
 * NOTES FOR CONTRIBUTORS:
 * - A Target is a folder or a item entry
 * - A Target is a DirectTarget when it is explicitly listed in a IBirchDecoration's application or negation list
 * - As opposed to DirectTarget, general targets are implicit targets when they simply inherit from their parent's inhertiable BirchDecorationComposite
 * - All general targets "point to" their first parent's `inheritable` composite see docs for `IBirchDecorationMeta.inheritable`
 */
export interface IBirchDecorationManager extends IDisposable {
  readonly viewId: string
  /**
   * Permanently disengages the decoration system from the tree
   */
  dispose(): void
  /**
   * Adds the given `IBirchDecoration` to the tree
   *
   * `IBirchDecoration`s have no effect unless they are targetted at item(s). Use `IBirchDecoration#addTarget` to have them render in the filetree
   */
  addDecoration(decoration: IBirchDecoration): void
  /**
   * Removes a `IBirchDecoration` from the tree
   *
   * Note that this "removes" entire `IBirchDecoration` from tree but the said `IBirchDecoration`'s targets are still left intact.
   *
   * Calling `DecorationManager#addDecoration` with the same `IBirchDecoration` will undo the removal if the targets are left unchanged.
   */
  removeDecoration(decoration: IBirchDecoration): void
  /**
   * Returns resolved decorations for given item
   *
   * Resolution includes taking inheritances into consideration, along with any negations that may void some or all of inheritances
   */
  getDecorations(
    item: IBirchItem | IBirchFolder
  ): IBirchDecorationClasslistComposite
}
