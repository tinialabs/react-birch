import * as React from 'react'
import { useRef, useEffect, useCallback, useMemo } from 'react'
import { DisposablesComposite, EventEmitter } from 'react-birch-event-emitter'
import { FixedSizeList } from 'react-window'

import { EnumTreeViewEventType } from 'react-birch-types'
import { BirchTreeViewModel, BirchDecoration } from '../models'
import { useForceUpdate } from '../hooks'
import { renderBirchTreeViewItem } from './BirchTreeViewItem'

import { usePrompts } from './BirchUsePrompts'
import { useActiveSelection } from './BirchUseSelection'
import { useContextMenuContainer } from './BirchUseContextMenu'
import { useDragDropContainer } from './BirchUseDragDrop'
import { useDecorations } from './BirchUseDecorations'
import { useHandleApi } from './BirchUseHandleApi'
import { useHandleSimpleApi, TreeViewHandle } from './BirchUseHandleSimpleApi'
import type {
  IBirchItemProps,
  IBirchContext,
  ITreeViewPropsInternal
} from 'react-birch-types'

export const BirchTreeView: React.FC<ITreeViewPropsInternal> = React.memo(
  ({ viewId, title, renderItem, options, handle }) => {
    const listRef = React.useRef<any>()
    const wrapperRef = React.useRef<HTMLDivElement>()
    const forceUpdate = useForceUpdate()

    const birchContextRef = useInstanceRef<IBirchContext>(
      () =>
        ({
          viewId: null,
          disposables: new DisposablesComposite(),
          idxTorendererPropsCache: new Map() as Map<number, IBirchItemProps>,
          events: new EventEmitter(),
          model: new BirchTreeViewModel({ options, viewId }),
          didUpdate: () => {
            birchContextRef.current.events.emit(EnumTreeViewEventType.DidUpdate)
          },
          itemIdToRefMap: new Map<number, HTMLDivElement>(),
          forceUpdate,
          listRef,
          wrapperRef
        } as any)
    )

    //
    // props based
    //
    birchContextRef.current.options = options

    birchContextRef.current.treeViewHandleExtended = handle

    birchContextRef.current.treeViewHandleSimple = useMemo(
      () => TreeViewHandle.createTreeView(viewId, options),
      [viewId, options.treeDataProvider.id]
    )

    if (viewId !== birchContextRef.current.viewId) {
      const birchContext = birchContextRef.current

      birchContext.viewId = viewId
      birchContext.getItemAtIndex = undefined as any
      birchContext.commitDebounce = undefined as any
      birchContext.adjustedRowCount = undefined as any
      birchContext.treeItemView = undefined as any
      birchContext.prompts = {} as any
      birchContext.activeSelection = {} as any
      birchContext.contextMenu = {} as any
      birchContext.dragDrop = {} as any
      birchContext.idxTorendererPropsCache = new Map()

      birchContext.decorations = {
        activeItemDecoration: new BirchDecoration('active'),
        pseudoActiveItemDecoration: new BirchDecoration('pseudo-active')
      } as any

      birchContext.itemIdToRefMap.clear()

      if (birchContext.model.viewId === viewId) {
        // first time through, otherwise handled in side effect below
        birchContext.disposables.add(
          birchContext.model.onChange(() => {
            void birchContextRef.current.commitDebounce()
          })
        )
      }
    }

    useEffect(() => {
      const birchContext = birchContextRef.current

      const prevModel = birchContext.model

      if (viewId === prevModel.viewId) {
        return
      }

      // Reinitialize Model on reload

      const newModel = new BirchTreeViewModel({ options, viewId })

      if (birchContext.listRef.current) {
        birchContext.listRef.current.scrollTo(prevModel.scrollOffset)
      }

      birchContext.events.emit(
        EnumTreeViewEventType.DidChangeModel,
        prevModel,
        newModel
      )

      birchContext.model = newModel
      birchContext.listRef.current = undefined

      birchContext.disposables.add(
        newModel.onChange(() => {
          void birchContextRef.current.commitDebounce()
        })
      )

      return () => {
        birchContextRef.current.disposables.dispose()
        birchContextRef.current.model.dispose()
      }
    }, [viewId])

    /**
     * Use Active Selection for allowing mouse and keyboard to select items and folders
     */
    useActiveSelection(birchContextRef)

    /**
     * Use Prompts for Renaming and Adding New Folders and Items
     */
    usePrompts(birchContextRef)

    /**
     * Use Extended Handle API
     */
    useHandleApi(birchContextRef)

    /**
     * Use Simple Handle API
     */
    useHandleSimpleApi(birchContextRef)

    /**
     * Use Context Menu for context-sensitive popup menus
     */
    useContextMenuContainer(birchContextRef)

    /**
     * Use Drag and Drop Service for moving items and folders
     */
    useDragDropContainer(birchContextRef)

    /**
     * Hook up decorations sercice
     */
    useDecorations(birchContextRef)

    const renderBirchItem = renderBirchTreeViewItem(birchContextRef, renderItem)

    useEffect(() => {
      if (options.onCreateView) {
        options.onCreateView(
          birchContextRef.current.treeViewHandleSimple,
          handle.current
        )
      }
    }, [birchContextRef.current.treeViewHandleSimple, viewId])

    /** Set up FixedSizeList callbacks
     */
    const handleListScroll = useCallback(
      ({ scrollOffset }) => {
        birchContextRef.current.model.saveScrollOffset(scrollOffset)
      },
      [viewId, birchContextRef.current.model]
    )
    /* RENDER */

    return (
      <div
        className="birch-tree-view"
        {...birchContextRef.current.activeSelection.selectionProps}
        onContextMenu={birchContextRef.current.contextMenu.handleContextMenu}
        ref={birchContextRef.current.wrapperRef}
        tabIndex={-1}
      >
        {options.itemHeight! > 0 ? (
          <FixedSizeList
            width="100%"
            height={
              options.height! > 0
                ? options.height
                : options.itemHeight! * birchContextRef.current.adjustedRowCount
            }
            itemData={[]}
            itemSize={options.itemHeight}
            /*	itemKey={getItemKey} */
            itemCount={birchContextRef.current.adjustedRowCount}
            overscanCount={5}
            ref={birchContextRef.current.listRef}
            onScroll={handleListScroll}
            style={options.style}
            className={options.className}
          >
            {renderBirchItem}
          </FixedSizeList>
        ) : (
          <div ref={birchContextRef.current.listRef}>
            {Array.apply(null, {
              length: birchContextRef.current.adjustedRowCount
            }).map((value, index) => {
              return renderBirchItem({ index, style: options.style })
            })}
          </div>
        )}
      </div>
    )
  }
)

interface InstanceRef<T> {
  current: T
}

const noValue = Symbol('lazyRef.noValue')

export function useInstanceRef<T>(getInitialValue: () => T): InstanceRef<T> {
  const lazyRef = useRef<T | symbol>(noValue)

  if (lazyRef.current === noValue) {
    lazyRef.current = getInitialValue()
  }

  return lazyRef as InstanceRef<T>
}
