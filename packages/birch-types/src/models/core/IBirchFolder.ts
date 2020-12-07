import { EnumTreeItemType } from '../../types'
import { IBirchItem } from './IBirchItem'

export interface IBirchFolder extends IBirchItem {
  readonly type: EnumTreeItemType.Folder
  readonly children: (IBirchItem | IBirchFolder)[]
  readonly expanded: boolean
  /**
   * Number of *visible* flattened leaves this branch is incharge of (recursive)
   *
   * When a folder is expanded, its entire branch (recursively flattened) is owned by a branch higher up (either BirchRoot (at surface) or a branch in collapsed state (buried))
   *
   * When a folder is collapsed, its entire branch (recursively flattened) is "returned" back to it by one of its parent higher up
   */
  readonly branchSize: number
  /**
   * Ensures the children of this `BirchFolder` are loaded (without effecting the `expanded` state)
   *
   * If children are already loaded, returned `Promise` resolves immediately
   *
   * Otherwise a hard reload request is issued and returned `Promise` resolves when that process finishes.
   *
   * tl;dr: `BirchFolder#children` are accessible once the returned `Promise` resolves
   */
  ensureLoaded(): Promise<void>
  setExpanded(ensureVisible?: boolean): Promise<void>
  setCollapsed(): void
  /**
   * Inserts the item into it's own parent (if not already)
   *
   * Gets called upon `IBirchWatcherAddEvent` or `IBirchWatcherMoveEvent`
   *
   * Calling this method directly WILL NOT trigger `onWillHandleWatchEvent` and `onDidHandleWatchEvent` events
   *
   * Prefer using `BirchRoot#dispatch` instead
   */
  insertItem(item: IBirchItem | IBirchFolder): void
  /**
   * Removes the item from parent
   *
   * Gets called upon `IBirchWatcherRemoveEvent` or `IBirchWatcherMoveEvent`
   *
   * Calling this method directly WILL NOT trigger `onWillHandleWatchEvent` and `onDidHandleWatchEvent` events
   *
   * Prefer using `BirchRoot#dispatch` instead
   */
  unlinkItem(item: IBirchItem | IBirchFolder, reparenting?: boolean): void
  mv(to: IBirchFolder, newName?: string): void
  /**
   * Looks up for given item or folder at tid in the tree (pre-loaded tree only)
   *
   * This method, unlike `BirchRoot#forceLoadItemEntryAtPath`, WILL NOT, force load anything (synchronous for that reason)
   */
  findItemEntryInLoadedTreeById(tid: string): IBirchItem | IBirchFolder
}

export default IBirchFolder
