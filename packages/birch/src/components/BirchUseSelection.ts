import * as React from 'react'
import { useRef, useCallback, useEffect } from 'react'

import { BirchFolder, BirchItem, BirchItemOrFolder } from '../models'

import {
  EnumBirchItemType,
  EnumTreeViewExtendedEvent,
  IBirchContext,
  EnumTreeItemType
} from '../types'

import { DecorationTargetMatchMode } from '../models/decoration'
import { KeyboardHotkeys } from '../services/keyboardHotkeys'

export const useActiveSelection = (
  birchContextRef: React.MutableRefObject<IBirchContext>
) => {
  const activeItem = useRef<BirchItemOrFolder>()
  const pseudoActiveItem = useRef<BirchItemOrFolder>()
  const keyboardHotkeys = useRef<KeyboardHotkeys>()
  const viewId = birchContextRef.current.viewId

  useEffect(() => {
    activeItem.current = undefined
    pseudoActiveItem.current = undefined
    keyboardHotkeys.current = new KeyboardHotkeys(birchContextRef)
  }, [viewId])

  const updateActiveItem = useCallback(
    async (fileOrDirOrPath: BirchItemOrFolder | string): Promise<void> => {
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
            DecorationTargetMatchMode.Self
          )
        }
        activeItem.current = fileH
        forceUpdate()
      }
      if (fileH) {
        await treeViewHandleExtended.current.ensureVisible(fileH)
        if (fileH.type === EnumTreeItemType.Folder) {
          await model.root.expandFolder(fileH as BirchFolder, true)
        }
      }
    },
    []
  )

  const updatePseudoActiveItem = useCallback(
    async (fileOrDirOrPath: BirchItemOrFolder | string): Promise<void> => {
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
            DecorationTargetMatchMode.Self
          )
        }
        pseudoActiveItem.current = fileH
        forceUpdate()
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
      item: BirchItemOrFolder,
      type: EnumBirchItemType
    ) => {
      const { treeViewHandleExtended } = birchContextRef.current

      if (type === EnumBirchItemType.BirchItem) {
        await updateActiveItem(item as BirchItem)
        await updatePseudoActiveItem(null)
        if (item.details.command) {
          ;(item as BirchItem).details.command.handler(item)
        }
        treeViewHandleExtended.current.events.emit(
          EnumTreeViewExtendedEvent.OnDidChangeSelection,
          item as BirchItem
        )
      }
      if (type === EnumBirchItemType.BirchFolder) {
        await updatePseudoActiveItem(item as BirchItem)
        await updateActiveItem(null)
        treeViewHandleExtended.current.toggleFolder(item as BirchFolder)
      }
    },
    []
  )

  const handleClick = useCallback((ev: React.MouseEvent) => {
    // clicked in "blank space"
    if (ev.currentTarget === ev.target) {
      updatePseudoActiveItem(null)
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
