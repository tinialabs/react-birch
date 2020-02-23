import { ITreeItem, EnumTreeItemType } from '.'

type Disposer = () => void

export type ProviderResult<T> =
  | T
  | undefined
  | null
  | Promise<T | undefined | null>

/**
 * A data provider that provides tree data
 */
export interface ITreeDataProvider<T> {
  id: number

  /**
   * Get the children of `element` or root if no element is passed.
   *
   * @param element The element from which the provider gets children. Can be `undefined`.
   * @return Children of `element` or root if no element is passed.
   */
  getChildren(element: T): ProviderResult<T[]>

  /**
   * Get [ITreeItem](#ITreeItem) representation of the `element`
   *
   * @param element The element for which [ITreeItem](#ITreeItem) representation is asked for.
   * @return [ITreeItem](#ITreeItem) representation of the element
   */
  getTreeItem(element: T): ITreeItem | Promise<ITreeItem>

  /**
   * An optional event to signal that an element or root has changed.
   * This will trigger the view to update the changed element/root and its children recursively (if shown).
   * To signal that root has changed, do not pass any argument or pass `undefined` or `null`.
   */
  onDidChangeTreeData(handler: (event: T | undefined | null) => void): Disposer

  /**
   * Optional method to return the parent of `element`.
   * Return `null` or `undefined` if `element` is a child of root.
   *
   * **NOTE:** This method should be implemented in order to access [reveal](#TreeViewHandle.reveal) API.
   *
   * @param element The element for which the parent has to be returned.
   * @return Parent of `element`.
   */
  getParent?(element: ITreeItem): ProviderResult<ITreeItem>

  /**
   * Optional method to create a new `element`.
   * Return `elemeent` or `undefined` if `element` is a child of root.
   *
   * @param label The label of the new element
   * @param pathToNewObject The path of the new element
   * @param itemType create an Item or Folder
   * @param content optional content to create
   * @return `element`.
   */
  createItem?(
    parent: ITreeItem,
    label: string,
    pathToNewObject: string,
    itemType: EnumTreeItemType,
    content?: string
  ): Promise<ITreeItem>

  /**
   * Optional method to move selected `element` in drag and drop and renames
   * Return true if allowed, false if cancel
   *
   * @param oldPath The old element
   * @param newPath The new element
   * @return `element`.
   */
  moveItem?(
    item: ITreeItem,
    newParent: ITreeItem,
    newPath: string
  ): Promise<boolean>

  /**
   * Optional method to delete selected `element` in trashcan button presses
   * Return true if allowed, false if cancel
   *
   * @param oldPath The old element
   * @return `element`.
   */
  deleteItem?(item: ITreeItem): Promise<boolean>

  /**
   * Optional method to be notified of watch requests
   * Return single function that terminates watches based on path passed
   *
   * @param oldPath The old element
   * @param newPath The new element
   * @return `element`.
   */
  watch?(path: string): (terminatePath: string) => void

  /**
   * Sorting comparator Folders should use when:
   *  - TreeFolder is expanded for first time
   *  - `BirchRoot#forceLoadItemEntryAtPath` is called and the target exists in a `TreeFolder` that was not expanded previously (thus triggering a hard reload)
   *  - On `EnumBirchWatchEvent.Moved`, `EnumBirchWatchEvent.Added` and `EnumBirchWatchEvent.Changed` (but not on `EnumBirchWatchEvent.Removed`)
   *
   * REMINDER: Avoid using `instanceof` when checking if an item is `TreeFolder` or `ITreeItem`. `instanceof` is computationally expensive and not required for this purpose.
   * Use `item.type === EnumTreeItemType.ITreeItem` to check if item is `ITreeItem` and `item.type === EnumTreeItemType.TreeFolder` to check for `TreeFolder`
   */
  sortComparator?: (a: ITreeItem, b: ITreeItem) => number | Promise<number>
}
