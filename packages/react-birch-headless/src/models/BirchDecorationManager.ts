import { DisposablesComposite, IDisposable } from 'react-birch-event-emitter'
import {
  EnumTreeItemType,
  EnumBirchDecorationCompositeType
} from 'react-birch-types'
import { BirchRoot } from './BirchRoot'
import { BirchDecoration } from './BirchDecoration'
import {
  BirchDecorationClasslistComposite,
  BirchDecorationComposite
} from './BirchDecorationComposite'
import type {
  IBirchDecorationManager,
  IBirchFolder,
  IBirchItem,
  IBirchRoot
} from 'react-birch-types'

interface IBirchDecorationMeta {
  /**
   * All the decorations that will apply to self
   *
   * Unless applicables conflict (by having specific BirchDecoration applied or negated) they "share" the data of their parent's `inheritable`
   */
  applicable: BirchDecorationComposite

  /**
   * All the decorations that will apply to children (infinitely unless explicitly negated by a target on the way down)
   *
   * Unless inheritables conflict (by having specific BirchDecoration applied or negated) they "share" the data of their parent's `inheritable`
   */
  inheritable: BirchDecorationComposite
}

/**
 * NOTES FOR CONTRIBUTORS:
 * - A Target is a folder or a item entry
 * - A Target is a DirectTarget when it is explicitly listed in a BirchDecoration's application or negation list
 * - As opposed to DirectTarget, general targets are implicit targets when they simply inherit from their parent's inhertiable BirchDecorationComposite
 * - All general targets "point to" their first parent's `inheritable` composite see docs for `IBirchDecorationMeta.inheritable`
 */
export class BirchDecorationManager
  implements IDisposable, IBirchDecorationManager
{
  private decorations: Map<BirchDecoration, IDisposable> = new Map()

  private decorationsMeta: WeakMap<
    IBirchItem | IBirchFolder,
    IBirchDecorationMeta
  > = new WeakMap()

  private disposables: DisposablesComposite = new DisposablesComposite()

  private disposed: boolean = false

  constructor(root: IBirchRoot, public readonly viewId: string) {
    // if the object is actually IBirchRoot, but not of same version this condition will likely be true
    if (!(root instanceof BirchRoot)) {
      throw new TypeError(
        'BirchDecorationManager: Unexpected object type. Expected `BirchRoot`. Make sure you are using the latest version of `birch-decorations` to avoid conflicts'
      )
    }
    // this will act as "seed" (base) for rest of the decorations to come
    this.decorationsMeta.set(root, {
      applicable: new BirchDecorationComposite(
        root,
        EnumBirchDecorationCompositeType.Applicable,
        null
      ),
      inheritable: new BirchDecorationComposite(
        root,
        EnumBirchDecorationCompositeType.Inheritable,
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
   * Adds the given `BirchDecoration` to the tree
   *
   * `BirchDecoration`s have no effect unless they are targetted at item(s). Use `BirchDecoration#addTarget` to have them render in the filetree
   */
  public addDecoration(decoration: BirchDecoration): void {
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
   * Removes a `BirchDecoration` from the tree
   *
   * Note that this "removes" entire `BirchDecoration` from tree but the said `BirchDecoration`'s targets are still left intact.
   *
   * Calling `DecorationManager#addDecoration` with the same `BirchDecoration` will undo the removal if the targets are left unchanged.
   */
  public removeDecoration(decoration: BirchDecoration): void {
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
      if (meta && meta.applicable) {
        meta.applicable.unNegate(decoration)
      }
      if (meta && meta.inheritable) {
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
  public getDecorations(
    item: IBirchItem | IBirchFolder
  ): BirchDecorationClasslistComposite {
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
  public getDecorationData(
    item: IBirchItem | IBirchFolder
  ): IBirchDecorationMeta {
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
      const ownMeta: IBirchDecorationMeta = {
        applicable: new BirchDecorationComposite(
          item,
          EnumBirchDecorationCompositeType.Applicable,
          parentMeta.inheritable
        ),
        inheritable:
          item.type === EnumTreeItemType.Folder
            ? new BirchDecorationComposite(
                item,
                EnumBirchDecorationCompositeType.Inheritable,
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
    decoration: BirchDecoration,
    target: IBirchItem | IBirchFolder
  ): void => {
    const { applicable, inheritable } = this.getDecorationData(target)

    applicable.add(decoration)

    if (inheritable) {
      inheritable.add(decoration)
    }
  }

  private unTargetDecoration = (
    decoration: BirchDecoration,
    target: IBirchItem | IBirchFolder
  ): void => {
    const { applicable, inheritable } = this.getDecorationData(target)

    applicable.remove(decoration)

    if (inheritable) {
      inheritable.remove(decoration)
    }
  }

  private negateDecoration = (
    decoration: BirchDecoration,
    target: IBirchItem | IBirchFolder
  ): void => {
    const { applicable, inheritable } = this.getDecorationData(target)

    applicable.negate(decoration)

    if (inheritable) {
      inheritable.negate(decoration)
    }
  }

  private unNegateDecoration = (
    decoration: BirchDecoration,
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
