import { useEffect, useRef } from "react";
import { BirchFolder, BirchItem, BirchRoot, EnumBirchWatchEvent } from "../models";
import { EnumTreeItemType, EnumTreeViewExtendedEvent, ITreeViewExtendedHandle, IBirchContext, ITreeItem } from "../types";
import { Align } from 'react-window'
import { DisposablesComposite, EventEmitter } from 'birch-event-emitter';

export const useHandleApi = (birchContextRef: React.MutableRefObject<IBirchContext>) => {

	const disposables = useRef<DisposablesComposite>()
	const events = useRef<EventEmitter<EnumTreeViewExtendedEvent>>()
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
		   activeSelection: { activeItem,
			   pseudoActiveItem,
			   updateActiveItem,
			   updatePseudoActiveItem, },
		   prompts: { supervisePrompt,
			   promptRename,
			   promptNewFolder,
			   promptNewItem },
	   } = birchContextRef.current

		const getItemHandle = async (path: string, expandTree = true) => {
			const fileH = await model.root.forceLoadItemEntryAtPath(path)
			if (fileH && expandTree && !model.root.isItemVisibleAtSurface(fileH)) {
				await model.root.expandFolder(fileH.parent, true)
			}
			return fileH
		}

		const openFolder = async (pathOrFolder: string | BirchFolder) => {
			const folder: BirchFolder = typeof pathOrFolder === 'string'
				? await model.root.forceLoadItemEntryAtPath(pathOrFolder) as BirchFolder
				: pathOrFolder


			if (folder && folder.constructor === BirchFolder) {
				return model.root.expandFolder(folder)
			}
		}

		const closeFolder = async (pathOrFolder: string | BirchFolder) => {
			const folder: BirchFolder = typeof pathOrFolder === 'string'
				? await model.root.forceLoadItemEntryAtPath(pathOrFolder) as BirchFolder
				: pathOrFolder

			if (folder && folder.constructor === BirchFolder) {
				return model.root.collapseFolder(folder)
			}
		}

		const toggleFolder = async (pathOrDir: string | BirchFolder) => {
			const dir = typeof pathOrDir === 'string'
				? await getItemHandle(pathOrDir)
				: pathOrDir
			if (dir.type === EnumTreeItemType.Folder) {
				if ((dir as BirchFolder).expanded) {
					closeFolder(dir as BirchFolder)
				} else {
					openFolder(dir as BirchFolder)
				}
			}
		}

		const collapseAll = async () => {

			await model.root.flushEventQueue()

			const toFlatten: BirchFolder[] = []

			for (var _i = 0; _i < model.root.branchSize; _i++) {
				let entry = model.root.getItemEntryAtIndex(_i)!
				if (entry.type == EnumTreeItemType.Folder && (entry as BirchFolder).expanded) {
					toFlatten.push(entry as BirchFolder)
				}
			}

			toFlatten.forEach((entry) => entry.setCollapsed())

			updateActiveItem(null!)
			updatePseudoActiveItem(null!)
			events.current.emit(EnumTreeViewExtendedEvent.OnDidChangeSelection, null)

		}

		const scrollIntoView = (itemOrFolder: BirchItem | BirchFolder, align: Align = 'center') => {
			const idx = model.root.getIndexAtItemEntry(itemOrFolder)
			if (idx > -1) {
				if (listRef.current) {
					listRef.current.scrollToItem(idx, align)
				}
				return true
			}
			return false
		}

		const ensureVisible = async (pathOrItemEntry: string | BirchItem | BirchFolder, align: Align = 'auto') => {
			await model.root.flushEventQueue()

			const itemEntry = typeof pathOrItemEntry === 'string'
				? await model.root.forceLoadItemEntryAtPath(pathOrItemEntry)
				: pathOrItemEntry

			if (!(itemEntry instanceof BirchItem) || itemEntry.constructor === BirchRoot) {
				throw new TypeError(`Object not a valid BirchItem`)
			}
			if (scrollIntoView(itemEntry, align)) {
				return
			}
			await model.root.expandFolder(itemEntry.parent, true)
			if (listRef.current) {
				listRef.current.scrollToItem(model.root.getIndexAtItemEntry(itemEntry), align)
			}
		}

		const unlinkItem = async (fileOrDirOrPath: BirchItem | BirchFolder | string) => {
			const filedir = typeof fileOrDirOrPath === 'string'
				? await treeViewHandleExtended.current.getItemHandle(fileOrDirOrPath)
				: fileOrDirOrPath

			model.root.dispatch({
				type: EnumBirchWatchEvent.Removed,
				tid: filedir.tid,
				path: filedir.path,
			})
		}

		const createdItem = async (item: ITreeItem, parentDir: BirchFolder) => {

			console.log("createdItem", item.tid, parentDir.tid)

			const newName = item.label

			const newPath = model.root.pathfx.join(parentDir.path, newName)

			if (item.type && item.label) {
				model.root.dispatch({
					type: EnumBirchWatchEvent.Added,
					folder: parentDir.path,
					item: item,
				})
				treeViewHandleExtended.current.setActiveItem(newPath)
				treeViewHandleExtended.current.setPseudoActiveItem(null!)
				setTimeout(() => {
					const item = treeViewHandleExtended.current.getActiveItem()
					item.details.command && item.details.command.handler!(item)
					treeViewHandleExtended.current.events.emit(EnumTreeViewExtendedEvent.OnDidChangeSelection, item as BirchItem)
				}, 0)

			}

		}

		const handle: ITreeViewExtendedHandle = {

			id,

			getModel: () => model,

			getActiveItem: () => birchContextRef.current.activeSelection.activeItem,
			setActiveItem: updateActiveItem,
			getPseudoActiveItem: () => birchContextRef.current.activeSelection.pseudoActiveItem,
			setPseudoActiveItem: updatePseudoActiveItem,

			openFolder: openFolder,
			closeFolder: closeFolder,
			toggleFolder: toggleFolder,
			collapseAll: collapseAll,
			getItemHandle: getItemHandle,
			ensureVisible: ensureVisible,

			unlinkItem: async (fileOrDirOrPath: BirchItem | BirchFolder | string) => unlinkItem(fileOrDirOrPath),
			rename: async (fileOrDirOrPath: BirchItem | BirchFolder | string) => supervisePrompt(await promptRename(fileOrDirOrPath as any)),
			newItem: async (dirOrPath: BirchFolder | string, iconPath?: string) => {
				const result = await promptNewItem(dirOrPath as any, iconPath)
				supervisePrompt(result)
			},
			newFolder: async (dirOrPath: BirchFolder | string) => {
				const result = await promptNewFolder(dirOrPath as any)
				supervisePrompt(result)	
			},
			createdItem: async (item: ITreeItem, parentDir: BirchFolder) => createdItem(item, parentDir),
			onBlur: (callback) => events.current.on(EnumTreeViewExtendedEvent.OnBlur, callback),
			onDidChangeSelection: (callback) => events.current.on(EnumTreeViewExtendedEvent.OnDidChangeSelection, callback),
			hasDirectFocus: () => wrapperRef.current === document.activeElement,

			onDidChangeModel: (callback) => events.current.on(EnumTreeViewExtendedEvent.DidChangeModel, callback),
			onceDidChangeModel: (callback) => events.current.once(EnumTreeViewExtendedEvent.DidChangeModel, callback),
			onDidUpdate: (callback) => events.current.on(EnumTreeViewExtendedEvent.DidUpdate, callback),
			onceDidUpdate: (callback) => events.current.once(EnumTreeViewExtendedEvent.DidUpdate, callback),

			events: events.current,

		}

		if (typeof onReady === 'function') {
			onReady(handle)
		}

		treeViewHandleExtended.current = handle

	}, [viewId])

}