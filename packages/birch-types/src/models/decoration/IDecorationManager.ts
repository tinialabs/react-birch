import { IDisposable } from 'birch-event-emitter'
import { IBirchFolder, IBirchItem } from '..'
import { IDecoration } from './IDecoration'
import { IClasslistComposite } from './IDecorationComposite'
/**
 * NOTES FOR CONTRIBUTORS:
 * - A Target is a folder or a item entry
 * - A Target is a DirectTarget when it is explicitly listed in a IDecoration's application or negation list
 * - As opposed to DirectTarget, general targets are implicit targets when they simply inherit from their parent's inhertiable DecorationComposite
 * - All general targets "point to" their first parent's `inheritable` composite see docs for `IDecorationMeta.inheritable`
 */
export interface IDecorationsManager extends IDisposable {
  readonly viewId: string
  /**
   * Permanently disengages the decoration system from the tree
   */
  dispose(): void
  /**
   * Adds the given `IDecoration` to the tree
   *
   * `IDecoration`s have no effect unless they are targetted at item(s). Use `IDecoration#addTarget` to have them render in the filetree
   */
  addDecoration(decoration: IDecoration): void
  /**
   * Removes a `IDecoration` from the tree
   *
   * Note that this "removes" entire `IDecoration` from tree but the said `IDecoration`'s targets are still left intact.
   *
   * Calling `DecorationManager#addDecoration` with the same `IDecoration` will undo the removal if the targets are left unchanged.
   */
  removeDecoration(decoration: IDecoration): void
  /**
   * Returns resolved decorations for given item
   *
   * Resolution includes taking inheritances into consideration, along with any negations that may void some or all of inheritances
   */
  getDecorations(item: IBirchItem | IBirchFolder): IClasslistComposite
}
