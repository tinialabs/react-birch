import { ITreeItem, EnumTreeItemType } from './ITreeItem'
import { IBirchFolder } from './IBirchFolder'
import { IBirchRoot } from './IBirchRoot'

export interface IBirchItem {
  forceUpdate: (resolver?: () => void) => void
  readonly type: EnumTreeItemType
  /**
   * `disposed` status of this item
   *
   * Once an item is disposed, it's best to let go of all references to it to avoid any memory leaks
   */
  readonly disposed: boolean
  /**
   * Hierarchial depth of this item relative to the `BirchRoot`
   */
  readonly depth: number
  readonly root: IBirchRoot
  readonly parent: IBirchFolder
  readonly birchId: number
  readonly label: string
  readonly iconPath: string
  readonly tid: string
  readonly details: ITreeItem
  /**
   * Full absolute path of this item
   */
  readonly path: string
  /**
   * Very much like `unix`s `mv` command
   *
   * Calling this method directly WILL NOT trigger `onWillHandleWatchEvent` and `onDidHandleWatchEvent` events
   *
   * Prefer using `BirchRoot#dispatch` instead
   */
  mv(to: IBirchFolder, fname?: string): void
}
