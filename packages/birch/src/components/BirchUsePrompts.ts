import { useRef, useCallback, useMemo,useEffect } from 'react'

import {
	BirchFolder,
	BirchItem,
	BirchRoot,
	PromptHandleNewItem,
	PromptHandle,
	PromptHandleRename,
	EnumBirchWatchEvent,
} from '../models'

import {
	IBirchTreeItemProps,
	EnumBirchItemType,
	EnumTreeItemType,
	IBirchContext,
	EnumTreeViewExtendedEvent
} from '../types'

const BATCHED_UPDATE_MAX_DEBOUNCE_MS = 4

export const usePrompts = (birchContextRef: React.MutableRefObject<IBirchContext>) => {

	const newItemPromptInsertionIndex = useRef<number>(-1)
	const promptTargetID = useRef<number>(-1)  // NumericID <BirchItem | BirchFolder>
	const promptHandle = useRef<PromptHandleNewItem | PromptHandleRename>()

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

		const {
			model,
			didUpdate,
			forceUpdate,
	 } = birchContextRef.current

		// For every caller who calls `commitDebounce` within `BATCHED_UPDATE_MAX_WAIT_MS`, they are given same `Promise` object they can `await` upon
		let onePromise: Promise<void>
		let timer: number
		let resolver

		const commitUpdate = () => {

			let _newItemPromptInsertionIndex: number = -1
			if (promptTargetID.current > -1 &&
				promptHandle.current instanceof PromptHandleNewItem &&
				promptHandle.current.parent.expanded && model.root.isItemVisibleAtSurface(promptHandle.current.parent) &&
				!promptHandle.current.destroyed) {
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
				onePromise = new Promise((res) => resolver = res)
				onePromise.then(() => {
					onePromise = null!
					resolver = null
					didUpdate()
				})
			}
			// (re)schedule update commitment
			clearTimeout(timer)
			timer = setTimeout(commitUpdate, BATCHED_UPDATE_MAX_DEBOUNCE_MS) as any
			return onePromise
		}
	}, [viewId])

	const supervisePrompt = useCallback((promptHandle: PromptHandleRename | PromptHandleNewItem) => {

		const {
			model,
			treeViewHandleExtended,
			 options: { treeDataProvider }  } = birchContextRef.current
	
		if (!promptHandle.destroyed) {

			// returning false from `onBlur` listener will prevent `PromptHandle` from being automatically destroyed
			promptHandle.onBlur(() => {
				return true
			})

			let didMarkInvalid = false
			promptHandle.onChange((currentValue) => {
				if (currentValue.trim() !== '' && false) {
					promptHandle.addClassName('invalid')
					didMarkInvalid = true
				} else {
					if (didMarkInvalid) {
						promptHandle.removeClassName('invalid')
						didMarkInvalid = false
					}
				}
			})

			let pulseTimer: number
			promptHandle.onCommit(async (newName) => {
				if (newName.trim() === '') {
					return
				}

				promptHandle.removeClassName('invalid')
				promptHandle.removeClassName('invalid-input-pulse')
				if (promptHandle instanceof PromptHandleRename) {
					const target = promptHandle.target
					const oldPath = target.path
					const newPath = model.root.pathfx.join(target.parent.path, newName)
					const res = await treeDataProvider.moveItem(target, target.parent, newPath)
					// "truthy" values won't be enough, must be explicit `true`
					if (res === true) {
						treeViewHandleExtended.current.onceDidUpdate(() => {
							treeViewHandleExtended.current.ensureVisible(target)
						})
						model.root.dispatch({
							type: EnumBirchWatchEvent.Moved,
							tid: target.tid,
							oldPath,
							newPath,
						})
					}
				} else if (promptHandle instanceof PromptHandleNewItem) {
					const parentDir = promptHandle.parent
					const newPath = model.root.pathfx.join(parentDir.path, newName)
					const maybeItem = await treeDataProvider.createItem(parentDir, newName, newPath, promptHandle.type)
					if (maybeItem && maybeItem.type && maybeItem.label) {
						model.root.dispatch({
							type: EnumBirchWatchEvent.Added,
							folder: parentDir.path,
							item: maybeItem,
						})
						treeViewHandleExtended.current.setActiveItem(newPath)
						treeViewHandleExtended.current.setPseudoActiveItem(null!)
						setTimeout(() => {
							const item = treeViewHandleExtended.current.getActiveItem()
							item.details.command && item.details.command.handler!(item)
							treeViewHandleExtended.current.events.emit(EnumTreeViewExtendedEvent.OnDidChangeSelection, item as BirchItem)
						}, 0)

					} else { console.log("Added but not notify in BirchUsePrompts", maybeItem) }
				}
			})
		}
	}, [viewId])

	const updatePromptHandle = useCallback((handle: PromptHandleNewItem | PromptHandleRename) => {

		if (promptHandle.current === handle) { return }

		if (promptHandle.current instanceof PromptHandle && !promptHandle.current.destroyed) {
			promptHandle.current.destroy()
		}

		handle.onDestroy(commitDebounce)

		promptHandle.current = handle

	}, [viewId])

	const promptRename = useCallback(async (pathOrItemEntry: string | BirchItem): Promise<PromptHandleRename> => {
	
	
		const {
			model,
			listRef,
		 } = birchContextRef.current

		
	
		await model.root.flushEventQueue()
		const itemEntry = typeof pathOrItemEntry === 'string'
			? await model.root.forceLoadItemEntryAtPath(pathOrItemEntry)
			: pathOrItemEntry

		if (!(itemEntry instanceof BirchItem) || itemEntry.constructor === BirchRoot) {
			throw new TypeError(`Cannot rename object of type ${typeof itemEntry}`)
		}
		const _promptHandle = new PromptHandleRename(itemEntry.label, itemEntry)
		updatePromptHandle(_promptHandle)
		promptTargetID.current = itemEntry.birchId
		if (!model.root.isItemVisibleAtSurface(itemEntry)) {
			await model.root.expandFolder(itemEntry.parent)
		} else {
			await commitDebounce()
		}

		if (listRef.current) {
			listRef.current.scrollToItem(model.root.getIndexAtItemEntryID(itemEntry.birchId))
		}

		return _promptHandle

	}, [viewId])

	const promptNew = useCallback(async (pathOrFolder: string | BirchFolder, type: EnumTreeItemType, iconPath?: string): Promise<PromptHandleNewItem> => {
	
		const {
			model,
			listRef } = birchContextRef.current
	
		await model.root.flushEventQueue()
		const folder = typeof pathOrFolder === 'string'
			? await model.root.forceLoadItemEntryAtPath(pathOrFolder)
			: pathOrFolder

		if (!(folder instanceof BirchFolder)) {
			throw new TypeError(`Cannot create new item prompt at object of type ${typeof folder}`)
		}

		if (type !== EnumTreeItemType.Item && type !== EnumTreeItemType.Folder) {
			throw new TypeError(`Invalid type supplied. Expected 'EnumTreeItemType.Item' or 'EnumTreeItemType.Folder', got ${type}`)
		}

		const _promptHandle = new PromptHandleNewItem(type, folder, iconPath)
		updatePromptHandle(_promptHandle)
		promptTargetID.current = folder.birchId
		if (folder !== model.root && (!folder.expanded || !model.root.isItemVisibleAtSurface(folder))) {
			// will trigger `update()` anyway
			await model.root.expandFolder(folder)
		} else {
			await commitDebounce()
		}
		if (listRef.current) {
			listRef.current.scrollToItem(newItemPromptInsertionIndex.current)
		}
		return _promptHandle
	}, [viewId])

	const promptNewFolder = useCallback((pathOrFolder: string | BirchFolder): Promise<PromptHandleNewItem> => {
		return promptNew(pathOrFolder, EnumTreeItemType.Folder, "")
	}, [viewId])

	const promptNewItem = useCallback((pathOrFolder: string | BirchFolder, iconPath?: string): Promise<PromptHandleNewItem> => {
		return promptNew(pathOrFolder, EnumTreeItemType.Item, iconPath)
	}, [viewId])

	const adjustedRowCount = useMemo(() => {

		const {
			model
	  } = birchContextRef.current

		return (
			(newItemPromptInsertionIndex.current > -1) &&
			promptHandle.current && promptHandle.current.constructor === PromptHandleNewItem &&
			!promptHandle.current.destroyed)
			? model.root.branchSize + 1
			: model.root.branchSize
	}, [promptHandle.current, newItemPromptInsertionIndex.current, birchContextRef.current.model.root.branchSize])

	const getItemAtIndex = useCallback((index: number): IBirchTreeItemProps => {

		const {
			model,
			idxTorendererPropsCache,
		  } = birchContextRef.current

		let cached: IBirchTreeItemProps = idxTorendererPropsCache.get(index)!

		if (!cached) {

			const promptInsertionIdx = newItemPromptInsertionIndex.current

			// new item prompt
			if (promptInsertionIdx > -1 &&

				promptHandle.current && promptHandle.current.constructor === PromptHandleNewItem &&
				!promptHandle.current.destroyed) {

				if (index === promptInsertionIdx) {

					cached = {
						itemType: (promptHandle.current as PromptHandleNewItem).type === EnumTreeItemType.Item ? EnumBirchItemType.NewItemPrompt : EnumBirchItemType.NewFolderPrompt,
						item: promptHandle.current as PromptHandleNewItem,
					} as any

				} else {

					const item = model.root.getItemEntryAtIndex(index - (index >= promptInsertionIdx ? 1 /* apply virtual backshift */ : 0))!
					cached = {
						itemType: item.constructor === BirchFolder ? EnumBirchItemType.BirchFolder : EnumBirchItemType.BirchItem,
						item,
					} as any

				}

			} else {

				const item = model.root.getItemEntryAtIndex(index)

				// check for rename prompt
				if (item && item.birchId === promptTargetID.current &&
					promptHandle.current && promptHandle.current.constructor === PromptHandleRename &&
					(promptHandle.current as PromptHandleRename).originalLabel === item.label &&
					!promptHandle.current.destroyed) {

					cached = {
						itemType: EnumBirchItemType.RenamePrompt,
						item: promptHandle.current as PromptHandleRename,
					}

				} else {

					cached = {
						itemType: item && item.constructor === BirchFolder ? EnumBirchItemType.BirchFolder : EnumBirchItemType.BirchItem,
						item,
					} as any

				}

			}

			idxTorendererPropsCache.set(index, cached)

		}

		return cached

	}, [viewId])

	Object.assign(birchContextRef.current,
		{
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


export const usePromptsChild = (itemType) => {

	const isRenamePrompt = itemType === EnumBirchItemType.RenamePrompt

	const isNewPrompt =
		itemType === EnumBirchItemType.NewFolderPrompt ||
		itemType === EnumBirchItemType.NewItemPrompt

	const isPrompt = isRenamePrompt || isNewPrompt

	return [isPrompt, isNewPrompt, isRenamePrompt]


}