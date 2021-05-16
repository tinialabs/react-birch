import { IDisposable } from './IDisposable'
import { IPathFx } from './IPathFx'
import type { IBirchFolder } from './IBirchFolder'
import type { IBirchItem } from './IBirchItem'
import type { IBirchCoreHost } from './IBirchCoreHost'
import type { IBirchWatcherEvent } from './IBirchWatcher'

export interface IBirchRoot extends IBirchFolder {
  readonly host: IBirchCoreHost
  readonly viewId: string
  /**
   * Path utils like `join`, `basename`, `folderName` etc.
   *
   * Use utils from this object to ensure all operations are compliant with path style as specified by the host
   */
  readonly pathfx: IPathFx
  readonly expanded: boolean
  readonly path: string
  onDidChangeTreeData(
    cb: (item: IBirchItem | IBirchFolder) => void
  ): IDisposable
  onDidChangeFolderExpansionState(
    cb: (
      folder: IBirchFolder,
      nowExpanded: boolean,
      visibleAtSurface: boolean
    ) => void
  ): IDisposable
  onWillChangeFolderExpansionState(
    cb: (folder: IBirchFolder, nowExpanded: boolean) => void
  ): IDisposable
  onWillProcessWatchEvent(
    cb: (folder: IBirchFolder, event: IBirchWatcherEvent) => void
  ): IDisposable
  onDidProcessWatchEvent(
    cb: (folder: IBirchFolder, event: IBirchWatcherEvent) => void
  ): IDisposable
  onDidBranchUpdate(cb: () => void): IDisposable
  onWillDispose(cb: (target: IBirchItem | IBirchFolder) => void): IDisposable
  onDidDispose(cb: (target: IBirchItem | IBirchFolder) => void): IDisposable
  onDidChangeParent(
    callback: (
      target: IBirchItem | IBirchFolder,
      prevParent: IBirchFolder,
      newParent: IBirchFolder
    ) => void
  ): IDisposable
  onWillChangeParent(
    callback: (
      target: IBirchItem | IBirchFolder,
      prevParent: IBirchFolder,
      newParent: IBirchFolder
    ) => void
  ): IDisposable
  onDidChangePath(
    callback: (target: IBirchItem | IBirchFolder) => void
  ): IDisposable
  onOnceDisposed(
    target: IBirchItem | IBirchFolder,
    callback: (target: IBirchItem | IBirchFolder) => void
  ): IDisposable
  expandFolder(folder: IBirchFolder, ensureVisible?: boolean): Promise<void>
  collapseFolder(folder: IBirchFolder): void
  dispatch(event: IBirchWatcherEvent): void
  getIndexAtItemEntryID(id: number): number
  /**
   * Reverse of `BirchRoot#getItemEntryAtIndex`
   */
  getIndexAtItemEntry(itemEntry: IBirchItem | IBirchFolder): number
  /**
   * Lookup flattened tree structure by index
   *
   * `BirchRoot` manages the flattened structure, which is automatically adjusted whenever a child BirchFolder is expanded or collapsed
   *
   * Total number of items that "can" be visible at surface can be accessed by `BirchRoot#branchSize`
   *
   * Most windowing libraries will require you to specify item count, and upon rendering they will require data for an arbitrary index number
   *
   * Use `BirchRoot#branchSize` and `BirchRoot#getItemEntryAtIndex` respectively.
   *
   */
  getItemEntryAtIndex(index: number): IBirchItem
  /**
   * Looks up for given item or folder at path in the tree (pre-loaded tree only)
   *
   * This method, unlike `BirchRoot#forceLoadItemEntryAtPath`, WILL NOT, force load anything (synchronous for that reason)
   */
  findItemEntryInLoadedTree(path: string): IBirchItem | IBirchFolder
  /**
   * Brute force variant of `BirchRoot#findItemEntryInLoadedTree`.
   *
   * This method will force load children of `BirchFolder` if it comes in way of specified path. However, it will not affect visual state of tree.
   */
  forceLoadItemEntryAtPath(path: string): Promise<IBirchItem | IBirchFolder>
  /**
   * Checks if an item is visible at surface, as opposed to being buried in the tree.
   *
   * "Visible" here does not mean visible in the current view/scroll state of rendered content. Instead, it means the item "can" be visible if scolled to the right spot.
   *
   * "Buried" means that item may (or may not) be inside an expanded folder, but at least one of its parent folder is in collapsed state preventing it
   * from being "visible" at surface.
   */
  isItemVisibleAtSurface(item: IBirchItem | IBirchFolder): boolean
  setExpanded(ensureVisible?: boolean): Promise<void>
  setCollapsed(): void
  flushEventQueue(): Promise<unknown[]>
}
