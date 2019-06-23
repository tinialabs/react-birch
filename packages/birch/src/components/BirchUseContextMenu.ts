import * as React from 'react'
import { useCallback, } from 'react';

import { useContextMenu } from '../services/contextMenu'

import {
  BirchItem,
  BirchItemOrFolder,
  BirchFolder,
} from '../models'

import {
  EnumBirchItemType, IBirchContext,
} from '../types'


export const useContextMenuContainer = (birchContextRef: React.MutableRefObject<IBirchContext>) => {

  const [showContextMenu] = useContextMenu()

  const getBoundingClientRectForItem = useCallback((
    item: BirchItem | BirchFolder
  ) => {

    const {
      itemIdToRefMap,
    } = birchContextRef.current

    const divRef = itemIdToRefMap.get(item.birchId)
    if (divRef) {
      return divRef.getBoundingClientRect()
    }
    return null
  }, [])

  const handleContextMenu = useCallback((ev: React.MouseEvent) => {

    const {
      treeViewHandleExtended,
      model,
      activeSelection: { pseudoActiveItem, activeItem },
      options: { contributes: { contextMenus } },
    } = birchContextRef.current

    let target: BirchItemOrFolder

    // capture ctx menu triggered through context menu button on keyboard
    if (ev.nativeEvent.which === 0) {
      target = pseudoActiveItem || activeItem
      if (target) {
        const rect = getBoundingClientRectForItem(target)
        if (rect) {
          return showContextMenu(ev, contextMenus, treeViewHandleExtended.current, target, { x: (rect.left + rect.width), y: (rect.top | rect.height) })
        }
      }
    }

    return showContextMenu(ev, contextMenus, treeViewHandleExtended.current, model.root)

  }, [])

  const handleItemContextMenu = useCallback((ev: React.MouseEvent, item: BirchItemOrFolder) => {

    const {
      treeViewHandleExtended,
      options: { contributes: { contextMenus } },
    } = birchContextRef.current

    ev.stopPropagation()
    return showContextMenu(ev, contextMenus, treeViewHandleExtended.current, item)
  }, [])

  birchContextRef.current.contextMenu = {
    handleContextMenu,
    handleItemContextMenu
  }

}

export const useContextMenuChild = ({ item, itemType, handleItemContextMenu }) => {

  const handleContextMenuChild = useCallback((ev: React.MouseEvent) => {
    // context menu event when caused by user pressing context menu key on keyboard is handled in parent component
    if (ev.nativeEvent.which === 0) {
      return
    }
    if (
      itemType === EnumBirchItemType.BirchItem ||
      itemType === EnumBirchItemType.BirchFolder
    ) {
      handleItemContextMenu(ev, item as BirchItem, itemType)
    }
  }, [item, itemType, handleItemContextMenu])

  return { onContextMenu: handleContextMenuChild }

}
