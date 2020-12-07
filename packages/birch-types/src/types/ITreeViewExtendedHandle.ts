import type { IDisposable, EventEmitter } from 'birch-event-emitter'
import type { Align } from 'react-window'
import { ITreeViewModel, IBirchItem, IBirchFolder } from '../models'
import type { ITreeItem } from './ITreeItem'

// Here imagination is your limit! ITreeViewExtendedHandle has core low-level features you can build on top of as your application needs
export interface ITreeViewExtendedHandle {
  id: number

  /**
   * Returns the current `TreeModel` this `ItemTree` is attached to
   */
  getModel(): ITreeViewModel

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
   * If you just need the handle to item without altering scroll state, then use `getItemHandle` instead.
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
  getItemHandle(
    path: string,
    expandTree?: boolean
  ): Promise<IBirchItem | IBirchFolder>

  // EVENTS //
  onDidChangeModel(
    callback: (prevModel: ITreeViewModel, newModel: ITreeViewModel) => void
  ): IDisposable
  onceDidChangeModel(
    callback: (prevModel: ITreeViewModel, newModel: ITreeViewModel) => void
  ): IDisposable

  onDidUpdate(callback: () => void): IDisposable
  onceDidUpdate(callback: () => void): IDisposable

  getActiveItem(): IBirchItem | IBirchFolder
  setActiveItem(path: string)
  setActiveItem(item: IBirchItem)
  setActiveItem(dir: IBirchFolder)

  getPseudoActiveItem(): IBirchItem | IBirchFolder
  setPseudoActiveItem(path: string)
  setPseudoActiveItem(item: IBirchItem)
  setPseudoActiveItem(dir: IBirchFolder)

  rename(path: string)
  rename(item: IBirchItem)
  rename(dir: IBirchFolder)

  newItem(dirpath: string, iconPath?: string)
  newItem(dir: IBirchFolder, iconPath?: string)
  newFolder(dirpath: string)
  newFolder(dir: IBirchFolder)

  createdItem: (item: ITreeItem, parentDir: IBirchFolder) => Promise<void>

  unlinkItem(dirpath: string)
  unlinkItem(dir: IBirchFolder)
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

  events: EventEmitter<EnumTreeViewExtendedEvent>
}

export enum EnumTreeViewExtendedEvent {
  DidChangeModel = 1,
  DidUpdate,
  OnBlur,
  OnDidChangeSelection
}
