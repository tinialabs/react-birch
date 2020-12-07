/* eslint-disable no-restricted-syntax */
import { DisposablesComposite, IDisposable } from 'birch-event-emitter'
import type { IBirchFolder, IBirchItem, IBirchRoot } from 'react-birch-types'
import { EnumTreeItemType } from 'react-birch-types'
import { Decoration } from './Decoration'
import {
  ClasslistComposite,
  DecorationComposite,
  DecorationCompositeType
} from './DecorationComposite'

interface IDecorationMeta {
  /**
   * All the decorations that will apply to self
   *
   * Unless applicables conflict (by having specific Decoration applied or negated) they "share" the data of their parent's `inheritable`
   */
  applicable: DecorationComposite

  /**
   * All the decorations that will apply to children (infinitely unless explicitly negated by a target on the way down)
   *
   * Unless inheritables conflict (by having specific Decoration applied or negated) they "share" the data of their parent's `inheritable`
   */
  inheritable: DecorationComposite
}

/**
 * NOTES FOR CONTRIBUTORS:
 * - A Target is a folder or a item entry
 * - A Target is a DirectTarget when it is explicitly listed in a Decoration's application or negation list
 * - As opposed to DirectTarget, general targets are implicit targets when they simply inherit from their parent's inhertiable DecorationComposite
 * - All general targets "point to" their first parent's `inheritable` composite see docs for `IDecorationMeta.inheritable`
 */
export class DecorationsManager implements IDisposable {
  private decorations: Map<Decoration, IDisposable> = new Map()

  private decorationsMeta: WeakMap<
    IBirchItem | IBirchFolder,
    IDecorationMeta
  > = new WeakMap()

  private disposables: DisposablesComposite = new DisposablesComposite()

  private disposed: boolean = false

  constructor(root: IBirchRoot, public readonly viewId: string) {
    // if the object is actually BirchRoot, but not of same version this condition will likely be true
    if (!(root.root === root)) {
      throw new TypeError('Unexpected object type. Expected `BirchRoot`. ')
    }
    // this will act as "seed" (base) for rest of the decorations to come
    this.decorationsMeta.set(root, {
      applicable: new DecorationComposite(
        root,
        DecorationCompositeType.Applicable,
        null
      ),
      inheritable: new DecorationComposite(
        root,
        DecorationCompositeType.Inheritable,
        null
      )
    })

    this.disposables.add(root.onDidChangeParent(this.switchParent))
    this.disposables.add(
      root.onDidDispose(this.decorationsMeta.delete.bind(this.decorationsMeta))
    )
  }

  /**
   * Permanently disengages the decoration system from the tree
   */
  public dispose(): void {
    for (const [decoration] of this.decorations) {
      this.removeDecoration(decoration)
    }
    this.disposables.dispose()
    this.disposed = true
  }

  /**
   * Adds the given `Decoration` to the tree
   *
   * `Decoration`s have no effect unless they are targetted at item(s). Use `Decoration#addTarget` to have them render in the filetree
   */
  public addDecoration(decoration: Decoration): void {
    if (this.disposed) {
      throw new Error(`DecorationManager disposed`)
    }

    if (this.decorations.has(decoration)) {
      return
    }

    const disposable = new DisposablesComposite()

    disposable.add(decoration.onDidAddTarget(this.targetDecoration))
    disposable.add(decoration.onDidRemoveTarget(this.unTargetDecoration))
    disposable.add(decoration.onDidNegateTarget(this.negateDecoration))
    disposable.add(decoration.onDidUnNegateTarget(this.unNegateDecoration))

    this.decorations.set(decoration, disposable)

    for (const [target] of decoration.appliedTargets) {
      this.targetDecoration(decoration, target)
    }
    for (const [target] of decoration.negatedTargets) {
      this.negateDecoration(decoration, target)
    }
  }

  /**
   * Removes a `Decoration` from the tree
   *
   * Note that this "removes" entire `Decoration` from tree but the said `Decoration`'s targets are still left intact.
   *
   * Calling `DecorationManager#addDecoration` with the same `Decoration` will undo the removal if the targets are left unchanged.
   */
  public removeDecoration(decoration: Decoration): void {
    const decorationSubscriptions = this.decorations.get(decoration)

    if (!decorationSubscriptions) {
      return
    }

    for (const [target] of decoration.appliedTargets) {
      const meta = this.decorationsMeta.get(target)
      if (meta && meta.applicable) {
        meta.applicable.remove(decoration)
      }
      if (meta && meta.inheritable) {
        meta.inheritable.remove(decoration)
      }
    }

    for (const [target] of decoration.negatedTargets) {
      const meta = this.decorationsMeta.get(target)
      if (meta) {
        meta.applicable.unNegate(decoration)
        meta.inheritable.unNegate(decoration)
      }
    }

    decorationSubscriptions.dispose()
    this.decorations.delete(decoration)
  }

  /**
   * Returns resolved decorations for given item
   *
   * Resolution includes taking inheritances into consideration, along with any negations that may void some or all of inheritances
   */
  public getDecorations(item: IBirchItem | IBirchFolder): ClasslistComposite {
    if (
      !item ||
      (item.type !== EnumTreeItemType.Item &&
        item.type !== EnumTreeItemType.Folder)
    ) {
      return null
    }
    const decMeta = this.getDecorationData(item)
    if (decMeta) {
      return decMeta.applicable.compositeCssClasslist
    }
    return null
  }

  /**
   * @internal
   */
  public getDecorationData(item: IBirchItem | IBirchFolder): IDecorationMeta {
    if (this.disposed) {
      return null
    }
    const meta = this.decorationsMeta.get(item)
    if (meta) {
      return meta
    }
    // if we make it here that means the item was not a DirectTarget and will simply point to parent's `inheritable` composite (unless is negated)
    if (!item || !item.parent) {
      return null
    }
    const parentMeta = this.getDecorationData(item.parent)

    if (parentMeta) {
      const ownMeta: IDecorationMeta = {
        applicable: new DecorationComposite(
          item,
          DecorationCompositeType.Applicable,
          parentMeta.inheritable
        ),
        inheritable:
          item.type === EnumTreeItemType.Folder
            ? new DecorationComposite(
                item,
                DecorationCompositeType.Inheritable,
                parentMeta.inheritable
              )
            : null
      }
      this.decorationsMeta.set(item, ownMeta)
      return ownMeta
    }
    return null
  }

  private targetDecoration = (
    decoration: Decoration,
    target: IBirchItem | IBirchFolder
  ): void => {
    const { applicable, inheritable } = this.getDecorationData(target)

    applicable.add(decoration)

    if (inheritable) {
      inheritable.add(decoration)
    }
  }

  private unTargetDecoration = (
    decoration: Decoration,
    target: IBirchItem | IBirchFolder
  ): void => {
    const { applicable, inheritable } = this.getDecorationData(target)

    applicable.remove(decoration)

    if (inheritable) {
      inheritable.remove(decoration)
    }
  }

  private negateDecoration = (
    decoration: Decoration,
    target: IBirchItem | IBirchFolder
  ): void => {
    const { applicable, inheritable } = this.getDecorationData(target)

    applicable.negate(decoration)

    if (inheritable) {
      inheritable.negate(decoration)
    }
  }

  private unNegateDecoration = (
    decoration: Decoration,
    target: IBirchItem | IBirchFolder
  ): void => {
    const { applicable, inheritable } = this.getDecorationData(target)

    applicable.unNegate(decoration)

    if (inheritable) {
      inheritable.unNegate(decoration)
    }
  }

  private switchParent = (
    target: IBirchItem | IBirchFolder,
    prevParent: IBirchFolder,
    newParent: IBirchFolder
  ): void => {
    const ownMeta = this.decorationsMeta.get(target)
    if (!ownMeta) {
      return
    }
    const newParentMeta = this.getDecorationData(newParent)
    ownMeta.applicable.changeParent(newParentMeta.inheritable)
    if (ownMeta.inheritable) {
      ownMeta.inheritable.changeParent(newParentMeta.inheritable)
    }
  }
}

export default DecorationsManager
