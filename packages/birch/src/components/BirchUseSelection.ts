import * as React from 'react'
import { useRef, useCallback, useEffect } from 'react'

import {
  EnumBirchItemType,
  EnumTreeViewExtendedEvent,
  EnumTreeItemType,
  EnumDecorationTargetMatchMode
} from 'react-birch-types'

import type { IBirchContext, IBirchFolder, IBirchItem } from 'react-birch-types'

import { KeyboardHotkeys } from '../services/keyboardHotkeys'

export const useActiveSelection = (
  birchContextRef: React.MutableRefObject<IBirchContext>
) => {
  const activeItem = useRef<IBirchItem | IBirchFolder>()
  const pseudoActiveItem = useRef<IBirchItem | IBirchFolder>()
  const keyboardHotkeys = useRef<KeyboardHotkeys>()
  const viewId = birchContextRef.current.viewId

  useEffect(() => {
    activeItem.current = undefined
    pseudoActiveItem.current = undefined
    keyboardHotkeys.current = new KeyboardHotkeys(birchContextRef)
  }, [viewId])

  const updateActiveItem = useCallback(
    async (
      fileOrDirOrPath: IBirchItem | IBirchFolder | string
    ): Promise<void> => {
      const {
        model,
        forceUpdate,
        treeViewHandleExtended,
        decorations: { activeItemDecoration }
      } = birchContextRef.current

      const fileH =
        typeof fileOrDirOrPath === 'string'
          ? await treeViewHandleExtended.current.getItemHandle(fileOrDirOrPath)
          : fileOrDirOrPath

      if (fileH === model.root) {
        return
      }
      if (activeItem.current !== fileH) {
        if (activeItem.current) {
          activeItemDecoration.removeTarget(activeItem.current)
        }
        if (fileH) {
          activeItemDecoration.addTarget(
            fileH as any,
            EnumDecorationTargetMatchMode.Self
          )
        }
        activeItem.current = fileH
        forceUpdate()
      }
      if (fileH) {
        await treeViewHandleExtended.current.ensureVisible(fileH)
        if (fileH.type === EnumTreeItemType.Folder) {
          await model.root.expandFolder(fileH as IBirchFolder, true)
        }
      }
    },
    []
  )

  const updatePseudoActiveItem = useCallback(
    async (
      fileOrDirOrPath: IBirchItem | IBirchFolder | string
    ): Promise<void> => {
      const {
        model,
        forceUpdate,
        treeViewHandleExtended,
        decorations: { pseudoActiveItemDecoration }
      } = birchContextRef.current

      const fileH =
        typeof fileOrDirOrPath === 'string'
          ? await treeViewHandleExtended.current.getItemHandle(fileOrDirOrPath)
          : fileOrDirOrPath

      if (fileH === model.root) {
        return
      }
      if (pseudoActiveItem.current !== fileH) {
        if (pseudoActiveItem.current) {
          pseudoActiveItemDecoration.removeTarget(pseudoActiveItem.current)
        }
        if (fileH) {
          pseudoActiveItemDecoration.addTarget(
            fileH as any,
            EnumDecorationTargetMatchMode.Self
          )
        }
        pseudoActiveItem.current = fileH
        forceUpdate()
      }
      if (fileH) {
        await treeViewHandleExtended.current.ensureVisible(fileH)
      }
    },
    []
  )

  const handleBlur = useCallback(() => {
    const { treeViewHandleExtended } = birchContextRef.current

    treeViewHandleExtended.current.events.emit(EnumTreeViewExtendedEvent.OnBlur)
  }, [])

  const handleItemClicked = useCallback(
    async (
      ev: React.MouseEvent,
      item: IBirchItem | IBirchFolder,
      type: EnumBirchItemType
    ) => {
      const { treeViewHandleExtended } = birchContextRef.current

      if (type === EnumBirchItemType.BirchItem) {
        await updateActiveItem(item as IBirchItem)
        await updatePseudoActiveItem(null)
        if (item.details.command) {
          ;(item as IBirchItem).details.command.handler(item)
        }
        treeViewHandleExtended.current.events.emit(
          EnumTreeViewExtendedEvent.OnDidChangeSelection,
          item as IBirchItem
        )
      }
      if (type === EnumBirchItemType.BirchFolder) {
        await updatePseudoActiveItem(item as IBirchItem)
        await updateActiveItem(null)
        treeViewHandleExtended.current.toggleFolder(item as IBirchFolder)
      }
    },
    []
  )

  const handleClick = useCallback((ev: React.MouseEvent) => {
    // clicked in "blank space"
    if (ev.currentTarget === ev.target) {
      void updatePseudoActiveItem(null)
    }
  }, [])

  const handleKeyDown = useCallback((ev: React.KeyboardEvent) => {
    return keyboardHotkeys.current.handleKeyDown(ev)
  }, [])

  const selectionProps = {
    onKeyDown: handleKeyDown,
    onBlur: handleBlur,
    onClick: handleClick
  }

  birchContextRef.current.activeSelection = {
    activeItem: activeItem.current,
    pseudoActiveItem: pseudoActiveItem.current,
    updateActiveItem,
    updatePseudoActiveItem,
    handleKeyDown,
    selectionProps,
    handleItemClicked
  }
}

export default useActiveSelection
