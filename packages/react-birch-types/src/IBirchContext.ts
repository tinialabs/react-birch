import * as React from 'react'
import { IDisposablesComposite } from './IDisposable'
import { IEventEmitter } from './IEventEmitter'
import {
  IBirchTreeViewModel,
  IBirchItem,
  IBirchFolder,
  IBirchNewItemPromptHandle,
  IBirchRenamePromptHandle,
  IBirchDecoration,
  IBirchItemProps,
  IBirchTreeViewHandleExtended,
  IBirchTreeViewHandle,
  EnumTreeItemTypeExtended,
  ITreeViewOptions
} from '.'

export interface IBirchContext {
  viewId: string
  options: ITreeViewOptions
  disposables: IDisposablesComposite
  forceUpdate: (resolver?: () => void) => void
  treeViewHandleExtended: React.MutableRefObject<IBirchTreeViewHandleExtended>
  treeViewHandleSimple: IBirchTreeViewHandle
  idxTorendererPropsCache: Map<number, IBirchItemProps>
  events: IEventEmitter<{}>
  listRef: React.MutableRefObject<any>
  wrapperRef: React.MutableRefObject<HTMLDivElement>
  model: IBirchTreeViewModel
  itemIdToRefMap: Map<number, HTMLDivElement>
  didUpdate: () => void
  getItemAtIndex: (index: number) => IBirchItemProps
  commitDebounce: () => Promise<void>
  adjustedRowCount: number

  prompts: {
    promptRename: (
      pathOrItemEntry: string | IBirchItem
    ) => Promise<IBirchRenamePromptHandle>
    promptNewFolder: (
      pathOrFolder: string | IBirchFolder
    ) => Promise<IBirchNewItemPromptHandle>
    promptNewItem: (
      pathOrFolder: string | IBirchFolder,
      iconPath: string
    ) => Promise<IBirchNewItemPromptHandle>
    supervisePrompt: (
      promptHandle: IBirchNewItemPromptHandle | IBirchRenamePromptHandle
    ) => void
  }

  decorations: {
    activeItemDecoration: IBirchDecoration
    pseudoActiveItemDecoration: IBirchDecoration
  }

  activeSelection: {
    handleItemClicked: (
      ev: React.MouseEvent<Element, MouseEvent>,
      item: IBirchItem | IBirchFolder,
      type: EnumTreeItemTypeExtended
    ) => void
    activeItem: IBirchItem | IBirchFolder
    pseudoActiveItem: IBirchItem | IBirchFolder
    updateActiveItem: (
      fileOrDirOrPath: string | IBirchItem | IBirchFolder
    ) => Promise<void>
    updatePseudoActiveItem: (
      fileOrDirOrPath: string | IBirchItem | IBirchFolder
    ) => Promise<void>
    handleKeyDown: (ev: React.KeyboardEvent<Element>) => boolean
    selectionProps: {
      onKeyDown: (ev: React.KeyboardEvent<Element>) => boolean
      onBlur: () => void
      onClick: (ev: React.MouseEvent<Element, MouseEvent>) => void
    }
  }

  contextMenu: {
    handleContextMenu: (ev: React.MouseEvent<Element, MouseEvent>) => void
    handleItemContextMenu: (
      ev: React.MouseEvent<Element, MouseEvent>,
      item: IBirchItem | IBirchFolder
    ) => void
  }

  dragDrop: {
    dragAndDropService: React.MutableRefObject<any>
    dragged: boolean
  }

  treeItemView: {
    renderer: any
  }
}
