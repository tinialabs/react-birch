import { EnumTreeItemType } from 'react-birch-types'
import type {
  IBirchTreeSupervisor,
  IBirchItem,
  IBirchRoot,
  IBirchFolder,
  ITreeItem
} from 'react-birch-types'

export class BirchItem implements IBirchItem {
  public static nextId: () => number = (() => {
    let globalBirchId = 0
    return () => globalBirchId++
  })()

  public static checkRawItem(rawItem: ITreeItem) {
    if (rawItem === null || typeof rawItem !== 'object') {
      throw new TypeError(
        `BirchItem must be ITreeItem object. See docs for more info`
      )
    }
    if (
      rawItem.type !== EnumTreeItemType.Folder &&
      rawItem.type !== EnumTreeItemType.Item
    ) {
      throw new TypeError(
        `ITreeItem must have a 'type' property which is either EnumTreeItemType.Item or EnumTreeItemType.Folder`
      )
    }
    if (typeof rawItem.label !== 'string') {
      throw new TypeError(
        `ITreeItem must have a 'label' property of type string`
      )
    }
  }

  public static getItemEntryById(birchId: number) {
    return BirchItem.idToItemEntry.get(birchId)
  }

  private static idToItemEntry: Map<number, BirchItem> = new Map()

  protected _birchId: number

  protected _depth: number

  protected _label: string

  protected _details: ITreeItem

  protected _superv: IBirchTreeSupervisor

  private _root: IBirchRoot

  protected _parent: IBirchFolder

  private _disposed: boolean

  private resolvedPathCache: string

  public forceUpdate: (resolver?: () => void) => void

  protected constructor(
    root: IBirchRoot,
    tree: IBirchTreeSupervisor,
    parent: IBirchFolder,
    label: string,
    details: ITreeItem
  ) {
    this._birchId = BirchItem.nextId()
    this._root = root || (this as any) // 'this' IS BirchRoot
    this._parent = parent
    this._superv = tree
    this._disposed = false
    this._depth = parent ? parent.depth + 1 : 0
    if (parent && typeof label === 'string') {
      label = root.pathfx.basename(label)
      this._label = label
    }
    this._details = details
    BirchItem.idToItemEntry.set(this._birchId, this)
  }

  get type(): EnumTreeItemType {
    return EnumTreeItemType.Item
  }

  /**
   * `disposed` status of this item
   *
   * Once an item is disposed, it's best to let go of all references to it to avoid any memory leaks
   */
  public get disposed() {
    return this._disposed
  }

  /**
   * Hierarchial depth of this item relative to the `BirchRoot`
   */
  get depth() {
    return this._depth
  }

  get root() {
    return this._root
  }

  get parent() {
    return this._parent
  }

  get birchId() {
    return this._birchId
  }

  get label() {
    return this._label
  }

  get iconPath() {
    return this._details.iconPath
  }

  get tid() {
    return this._details.tid
  }

  get details() {
    return this._details
  }

  /**
   * Full absolute path of this item
   */
  get path(): string {
    if (!this.parent) {
      throw new Error(
        `orphaned/detached FileEntries don't have path (except BirchRoot)`
      )
    }
    if (!this.resolvedPathCache) {
      this.resolvedPathCache = this.root.pathfx.join(
        this.parent.path,
        this.label
      )
    }
    return this.resolvedPathCache
  }

  /**
   * Very much like `unix`s `mv` command
   *
   * Calling this method directly WILL NOT trigger `onWillHandleWatchEvent` and `onDidHandleWatchEvent` events
   *
   * Prefer using `BirchRoot#dispatch` instead
   */
  public mv(to: IBirchFolder, fname: string = this.label) {
    const prevParent = this._parent
    if (to === null || to.type !== EnumTreeItemType.Folder) {
      this._parent = null
      prevParent.unlinkItem(this)
      this.dispose()
      return
    }
    const didChangeParent = prevParent !== to
    const prevPath = this.path

    this.resolvedPathCache = null
    this._depth = to.depth + 1

    if (
      didChangeParent ||
      fname !== this.label /* change in filename means change in sort order */
    ) {
      this._label = fname
      if (didChangeParent) {
        this._superv.notifyWillChangeParent(this, prevParent, to)
      }
      this._parent.unlinkItem(this, true)
      this._parent = to
      this._parent.insertItem(this)
      if (didChangeParent) {
        this._superv.notifyDidChangeParent(this, prevParent, to)
      }
    }

    if (this.path !== prevPath) {
      this._superv.notifyDidChangePath(this)
    }
  }

  protected async didChangeItem() {
    const newItem = await this.root.host.getTreeItem(this.details)
    this._label = newItem.label
  }

  protected dispose() {
    if (this._disposed) {
      return
    }
    this._superv.notifyWillDispose(this)
    this._disposed = true
    BirchItem.idToItemEntry.delete(this._birchId)
    this._superv.notifyDidDispose(this)
  }
}
