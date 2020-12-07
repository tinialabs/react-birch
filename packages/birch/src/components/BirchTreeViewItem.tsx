import * as React from 'react'
import { useCallback, memo, useReducer } from 'react'

import {
  IBirchFolder,
  IBirchItem,
  EnumBirchItemType,
  ITreeViewItemRendererProps,
  IBirchContext,
  IPromptHandleNewItem,
  IPromptHandleRename
} from 'react-birch-types'

import { useDragDropChild } from './BirchUseDragDrop'
import { useContextMenuChild } from './BirchUseContextMenu'

export const renderBirchTreeViewItem = (
  birchContextRef: React.MutableRefObject<IBirchContext>,
  children
) => {
  const {
    getItemAtIndex,
    activeSelection: { activeItem, pseudoActiveItem },
    dragDrop: { dragged },
    options: {
      contributes: { itemMenus }
    }
  } = birchContextRef.current

  const renderItem = useCallback(
    ({ index, style }): JSX.Element => {
      const { item, itemType: type } = getItemAtIndex(index)

      return (
        <BirchTreeViewItem
          key={item.birchId}
          style={style}
          item={item}
          itemType={type}
          depth={item.depth}
          birchContextRef={birchContextRef}
          expanded={
            type === EnumBirchItemType.BirchFolder
              ? (item as IBirchFolder).expanded
              : false
          }
        >
          {children}
        </BirchTreeViewItem>
      )
    },
    [getItemAtIndex, itemMenus, activeItem, pseudoActiveItem, dragged]
  )

  return renderItem
}

interface BirchTreeViewItemProps {
  item: IBirchItem | IBirchFolder | IPromptHandleNewItem | IPromptHandleRename
  itemType: EnumBirchItemType
  depth: number
  expanded: boolean
  birchContextRef: React.MutableRefObject<IBirchContext>
  style: any
  children: React.FC<ITreeViewItemRendererProps>
}

const useForceUpdate = () => {
  const [, update] = useReducer((num: number): number => (num + 1) % 1000000, 0)
  return update as () => void
}

const BirchTreeViewItem = memo((props: BirchTreeViewItemProps) => {
  const lastItemPath = React.useRef<string>()

  const { item, itemType, style, children, birchContextRef } = props

  const {
    itemIdToRefMap,
    model,
    dragDrop: { dragAndDropService },
    contextMenu: { handleItemContextMenu },
    activeSelection: { handleItemClicked },
    options: {
      contributes: { itemMenus }
    }
  } = birchContextRef.current
  ;(item as IBirchItem).forceUpdate = useForceUpdate()

  const divRef = useCallback(
    (r: HTMLDivElement) => {
      if (r === null) {
        itemIdToRefMap.delete(item.birchId)
      } else {
        itemIdToRefMap.set(item.birchId, r)
      }
    },
    [item.birchId, itemIdToRefMap]
  )

  const [dragProps] = useDragDropChild({
    itemIdToRefMap,
    item,
    itemType,
    dragAndDropService: dragAndDropService.current
  })

  const { onContextMenu } = useContextMenuChild({
    item,
    itemType,
    handleItemContextMenu
  })

  React.useEffect(() => {
    const thisItem: IBirchItem =
      props.itemType === EnumBirchItemType.BirchItem ||
      props.itemType === EnumBirchItemType.BirchFolder
        ? (props.item as IBirchItem)
        : props.itemType === EnumBirchItemType.RenamePrompt
        ? (props.item as IPromptHandleRename).target
        : props.itemType === EnumBirchItemType.NewItemPrompt ||
          props.itemType === EnumBirchItemType.NewFolderPrompt
        ? (props.item as IPromptHandleNewItem).parent
        : null!

    if (thisItem && thisItem.path) {
      lastItemPath.current = thisItem.path
    } else {
      lastItemPath.current = null!
    }
  }, [item])

  return React.createElement(children, {
    ref: divRef,
    item,
    itemType,
    decorations: model.decorations.getDecorations(item as any),
    onClick: handleItemClicked,
    itemMenus,
    onContextMenu,
    style,
    ...(dragProps as any)
  })
})

export default renderBirchTreeViewItem
