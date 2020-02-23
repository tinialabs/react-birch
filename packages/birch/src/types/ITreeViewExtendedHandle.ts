import { IDisposable, EventEmitter } from 'birch-event-emitter'
import { Align } from 'react-window'
import { TreeViewModel, BirchItem, BirchFolder } from '../models'
import { ITreeItem } from './ITreeItem'

// Here imagination is your limit! ITreeViewExtendedHandle has core low-level features you can build on top of as your application needs
export interface ITreeViewExtendedHandle {
  id: number

  /**
   * Returns the current `TreeModel` this `ItemTree` is attached to
   */
  getModel(): TreeViewModel

  /**
   * Opens/Expands a folder
   * Expands the folders in the way if needed.
   * BirchFolder remains expanded indefinitely, until closeFolder is called
   */
  openFolder(path: string): Promise<void>
  openFolder(folder: BirchFolder): Promise<void>

  /**
   * Closes/Collapses a folder if open
   */
  closeFolder(path: string): void
  closeFolder(folder: BirchFolder): void

  /**
   * Toggles Opens/Expands or Closes/Collapses a folder if open
   */
  toggleFolder(path: string): void
  toggleFolder(folder: BirchFolder): void

  /**
   * Will make its way and scroll to the specified item or path.
   * It'll expand the folders on the way to item if necessary and this operation will leave the tree state thus expanded
   *
   * If you just need the handle to item without altering scroll state, then use `getItemHandle` instead.
   *
   */
  ensureVisible(path: string, align?: Align): Promise<void>
  ensureVisible(itemEntry: BirchItem, align?: Align): Promise<void>
  ensureVisible(folder: BirchFolder, align?: Align): Promise<void>

  /**
   * Returns handle to BirchItem at given path
   *
   * By default this method will expand the folders leading to said item (if not already), but will not alter scroll state of tree (unlike `ensureVisible`)
   * If you wish to just get the handle and not expand any folder on the way, pass `false` as second argument
   */
  getItemHandle(
    path: string,
    expandTree?: boolean
  ): Promise<BirchItem | BirchFolder>

  // EVENTS //
  onDidChangeModel(
    callback: (prevModel: TreeViewModel, newModel: TreeViewModel) => void
  ): IDisposable
  onceDidChangeModel(
    callback: (prevModel: TreeViewModel, newModel: TreeViewModel) => void
  ): IDisposable

  onDidUpdate(callback: () => void): IDisposable
  onceDidUpdate(callback: () => void): IDisposable

  getActiveItem(): BirchItem | BirchFolder
  setActiveItem(path: string)
  setActiveItem(item: BirchItem)
  setActiveItem(dir: BirchFolder)

  getPseudoActiveItem(): BirchItem | BirchFolder
  setPseudoActiveItem(path: string)
  setPseudoActiveItem(item: BirchItem)
  setPseudoActiveItem(dir: BirchFolder)

  rename(path: string)
  rename(item: BirchItem)
  rename(dir: BirchFolder)

  newItem(dirpath: string, iconPath?: string)
  newItem(dir: BirchFolder, iconPath?: string)
  newFolder(dirpath: string)
  newFolder(dir: BirchFolder)

  createdItem: (item: ITreeItem, parentDir: BirchFolder) => Promise<void>

  unlinkItem(dirpath: string)
  unlinkItem(dir: BirchFolder)
  unlinkItem(item: BirchItem)

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
  onDidChangeSelection(callback: (selection: BirchItem) => void): IDisposable

  events: EventEmitter<EnumTreeViewExtendedEvent>
}

export enum EnumTreeViewExtendedEvent {
  DidChangeModel = 1,
  DidUpdate,
  OnBlur,
  OnDidChangeSelection
}
