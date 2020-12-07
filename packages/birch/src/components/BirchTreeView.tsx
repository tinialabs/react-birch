import * as React from 'react'
import { useRef, useEffect, useCallback, useMemo, useReducer } from 'react'
import { DisposablesComposite, EventEmitter } from 'birch-event-emitter'
import { FixedSizeList } from 'react-window'

import type {
  IBirchTreeItemProps,
  IBirchContext,
  IBirchTreeViewPropsInternal
} from 'react-birch-types'
import { EnumTreeViewExtendedEvent } from 'react-birch-types'
import { TreeViewModel } from '../models'
import { Decoration } from '../models/decoration'
import { renderBirchTreeViewItem } from './BirchTreeViewItem'

import { usePrompts } from './BirchUsePrompts'
import { useActiveSelection } from './BirchUseSelection'
import { useContextMenuContainer } from './BirchUseContextMenu'
import { useDragDropContainer } from './BirchUseDragDrop'
import { useDecorations } from './BirchUseDecorations'
import { useHandleApi } from './BirchUseHandleApi'
import { useHandleSimpleApi, TreeViewHandle } from './BirchUseHandleSimpleApi'

const useForceUpdate = () => {
  const [, update] = useReducer((num: number): number => (num + 1) % 1000000, 0)
  return update as () => void
}

export const BirchTreeView: React.FC<IBirchTreeViewPropsInternal> = React.memo(
  ({ viewId, title, renderItem, options, handle }) => {
    const listRef = React.useRef<any>()
    const wrapperRef = React.useRef<HTMLDivElement>()
    const forceUpdate = useForceUpdate()

    const birchContextRef = useInstanceRef<IBirchContext>(
      () =>
        ({
          viewId: null,
          disposables: new DisposablesComposite(),
          idxTorendererPropsCache: new Map() as Map<
            number,
            IBirchTreeItemProps
          >,
          events: new EventEmitter(),
          model: new TreeViewModel({ options, viewId }),
          didUpdate: () => {
            birchContextRef.current.events.emit(
              EnumTreeViewExtendedEvent.DidUpdate
            )
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
        activeItemDecoration: new Decoration('active'),
        pseudoActiveItemDecoration: new Decoration('pseudo-active')
      } as any

      birchContext.itemIdToRefMap.clear()

      if (birchContext.model.viewId === viewId) {
        // first time through, otherwise handled in side effect below
        birchContext.disposables.add(
          birchContext.model.onDidBranchUpdate(() =>
            birchContextRef.current.commitDebounce()
          )
        )
      }
    }

    useEffect(() => {
      const birchContext = birchContextRef.current

      const prevModel = birchContext.model
      if (birchContext.model.viewId === viewId) {
        return undefined
      }

      // Reinitialize Model on reload

      const newModel = new TreeViewModel({ options, viewId })

      if (birchContext.listRef.current) {
        birchContext.listRef.current.scrollTo(prevModel.scrollOffset)
      }

      birchContext.events.emit(
        EnumTreeViewExtendedEvent.DidChangeModel,
        prevModel,
        newModel
      )

      birchContext.model = newModel
      birchContext.listRef.current = undefined

      birchContext.disposables.add(
        newModel.onDidBranchUpdate(() =>
          birchContextRef.current.commitDebounce()
        )
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
