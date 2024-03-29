import * as React from 'react'
import { useCallback } from 'react'

import { EnumTreeItemTypeExtended } from 'react-birch-types'
import { useContextMenu } from '../services'
import type { IBirchContext, IBirchItem, IBirchFolder } from 'react-birch-types'

export const useContextMenuContainer = (
  birchContextRef: React.MutableRefObject<IBirchContext>
) => {
  const [showContextMenu] = useContextMenu()

  const getBoundingClientRectForItem = useCallback(
    (item: IBirchItem | IBirchFolder) => {
      const { itemIdToRefMap } = birchContextRef.current

      const divRef = itemIdToRefMap.get(item.birchId)
      if (divRef) {
        return divRef.getBoundingClientRect()
      }
      return null
    },
    []
  )

  const handleContextMenu = useCallback((ev: React.MouseEvent) => {
    const {
      treeViewHandleExtended,
      model,
      activeSelection: { pseudoActiveItem, activeItem },
      options: {
        contributes: { contextMenus }
      }
    } = birchContextRef.current

    let target: IBirchItem | IBirchFolder

    // capture ctx menu triggered through context menu button on keyboard
    if (ev.nativeEvent.which === 0) {
      target = pseudoActiveItem || activeItem
      if (target) {
        const rect = getBoundingClientRectForItem(target)
        if (rect) {
          return showContextMenu(
            ev,
            contextMenus,
            treeViewHandleExtended.current,
            target,
            { x: rect.left + rect.width, y: rect.top || rect.height }
          )
        }
      }
    }

    return showContextMenu(
      ev,
      contextMenus,
      treeViewHandleExtended.current,
      model.root
    )
  }, [])

  const handleItemContextMenu = useCallback(
    (ev: React.MouseEvent, item: IBirchItem | IBirchFolder) => {
      const {
        treeViewHandleExtended,
        options: {
          contributes: { contextMenus }
        }
      } = birchContextRef.current

      ev.stopPropagation()
      return showContextMenu(
        ev,
        contextMenus,
        treeViewHandleExtended.current,
        item
      )
    },
    []
  )

  birchContextRef.current.contextMenu = {
    handleContextMenu,
    handleItemContextMenu
  }
}

export const useContextMenuChild = ({
  item,
  itemType,
  handleItemContextMenu
}) => {
  const handleContextMenuChild = useCallback(
    (ev: React.MouseEvent) => {
      // context menu event when caused by user pressing context menu key on keyboard is handled in parent component
      if (ev.nativeEvent.which === 0) {
        return
      }
      if (
        itemType === EnumTreeItemTypeExtended.Item ||
        itemType === EnumTreeItemTypeExtended.Folder
      ) {
        handleItemContextMenu(ev, item as IBirchItem, itemType)
      }
    },
    [item, itemType, handleItemContextMenu]
  )

  return { onContextMenu: handleContextMenuChild }
}
