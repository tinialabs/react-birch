import { useRef, useCallback, useMemo, useEffect } from 'react'

import {
  EnumTreeItemTypeExtended,
  EnumTreeItemType,
  EnumTreeViewEventType,
  EnumBirchWatchEvent,
  IBirchFolder,
  IBirchItem,
  IBirchNewItemPromptHandle,
  IBirchRenamePromptHandle,
  IBirchItemProps,
  IBirchContext
} from 'react-birch-types'

import {
  BirchPromptHandleNewItem,
  BirchPromptHandle,
  BirchPromptHandleRename
} from '../models'

const BATCHED_UPDATE_MAX_DEBOUNCE_MS = 4

export const usePrompts = (
  birchContextRef: React.MutableRefObject<IBirchContext>
) => {
  const newItemPromptInsertionIndex = useRef<number>(-1)
  const promptTargetID = useRef<number>(-1) // NumericID <BirchItem | BirchFolder>
  const promptHandle =
    useRef<BirchPromptHandleNewItem | BirchPromptHandleRename>()

  const viewId = birchContextRef.current.viewId

  useEffect(() => {
    if (promptHandle.current) {
      promptHandle.current.destroy()
      promptHandle.current = undefined
    }
    newItemPromptInsertionIndex.current = -1
    promptTargetID.current = -1
  }, [viewId])

  const commitDebounce = useMemo(() => {
    const { model, didUpdate, forceUpdate } = birchContextRef.current

    // For every caller who calls `commitDebounce` within `BATCHED_UPDATE_MAX_WAIT_MS`, they are given same `Promise` object they can `await` upon
    let onePromise: Promise<void>
    let timer: number
    let resolver: (value: void | PromiseLike<void>) => void

    const commit = () => {
      let _newItemPromptInsertionIndex = -1
      if (
        promptTargetID.current > -1 &&
        promptHandle.current instanceof BirchPromptHandleNewItem &&
        promptHandle.current.parent.expanded &&
        model.root.isItemVisibleAtSurface(promptHandle.current.parent) &&
        !promptHandle.current.destroyed
      ) {
        const idx = model.root.getIndexAtItemEntryID(promptTargetID.current)
        if (idx > -1 || promptHandle.current.parent === model.root) {
          _newItemPromptInsertionIndex = idx + 1
        } else {
          promptTargetID.current = -1
        }
      }
      newItemPromptInsertionIndex.current = _newItemPromptInsertionIndex
      birchContextRef.current.idxTorendererPropsCache.clear()
      forceUpdate(resolver)
    }

    return () => {
      if (!onePromise) {
        onePromise = new Promise((resolve) => {
          resolver = resolve
        })
        void onePromise.then(() => {
          onePromise = null!
          resolver = null
          didUpdate()
        })
      }
      // (re)schedule update commitment
      clearTimeout(timer)
      timer = setTimeout(commit, BATCHED_UPDATE_MAX_DEBOUNCE_MS) as any
      return onePromise
    }
  }, [viewId])

  const supervisePrompt = useCallback(
    (promptHandle: IBirchRenamePromptHandle | IBirchNewItemPromptHandle) => {
      const {
        model,
        treeViewHandleExtended,
        options: { treeDataProvider }
      } = birchContextRef.current

      if (!promptHandle.destroyed) {
        // returning false from `onBlur` listener will prevent `BirchPromptHandle` from being automatically destroyed
        promptHandle.onBlur(() => {
          return true
        })

        let didMarkInvalid = false
        promptHandle.onChange((currentValue) => {
          if (didMarkInvalid) {
            promptHandle.removeClassName('invalid')
            didMarkInvalid = false
          }
        })

        promptHandle.onCommit(async (newName) => {
          if (newName.trim() === '') {
            return
          }

          promptHandle.removeClassName('invalid')
          promptHandle.removeClassName('invalid-input-pulse')
          if (promptHandle instanceof BirchPromptHandleRename) {
            const target = promptHandle.target
            const oldPath = target.path
            const newPath = model.root.pathfx.join(target.parent.path, newName)
            const res = await treeDataProvider.moveItem(
              target,
              target.parent,
              newPath
            )
            // "truthy" values won't be enough, must be explicit `true`
            if (res === true) {
              treeViewHandleExtended.current.onceDidUpdate(() => {
                void treeViewHandleExtended.current.ensureVisible(target)
              })
              model.root.dispatch({
                type: EnumBirchWatchEvent.Moved,
                tid: target.tid,
                oldPath,
                newPath
              })
            }
          } else if (promptHandle instanceof BirchPromptHandleNewItem) {
            const parentDir = promptHandle.parent
            const newPath = model.root.pathfx.join(parentDir.path, newName)
            const maybeItem = await treeDataProvider.createItem(
              parentDir,
              newName,
              newPath,
              promptHandle.type,
              null // use defaultContent from tree provider
            )
            if (maybeItem && maybeItem.type && maybeItem.label) {
              model.root.dispatch({
                type: EnumBirchWatchEvent.Added,
                folder: parentDir.path,
                item: maybeItem
              })
              treeViewHandleExtended.current.setActiveItem(newPath)
              treeViewHandleExtended.current.setPseudoActiveItem(null!)
              setTimeout(() => {
                const item = treeViewHandleExtended.current.getActiveItem()
                if (item.details.command) {
                  item.details.command.handler!(item)
                  treeViewHandleExtended.current.events.emit(
                    EnumTreeViewEventType.OnDidChangeSelection,
                    item as IBirchItem
                  )
                }
              }, 0)
            } else {
              console.log('Added but not notify in BirchUsePrompts', maybeItem)
            }
          }
        })
      }
    },
    [viewId]
  )

  const updatePromptHandle = useCallback(
    (handle: IBirchNewItemPromptHandle | IBirchRenamePromptHandle) => {
      if (promptHandle.current === handle) {
        return
      }

      if (
        promptHandle.current instanceof BirchPromptHandle &&
        !promptHandle.current.destroyed
      ) {
        promptHandle.current.destroy()
      }

      handle.onDestroy(() => {
        void commitDebounce()
      })

      promptHandle.current = handle as
        | BirchPromptHandleNewItem
        | BirchPromptHandleRename
    },
    [viewId]
  )

  const promptRename = useCallback(
    async (
      pathOrItemEntry: string | IBirchItem
    ): Promise<IBirchRenamePromptHandle> => {
      const { model, listRef } = birchContextRef.current

      await model.root.flushEventQueue()
      const itemEntry =
        typeof pathOrItemEntry === 'string'
          ? await model.root.forceLoadItemEntryAtPath(pathOrItemEntry)
          : pathOrItemEntry

      if (
        !(
          itemEntry.type === EnumTreeItemType.Item ||
          itemEntry.type === EnumTreeItemType.Folder
        ) ||
        itemEntry.root === itemEntry
      ) {
        throw new TypeError(`Cannot rename object of type ${typeof itemEntry}`)
      }
      const _promptHandle = new BirchPromptHandleRename(
        itemEntry.label,
        itemEntry
      )
      updatePromptHandle(_promptHandle)
      promptTargetID.current = itemEntry.birchId
      if (!model.root.isItemVisibleAtSurface(itemEntry)) {
        await model.root.expandFolder(itemEntry.parent)
      } else {
        await commitDebounce()
      }

      if (listRef.current) {
        listRef.current.scrollToItem(
          model.root.getIndexAtItemEntryID(itemEntry.birchId)
        )
      }

      return _promptHandle
    },
    [viewId]
  )

  const promptNew = useCallback(
    async (
      pathOrFolder: string | IBirchFolder,
      type: EnumTreeItemType,
      iconPath?: string
    ): Promise<IBirchNewItemPromptHandle> => {
      const { model, listRef } = birchContextRef.current

      await model.root.flushEventQueue()

      const folder: IBirchFolder =
        typeof pathOrFolder === 'string'
          ? ((await model.root.forceLoadItemEntryAtPath(
              pathOrFolder
            )) as IBirchFolder)
          : pathOrFolder

      if (!(folder.type === EnumTreeItemType.Folder)) {
        throw new TypeError(
          `Cannot create new item prompt at object of type ${typeof folder}`
        )
      }

      if (type !== EnumTreeItemType.Item && type !== EnumTreeItemType.Folder) {
        throw new TypeError(
          `Invalid type supplied. Expected 'EnumTreeItemType.Item' or 'EnumTreeItemType.Folder', got ${type}`
        )
      }

      const _promptHandle = new BirchPromptHandleNewItem(type, folder, iconPath)
      updatePromptHandle(_promptHandle)
      promptTargetID.current = folder.birchId
      if (
        folder !== model.root &&
        (!folder.expanded || !model.root.isItemVisibleAtSurface(folder))
      ) {
        // will trigger `update()` anyway
        await model.root.expandFolder(folder)
      } else {
        await commitDebounce()
      }
      if (listRef.current) {
        listRef.current.scrollToItem(newItemPromptInsertionIndex.current)
      }
      return _promptHandle
    },
    [viewId]
  )

  const promptNewFolder = useCallback(
    (
      pathOrFolder: string | IBirchFolder
    ): Promise<IBirchNewItemPromptHandle> => {
      return promptNew(pathOrFolder, EnumTreeItemType.Folder, '')
    },
    [viewId]
  )

  const promptNewItem = useCallback(
    (
      pathOrFolder: string | IBirchFolder,
      iconPath?: string
    ): Promise<IBirchNewItemPromptHandle> => {
      return promptNew(pathOrFolder, EnumTreeItemType.Item, iconPath)
    },
    [viewId]
  )

  const adjustedRowCount = useMemo(() => {
    const { model } = birchContextRef.current

    return newItemPromptInsertionIndex.current > -1 &&
      promptHandle.current &&
      promptHandle.current.constructor === BirchPromptHandleNewItem &&
      !promptHandle.current.destroyed
      ? model.root.branchSize + 1
      : model.root.branchSize
  }, [
    promptHandle.current,
    newItemPromptInsertionIndex.current,
    birchContextRef.current.model.root.branchSize
  ])

  const getItemAtIndex = useCallback(
    (index: number): IBirchItemProps => {
      const { model, idxTorendererPropsCache } = birchContextRef.current

      let cached: IBirchItemProps = idxTorendererPropsCache.get(index)!

      if (!cached) {
        const promptInsertionIdx = newItemPromptInsertionIndex.current

        // new item prompt
        if (
          promptInsertionIdx > -1 &&
          promptHandle.current &&
          promptHandle.current.constructor === BirchPromptHandleNewItem &&
          !promptHandle.current.destroyed
        ) {
          if (index === promptInsertionIdx) {
            cached = {
              itemType:
                (promptHandle.current as BirchPromptHandleNewItem).type ===
                EnumTreeItemType.Item
                  ? EnumTreeItemTypeExtended.NewItemPrompt
                  : EnumTreeItemTypeExtended.NewFolderPrompt,
              item: promptHandle.current as BirchPromptHandleNewItem
            } as any
          } else {
            const item = model.root.getItemEntryAtIndex(
              index -
                (index >= promptInsertionIdx
                  ? 1 /* apply virtual backshift */
                  : 0)
            )!
            cached = {
              itemType:
                item.type === EnumTreeItemType.Item
                  ? EnumTreeItemTypeExtended.Folder
                  : EnumTreeItemTypeExtended.Item,
              item
            } as any
          }
        } else {
          const item = model.root.getItemEntryAtIndex(index)

          // check for rename prompt
          if (
            item &&
            item.birchId === promptTargetID.current &&
            promptHandle.current &&
            promptHandle.current.constructor === BirchPromptHandleRename &&
            (promptHandle.current as BirchPromptHandleRename).originalLabel ===
              item.label &&
            !promptHandle.current.destroyed
          ) {
            cached = {
              itemType: EnumTreeItemTypeExtended.RenamePrompt,
              item: promptHandle.current as BirchPromptHandleRename
            }
          } else {
            cached = {
              itemType:
                item && item.type === EnumTreeItemType.Folder
                  ? EnumTreeItemTypeExtended.Folder
                  : EnumTreeItemTypeExtended.Item,
              item
            } as any
          }
        }

        idxTorendererPropsCache.set(index, cached)
      }

      return cached
    },
    [viewId]
  )

  Object.assign(birchContextRef.current, {
    adjustedRowCount,
    getItemAtIndex,
    commitDebounce,
    prompts: {
      promptRename,
      promptNewFolder,
      promptNewItem,
      supervisePrompt
    }
  })
}

export const isPrompt = (itemType) => {
  return (
    itemType === EnumTreeItemTypeExtended.RenamePrompt ||
    itemType === EnumTreeItemTypeExtended.NewFolderPrompt ||
    itemType === EnumTreeItemTypeExtended.NewItemPrompt
  )
}
