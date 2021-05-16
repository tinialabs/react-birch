import { IBirchFolder } from './IBirchFolder'
import { IBirchItem } from './IBirchItem'
import { EnumTreeViewEventType } from './IBirchTreeViewEnum'
import { IBirchTreeViewModel } from './IBirchTreeViewModel'
import { IDisposable } from './IDisposable'
import { IEventEmitter } from './IEventEmitter'
import { ITreeDataProvider } from './ITreeDataProvider'
import { ITreeItem } from './ITreeItem'

/** Align from react-window */
export type Align = 'auto' | 'smart' | 'center' | 'end' | 'start'

/**
 * The event that is fired when an element in the [TreeViewHandle](#TreeViewHandle) is expanded or collapsed
 */
export interface ITreeViewExpansionEvent {
  /**
   * Element that is expanded or collapsed.
   */
  readonly element: ITreeItem
}

/**
 * The event that is fired when there is a change in [tree view's selection](#TreeViewHandle.selection)
 */
export interface ITreeViewSelectionChangeEvent {
  /**
   * Selected elements.
   */
  readonly selection: ITreeItem[]
}

/**
 * The event that is fired when there is a change in [tree view's visibility](#TreeViewHandle.visible)
 */
export interface ITreeViewVisibilityChangeEvent {
  /**
   * `true` if the [tree view](#TreeViewHandle) is visible otherwise `false`.
   */
  readonly visible: boolean
}

/**
 * Represents a Tree view
 */
export interface IBirchTreeViewHandle {
  readonly dataProvider: ITreeDataProvider

  /**
   * Event that is fired when an element is expanded
   */
  onDidExpandElement(
    handler: (event: ITreeViewExpansionEvent) => void
  ): IDisposable

  /**
   * Event that is fired when an element is collapsed
   */
  onDidCollapseElement(
    handler: (event: ITreeViewExpansionEvent) => void
  ): IDisposable

  /**
   * Event that is fired when the [selection](#TreeViewHandle.selection) has changed
   */
  onDidChangeSelection(callback: (selection: IBirchItem) => void): IDisposable

  /**
   * Event that is fired when [visibility](#TreeViewHandle.visible) has changed
   */
  onDidChangeVisibility(
    handler: (event: ITreeViewVisibilityChangeEvent) => void
  ): IDisposable

  /**
   * Currently selected elements.
   */
  readonly selection: ITreeItem[]

  /**
   * `true` if the [tree view](#TreeViewHandle) is visible otherwise `false`.
   */
  readonly visible: boolean

  /**
   * Reveals the given element in the tree view.
   * If the tree view is not visible then the tree view is shown and element is revealed.
   *
   * By default revealed element is selected.
   * In order to not to select, set the option `select` to `false`.
   * In order to focus, set the option `focus` to `true`.
   * In order to expand the revealed element, set the option `expand` to `true`. To expand recursively set `expand` to the number of levels to expand.
   * **NOTE:** You can expand only to 3 levels maximum.
   *
   * **NOTE:** [TreeDataProvider](#TreeDataProvider) is required to implement [getParent](#TreeDataProvider.getParent) method to access this API.
   */
  reveal(
    element: ITreeItem,
    options?: { select?: boolean; focus?: boolean; expand?: boolean | number }
  ): Promise<void>

  dispose(): void

  events: IEventEmitter<EnumTreeViewEventType>
}

// Here imagination is your limit! IBirchTreeViewHandleExtended has core low-level features you can build on top of as your application needs
export interface IBirchTreeViewHandleExtended {
  id: number

  /**
   * Returns the current `TreeModel` this `ItemTree` is attached to
   */
  getModel(): IBirchTreeViewModel

  /**
   * Opens/Expands a folder
   * Expands the folders in the way if needed.
   * BirchFolder remains expanded indefinitely, until closeFolder is called
   */
  openFolder(path: string): Promise<void>
  openFolder(folder: IBirchFolder): Promise<void>

  /**
   * Closes/Collapses a folder if open
   */
  closeFolder(path: string): void
  closeFolder(folder: IBirchFolder): void

  /**
   * Toggles Opens/Expands or Closes/Collapses a folder if open
   */
  toggleFolder(path: string): void
  toggleFolder(folder: IBirchFolder): void

  /**
   * Will make its way and scroll to the specified item or path.
   * It'll expand the folders on the way to item if necessary and this operation will leave the tree state thus expanded
   *
   * If you just need the handle to item without altering scroll state, then use `getBirchItemOrFolder` instead.
   *
   */
  ensureVisible(path: string, align?: Align): Promise<void>
  ensureVisible(itemEntry: IBirchItem, align?: Align): Promise<void>
  ensureVisible(folder: IBirchFolder, align?: Align): Promise<void>

  /**
   * Returns handle to BirchItem at given path
   *
   * By default this method will expand the folders leading to said item (if not already), but will not alter scroll state of tree (unlike `ensureVisible`)
   * If you wish to just get the handle and not expand any folder on the way, pass `false` as second argument
   */
  getBirchItemOrFolder(
    path: string,
    expandTree?: boolean
  ): Promise<IBirchItem | IBirchFolder>

  // EVENTS //
  onDidChangeModel(
    callback: (
      prevModel: IBirchTreeViewModel,
      newModel: IBirchTreeViewModel
    ) => void
  ): IDisposable
  onceDidChangeModel(
    callback: (
      prevModel: IBirchTreeViewModel,
      newModel: IBirchTreeViewModel
    ) => void
  ): IDisposable

  onDidUpdate(callback: () => void): IDisposable
  onceDidUpdate(callback: () => void): IDisposable

  getActiveItem(): IBirchItem | IBirchFolder
  setActiveItem(path: string)
  setActiveItem(item: IBirchItem)
  setActiveItem(folder: IBirchFolder)

  getPseudoActiveItem(): IBirchItem | IBirchFolder
  setPseudoActiveItem(path: string)
  setPseudoActiveItem(item: IBirchItem)
  setPseudoActiveItem(folder: IBirchFolder)

  rename(path: string)
  rename(item: IBirchItem)
  rename(folder: IBirchFolder)

  newItem(folderpath: string, iconPath?: string)
  newItem(folder: IBirchFolder, iconPath?: string)
  newFolder(folderpath: string)
  newFolder(folder: IBirchFolder)

  createdItem: (item: ITreeItem, parentDir: IBirchFolder) => Promise<void>

  unlinkItem(folderpath: string)
  unlinkItem(folder: IBirchFolder)
  unlinkItem(item: IBirchItem)

  collapseAll(): void

  /**
   * If document.activeElement === filetree wrapper element
   */
  hasDirectFocus(): boolean

  // events
  onBlur(callback: () => void): IDisposable

  /**
   * Event that is fired when the [selection](#BirchTreeView.selection) has changed
   */
  onDidChangeSelection(callback: (selection: IBirchItem) => void): IDisposable

  events: IEventEmitter<EnumTreeViewEventType>
}
