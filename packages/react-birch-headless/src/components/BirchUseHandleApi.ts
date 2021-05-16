import { useEffect, useRef } from 'react'
import { DisposablesComposite, EventEmitter } from 'react-birch-event-emitter'
import {
  EnumBirchWatchEvent,
  EnumTreeItemType,
  EnumTreeViewEventType
} from 'react-birch-types'
import type {
  Align,
  IBirchTreeViewHandleExtended,
  IBirchContext,
  ITreeItem,
  IBirchFolder,
  IBirchItem
} from 'react-birch-types'

export const useHandleApi = (
  birchContextRef: React.MutableRefObject<IBirchContext>
) => {
  const disposables = useRef<DisposablesComposite>()
  const events = useRef<EventEmitter<EnumTreeViewEventType>>()
  const viewId = birchContextRef.current.viewId

  useEffect(() => {
    disposables.current = new DisposablesComposite()
    events.current = new EventEmitter()

    return () => {
      disposables.current.dispose()
      events.current.clear()
    }
  }, [viewId])

  useEffect(() => {
    const {
      options: {
        onReady,
        treeDataProvider: { id }
      },
      listRef,
      treeViewHandleExtended,
      model,
      wrapperRef,
      activeSelection: { updateActiveItem, updatePseudoActiveItem },
      prompts: { supervisePrompt, promptRename, promptNewFolder, promptNewItem }
    } = birchContextRef.current

    const getBirchItemOrFolder = async (path: string, expandTree = true) => {
      const fileH = await model.root.forceLoadItemEntryAtPath(path)
      if (fileH && expandTree && !model.root.isItemVisibleAtSurface(fileH)) {
        await model.root.expandFolder(fileH.parent, true)
      }
      return fileH
    }

    const openFolder = async (pathOrFolder: string | IBirchFolder) => {
      const folder: IBirchFolder =
        typeof pathOrFolder === 'string'
          ? ((await model.root.forceLoadItemEntryAtPath(
              pathOrFolder
            )) as IBirchFolder)
          : pathOrFolder

      if (folder && folder.type === EnumTreeItemType.Folder) {
        return model.root.expandFolder(folder)
      }
      return null
    }

    const closeFolder = async (pathOrFolder: string | IBirchFolder) => {
      const folder: IBirchFolder =
        typeof pathOrFolder === 'string'
          ? ((await model.root.forceLoadItemEntryAtPath(
              pathOrFolder
            )) as IBirchFolder)
          : pathOrFolder

      if (folder && folder.type === EnumTreeItemType.Folder) {
        return model.root.collapseFolder(folder)
      }
      return null
    }

    const toggleFolder = async (pathOrDir: string | IBirchFolder) => {
      const dir =
        typeof pathOrDir === 'string'
          ? await getBirchItemOrFolder(pathOrDir)
          : pathOrDir
      if (dir.type === EnumTreeItemType.Folder) {
        if ((dir as IBirchFolder).expanded) {
          void closeFolder(dir as IBirchFolder)
        } else {
          void openFolder(dir as IBirchFolder)
        }
      }
    }

    const collapseAll = async () => {
      await model.root.flushEventQueue()

      const toFlatten: IBirchFolder[] = []

      for (let _i = 0; _i < model.root.branchSize; _i++) {
        const entry = model.root.getItemEntryAtIndex(_i)!
        if (
          entry.type === EnumTreeItemType.Folder &&
          (entry as IBirchFolder).expanded
        ) {
          toFlatten.push(entry as IBirchFolder)
        }
      }

      toFlatten.forEach((entry) => entry.setCollapsed())

      void updateActiveItem(null!)
      void updatePseudoActiveItem(null!)
      events.current.emit(EnumTreeViewEventType.OnDidChangeSelection, null)
    }

    const scrollIntoView = (
      itemOrFolder: IBirchItem | IBirchFolder,
      align: Align = 'center'
    ) => {
      const idx = model.root.getIndexAtItemEntry(itemOrFolder)
      if (idx > -1) {
        if (listRef.current) {
          listRef.current.scrollToItem(idx, align)
        }
        return true
      }
      return false
    }

    const ensureVisible = async (
      pathOrItemEntry: string | IBirchItem | IBirchFolder,
      align: Align = 'auto'
    ) => {
      await model.root.flushEventQueue()

      const itemEntry =
        typeof pathOrItemEntry === 'string'
          ? await model.root.forceLoadItemEntryAtPath(pathOrItemEntry)
          : pathOrItemEntry

      if (itemEntry.root === itemEntry) {
        throw new TypeError(`Object not a valid BirchItem`)
      }
      if (scrollIntoView(itemEntry, align)) {
        return
      }
      await model.root.expandFolder(itemEntry.parent, true)
      if (listRef.current) {
        listRef.current.scrollToItem(
          model.root.getIndexAtItemEntry(itemEntry),
          align
        )
      }
    }

    const unlinkItem = async (
      fileOrDirOrPath: IBirchItem | IBirchFolder | string
    ) => {
      const filedir =
        typeof fileOrDirOrPath === 'string'
          ? await treeViewHandleExtended.current.getBirchItemOrFolder(
              fileOrDirOrPath
            )
          : fileOrDirOrPath

      model.root.dispatch({
        type: EnumBirchWatchEvent.Removed,
        tid: filedir.tid,
        path: filedir.path
      })
    }

    const createdItem = async (item: ITreeItem, parentDir: IBirchFolder) => {
      const newName = item.label

      const newPath = model.root.pathfx.join(parentDir.path, newName)

      if (item.type && item.label) {
        model.root.dispatch({
          type: EnumBirchWatchEvent.Added,
          folder: parentDir.path,
          item
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
      }
    }

    const handle: IBirchTreeViewHandleExtended = {
      id,

      getModel: () => model,

      getActiveItem: () => birchContextRef.current.activeSelection.activeItem,
      setActiveItem: updateActiveItem,
      getPseudoActiveItem: () =>
        birchContextRef.current.activeSelection.pseudoActiveItem,
      setPseudoActiveItem: updatePseudoActiveItem,

      openFolder,
      closeFolder,
      toggleFolder,
      collapseAll,
      getBirchItemOrFolder,
      ensureVisible,

      unlinkItem: async (fileOrDirOrPath: IBirchItem | IBirchFolder | string) =>
        unlinkItem(fileOrDirOrPath),
      rename: async (fileOrDirOrPath: IBirchItem | IBirchFolder | string) => {
        supervisePrompt(await promptRename(fileOrDirOrPath as any))
      },
      newItem: async (dirOrPath: IBirchFolder | string, iconPath?: string) => {
        const result = await promptNewItem(dirOrPath as any, iconPath)
        supervisePrompt(result)
      },
      newFolder: async (dirOrPath: IBirchFolder | string) => {
        const result = await promptNewFolder(dirOrPath as any)
        supervisePrompt(result)
      },
      createdItem: async (item: ITreeItem, parentDir: IBirchFolder) =>
        createdItem(item, parentDir),
      onBlur: (callback) =>
        events.current.on(EnumTreeViewEventType.OnBlur, callback),
      onDidChangeSelection: (callback) =>
        events.current.on(EnumTreeViewEventType.OnDidChangeSelection, callback),
      hasDirectFocus: () => wrapperRef.current === document.activeElement,

      onDidChangeModel: (callback) =>
        events.current.on(EnumTreeViewEventType.DidChangeModel, callback),
      onceDidChangeModel: (callback) =>
        events.current.once(EnumTreeViewEventType.DidChangeModel, callback),
      onDidUpdate: (callback) =>
        events.current.on(EnumTreeViewEventType.DidUpdate, callback),
      onceDidUpdate: (callback) =>
        events.current.once(EnumTreeViewEventType.DidUpdate, callback),

      events: events.current
    }

    if (typeof onReady === 'function') {
      onReady(handle)
    }

    treeViewHandleExtended.current = handle
  }, [viewId])
}
