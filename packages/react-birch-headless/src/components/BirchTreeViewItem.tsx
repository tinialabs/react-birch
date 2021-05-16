import * as React from 'react'
import { useCallback, memo } from 'react'

import {
  IBirchFolder,
  IBirchItem,
  EnumTreeItemTypeExtended,
  IBirchItemRendererWrapProps,
  IBirchContext,
  IBirchNewItemPromptHandle,
  IBirchRenamePromptHandle
} from 'react-birch-types'

import { useForceUpdate } from '../hooks'
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
      if (!item) {
        console.log(`${index} not found`)
        return null
      }
      return (
        <BirchTreeViewItem
          key={item.birchId}
          style={style}
          item={item}
          itemType={type}
          depth={item.depth}
          birchContextRef={birchContextRef}
          expanded={
            type === EnumTreeItemTypeExtended.Folder
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
  item:
    | IBirchItem
    | IBirchFolder
    | IBirchNewItemPromptHandle
    | IBirchRenamePromptHandle
  itemType: EnumTreeItemTypeExtended
  depth: number
  expanded: boolean
  birchContextRef: React.MutableRefObject<IBirchContext>
  style: any
  children: React.FC<IBirchItemRendererWrapProps>
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
      props.itemType === EnumTreeItemTypeExtended.Item ||
      props.itemType === EnumTreeItemTypeExtended.Folder
        ? (props.item as IBirchItem)
        : props.itemType === EnumTreeItemTypeExtended.RenamePrompt
        ? (props.item as IBirchRenamePromptHandle).target
        : props.itemType === EnumTreeItemTypeExtended.NewItemPrompt ||
          props.itemType === EnumTreeItemTypeExtended.NewFolderPrompt
        ? (props.item as IBirchNewItemPromptHandle).parent
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
