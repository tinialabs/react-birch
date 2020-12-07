import type { EventEmitter } from 'birch-event-emitter'
import type { ITreeDataProvider } from './ITreeDataProvider'
import type { ITreeItem } from '.'

type Disposer = () => void

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
export interface ITreeViewHandle<T> {
  readonly dataProvider: ITreeDataProvider<T>

  /**
   * Event that is fired when an element is expanded
   */
  onDidExpandElement(
    handler: (event: ITreeViewExpansionEvent) => void
  ): Disposer

  /**
   * Event that is fired when an element is collapsed
   */
  onDidCollapseElement(
    handler: (event: ITreeViewExpansionEvent) => void
  ): Disposer

  /**
   * Event that is fired when the [selection](#TreeViewHandle.selection) has changed
   */
  onDidChangeSelection(
    handler: (event: ITreeViewSelectionChangeEvent) => void
  ): Disposer

  /**
   * Event that is fired when [visibility](#TreeViewHandle.visible) has changed
   */
  onDidChangeVisibility(
    handler: (event: ITreeViewVisibilityChangeEvent) => void
  ): Disposer

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

  events?: EventEmitter<EnumTreeViewEventType>
}

export enum EnumTreeViewEventType {
  didExpand = 1,
  didCollapse,
  didChangeSelection,
  didChangeVisibility
}
