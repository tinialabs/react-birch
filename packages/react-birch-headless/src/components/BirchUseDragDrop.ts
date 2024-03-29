import * as React from 'react'
import { useMemo, useCallback, useContext, useEffect } from 'react'
import { ThemeContext } from 'styled-components'
import {
  EnumTreeItemTypeExtended,
  EnumBirchWatchEvent,
  IBirchContext,
  IBirchItem,
  IBirchFolder,
  IBirchNewItemPromptHandle,
  IBirchRenamePromptHandle
} from 'react-birch-types'

import { BirchDragAndDropService } from '../services'

function useTheme() {
  return useContext(ThemeContext)
}

export const useDragDropContainer = (
  birchContextRef: React.MutableRefObject<IBirchContext>
) => {
  const [dragged, setDragged] = React.useState(false)
  const { viewId } = birchContextRef.current

  const dragAndDropService = React.useRef<BirchDragAndDropService>()

  useEffect(() => {
    dragAndDropService.current = new BirchDragAndDropService(
      birchContextRef.current.model
    )

    dragAndDropService.current.onDragAndDrop(
      async (item: IBirchItem | IBirchFolder, newParent: IBirchFolder) => {
        const {
          options: { treeDataProvider },
          activeSelection: { updateActiveItem, updatePseudoActiveItem },
          model
        } = birchContextRef.current

        try {
          const newPath = model.root.pathfx.join(newParent.path, item.label)
          const allowed = await treeDataProvider.moveItem(
            item,
            newParent,
            newPath
          )
          if (!allowed) {
            return
          }
          model.root.dispatch({
            type: EnumBirchWatchEvent.Moved,
            tid: item.tid,
            oldPath: item.path,
            newPath
          })
          void updatePseudoActiveItem(null!)
          void updateActiveItem(item)
          setDragged((dragged) => !dragged)
        } catch (error) {
          // handle as you see fit
        }
      }
    )

    return () => {
      dragAndDropService.current.dispose()
      dragAndDropService.current = undefined
    }
  }, [viewId])

  birchContextRef.current.dragDrop = {
    dragAndDropService: dragAndDropService,
    dragged
  }
}

export const useDragDropChild = ({
  itemIdToRefMap,
  item,
  itemType,
  dragAndDropService
}: {
  itemIdToRefMap: Map<number, HTMLDivElement>
  item:
    | IBirchItem
    | IBirchFolder
    | IBirchNewItemPromptHandle
    | IBirchRenamePromptHandle
  itemType: EnumTreeItemTypeExtended
  dragAndDropService: BirchDragAndDropService
}) => {
  const theme: any = useTheme()

  const handleDragStart = useCallback(
    (ev: React.DragEvent) => {
      if (
        itemType === EnumTreeItemTypeExtended.Item ||
        itemType === EnumTreeItemTypeExtended.Folder
      ) {
        const ref = itemIdToRefMap.get(item.birchId)

        if (ref) {
          ref.style.backgroundColor = 'none'
          const label$ = ref.querySelector('.birch-label') as HTMLDivElement
          label$.style.padding = '2px 8px'
          label$.style.background = theme.colors.accent[3]
          label$.style.color = theme.colors.gray[7]
          label$.style.borderRadius = '1em'
          label$.style.fontSize = `${theme.fontSizes[0]}px`
          label$.style.transform = 'translate(0, 0)' // fixes chrome rounded corners transparent background

          ev.dataTransfer.setDragImage(label$, -5, -5)

          requestAnimationFrame(() => {
            ref.style.background = ''
            ref.style.borderRadius = ''
            label$.style.padding = ''
            label$.style.background = ''
            label$.style.borderRadius = ''
            label$.style.color = ''
            label$.style.fontSize = ''
            label$.style.transform = ''
            label$.style.cursor = 'pointer'
          })
        }
        dragAndDropService.handleDragStart(ev, item as IBirchItem)
      }
    },
    [item, itemType, dragAndDropService]
  )

  const handleDragEnd = useCallback(
    (ev: React.DragEvent) => {
      if (
        itemType === EnumTreeItemTypeExtended.Item ||
        itemType === EnumTreeItemTypeExtended.Folder
      ) {
        dragAndDropService.handleDragEnd(ev, item as IBirchItem)
      }
    },
    [item, itemType, dragAndDropService]
  )

  const handleDragEnter = useCallback(
    (ev: React.DragEvent) => {
      if (
        itemType === EnumTreeItemTypeExtended.Item ||
        itemType === EnumTreeItemTypeExtended.Folder
      ) {
        dragAndDropService.handleDragEnter(ev, item as IBirchItem)
      }
    },
    [item, itemType, dragAndDropService]
  )

  const handleDrop = useCallback(
    (ev: React.DragEvent) => {
      if (
        itemType === EnumTreeItemTypeExtended.Item ||
        itemType === EnumTreeItemTypeExtended.Folder
      ) {
        dragAndDropService.handleDrop(ev)
      }
    },
    [itemType, dragAndDropService]
  )

  const handleDragOver = useCallback(
    (ev: React.DragEvent) => {
      if (
        itemType === EnumTreeItemTypeExtended.Item ||
        itemType === EnumTreeItemTypeExtended.Folder
      ) {
        dragAndDropService.handleDragOver(ev)
      }
    },
    [itemType, dragAndDropService]
  )

  const dragProps = useMemo(
    () => ({
      draggable: true,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
      onDragEnter: handleDragEnter,
      onDragOver: handleDragOver,
      onDrop: handleDrop
    }),
    [item, itemType, dragAndDropService]
  )

  return [dragProps]
}
