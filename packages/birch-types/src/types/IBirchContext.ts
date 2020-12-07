import * as React from 'react'
import { DisposablesComposite, EventEmitter } from 'birch-event-emitter'

import {
  ITreeViewModel,
  IBirchItem,
  IBirchFolder,
  IPromptHandleNewItem,
  IPromptHandleRename
} from '../models'

import { IDecoration } from '../models/decoration'
import {
  IBirchTreeItemProps,
  ITreeViewExtendedHandle,
  ITreeViewHandle,
  EnumBirchItemType,
  ITreeViewOptions
} from '.'

export interface IBirchContext {
  viewId: string
  options: ITreeViewOptions<any>
  disposables: DisposablesComposite
  forceUpdate: (resolver?: any) => void
  treeViewHandleExtended: React.MutableRefObject<ITreeViewExtendedHandle>
  treeViewHandleSimple: ITreeViewHandle<{}>
  idxTorendererPropsCache: Map<number, IBirchTreeItemProps>
  events: EventEmitter<{}>
  listRef: React.MutableRefObject<any>
  wrapperRef: React.MutableRefObject<HTMLDivElement>
  model: ITreeViewModel
  itemIdToRefMap: Map<number, HTMLDivElement>
  didUpdate: () => void
  getItemAtIndex: (index: number) => IBirchTreeItemProps
  commitDebounce: () => Promise<void>
  adjustedRowCount: number

  prompts: {
    promptRename: (
      pathOrItemEntry: string | IBirchItem
    ) => Promise<IPromptHandleRename>
    promptNewFolder: (
      pathOrFolder: string | IBirchFolder
    ) => Promise<IPromptHandleNewItem>
    promptNewItem: (
      pathOrFolder: string | IBirchFolder,
      iconPath: string
    ) => Promise<IPromptHandleNewItem>
    supervisePrompt: (
      promptHandle: IPromptHandleNewItem | IPromptHandleRename
    ) => void
  }

  decorations: {
    activeItemDecoration: IDecoration
    pseudoActiveItemDecoration: IDecoration
  }

  activeSelection: {
    handleItemClicked: (
      ev: React.MouseEvent<Element, MouseEvent>,
      item: IBirchItem | IBirchFolder,
      type: EnumBirchItemType
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
