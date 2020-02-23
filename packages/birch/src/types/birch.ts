import { BirchFolder } from '../models/core/BirchFolder'
import { BirchItem } from '../models/core/BirchItem'
import { ITreeItem } from './ITreeItem'
import { ITreeDataProvider } from './ITreeDataProvider'

export enum BirchTreeEvent {
  WillChangeExpansionState = 1,
  DidChangeExpansionState,
  WillChangeParent,
  DidChangeParent,
  WillDispose,
  DidDispose,
  BranchDidUpdate,
  DidChangePath,
  DidProcessWatchEvent,
  WillProcessWatchEvent,
  DidChangeTreeData
}

/**
 * Every `BirchRoot` has one `TreeSupervisor` created at the very moment a `BirchRoot` is created
 *
 * It exists to facilitate event delegation for events originiating somewhere down in the tree and other bunch of shared stuff (shared in the tree, but unique to each `BirchRoot`)
 */
export interface IBirchTreeSupervisor {
  // Helpers //
  supervisedWatch(path: string, callback: BirchWatcherCallback)

  // Event delegations //

  notifyDidChangeTreeData(target: BirchItem | BirchFolder)

  notifyWillChangeParent(
    target: BirchItem | BirchFolder,
    prevParent: BirchFolder,
    newParent: BirchFolder
  )
  notifyDidChangeParent(
    target: BirchItem | BirchFolder,
    prevParent: BirchFolder,
    newParent: BirchFolder
  )

  notifyWillDispose(target: BirchItem | BirchFolder)
  notifyDidDispose(target: BirchItem | BirchFolder)

  notifyWillProcessWatchEvent(target: BirchFolder, event: IBirchWatcherEvent)
  notifyDidProcessWatchEvent(target: BirchFolder, event: IBirchWatcherEvent)

  notifyWillChangeExpansionState(target: BirchFolder, nowExpanded: boolean)
  notifyDidChangeExpansionState(target: BirchFolder, nowExpanded: boolean)

  notifyDidChangePath(target: BirchItem | BirchFolder)
}

/**
 * Function that when called should terminate a watch session associated with a folder
 */
export type BirchWatchTerminator = (path?: string) => void

export interface IBirchCoreHost<T> extends ITreeDataProvider<T> {
  /**
   * Path style `birch` should stick to for the duration of its existence
   *
   * Valid values are `win32` or `unix`. Invalid value will implicitly mean `unix`.
   *
   * Once `BirchRoot` is set up, almost all of the common path utils can be accessed through `BirchRoot#pathfx` object. Utils in this object are 100% compliant with specified `pathStyle`
   *
   * Notes:
   *  - `win32` paths are separated by backslash (`\`) as well as forward slash (`/`), but if `birch` needs to merge paths, it'll only use `\` for that purpose
   *  - `unix` paths are separated ONLY by forward slash (`/`). Backslashes (`\`) in `unix` paths become part of the filename.
   */
  readonly pathStyle: 'win32' | 'unix'

  /**
   * BirchItem watching
   *
   * This method will be called whenever a BirchFolder loads its contents to let the host know that birch will be expecting notifications if any items(s) get added/removed/moved
   *
   * Host and UI can stay in a perfect sync if host is good at notifying birch about any changes.
   *
   * Hereafter, use `BirchRoot#dispatch` to dispatch the events (dispatch a properly formatted `IBirchWatcherEvent` and `BirchRoot` will take care of the rest)
   *
   * `watch` must return a function that `birch` can call to terminate a watch session when it's no longer needed. The returned function will be called with the same path
   * which was used to start the watch in first place.
   *
   * *It is recommended that instead of returning a new function reference everytime, all calls to `watch` should return same function for each watch. That one function can
   * take the path parameter and terminate the associated watcher accordingly.*
   *
   */
  watch?: (path: string) => BirchWatchTerminator
}

export type BirchWatcherCallback = (event: IBirchWatcherEvent) => void

export type IBirchWatcherEvent =
  | IBirchWatcherChangeEvent
  | IBirchWatcherAddEvent
  | IBirchWatcherRemoveEvent
  | IBirchWatcherMoveEvent
  | IBirchWatcheronDidChangeTreeDataEvent

export enum EnumBirchWatchEvent {
  Added = 1,

  Removed,

  /**
   * Avoid dispatching this at all costs!!
   *
   * This event will cause a HARD reset on the folder it is dispatched at
   */
  Changed,

  /**
   * Represents a move event
   *
   * `EnumBirchWatchEvent.Moved` is also used to represent rename events. Example, `'${folderName}/${oldName}'` = `oldPath` and similarly, `'${folderName}/${newName}'` = `newPath`
   */
  Moved,

  /**
   * API triggered change to Item or Folder
   */
  DidChangeTreeData
}

/**
 * Avoid dispatching this at all costs
 *
 * Expansion state of sub-folders WILL NOT be preserved since it's a hard reset at target level
 *
 */
export interface IBirchWatcherChangeEvent {
  type: EnumBirchWatchEvent.Changed

  /**
   * Unique identifier of the item that changed
   */
  tid: string

  /**
   * Path to folder that changed
   */
  folder: string
}

/**
 * API driven tree state change
 *
 * Can be simple name change or change to childrem
 */
export interface IBirchWatcheronDidChangeTreeDataEvent {
  type: EnumBirchWatchEvent.DidChangeTreeData

  /**
   * Item that changed
   */
  item: ITreeItem
}

export interface IBirchWatcherAddEvent {
  type: EnumBirchWatchEvent.Added
  /**
   * Path to folder that will parent new item
   */
  folder: string
  /**
   * Describe the item
   */
  item: ITreeItem
}

export interface IBirchWatcherRemoveEvent {
  type: EnumBirchWatchEvent.Removed

  /**
   * Unique identifier of the item that is no longer existent
   */
  tid: string

  /**
   * Path to item that is no longer existent
   */
  path: string
}

export interface IBirchWatcherMoveEvent {
  type: EnumBirchWatchEvent.Moved

  /**
   * Unique identifier of the item that moved
   */
  tid: string

  /**
   * Old (absolute) path of item/folder
   */
  oldPath: string

  /**
   * New (absolute) path of item/folder
   */
  newPath: string
}
