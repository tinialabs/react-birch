import type { ITreeItem } from './ITreeItem'

/**
 * Function that when called should terminate a watch session associated with a folder
 */
export type BirchWatchTerminatorType = (path?: string) => void

export type BirchWatcherCallbackType = (event: IBirchWatcherEvent) => void

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
