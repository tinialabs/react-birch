import { BirchItem } from './BirchItem'
import { BirchRoot } from './BirchRoot'
import { IBirchWatcherEvent, EnumBirchWatchEvent, BirchWatchTerminator, IBirchTreeSupervisor } from '../../types/birch'
import { EnumTreeItemType, ITreeItem } from '../../types';

/**
 * Like Array.prototype.splice except this method won't throw
 * RangeError when given too many items (with spread operator as `...items`)
 *
 * Also items are concated straight up without having to use the spread operator
 *
 * Performance is more or less same as Array.prototype.splice
 *
 * @param arr Array to splice
 * @param start Start index where splicing should begin
 * @param deleteCount Items to delete (optionally replace with given items)
 * @param items Items to insert (when deleteCount is same as items.length, it becomes a replace)
 */
function spliceTypedArray(arr: Uint32Array, start: number, deleteCount: number = 0, items?: Uint32Array) {
	const a = new Uint32Array((arr.length - deleteCount) + (items ? items.length : 0))
	a.set(arr.slice(0, start))
	if (items) {
		a.set(items, start)
	}
	a.set(arr.slice(start + deleteCount, arr.length), (start + (items ? items.length : 0)))
	return a
}

export class BirchFolder extends BirchItem implements ITreeItem {
	private static defaultSortComparator(a: BirchItem | BirchFolder, b: BirchItem | BirchFolder) {
		if (a.constructor === b.constructor) {
			return a.label > b.label ? 1
				: a.label < b.label ? -1
					: 0
		}
		return a.constructor === BirchFolder ? -1
			: b.constructor === BirchFolder ? 1
				: 0
	}

	protected _children: Array<BirchFolder | BirchItem>
    /**
     * BirchFolder.children.length of self and all leafs (recursive) with isExpanded = true
     */
	protected _branchSize: number
	protected flattenedBranch: Uint32Array
	private isExpanded: boolean
	private watchTerminator: BirchWatchTerminator
	private hardReloadPromise: Promise<void>
	private hardReloadPResolver: () => void
	protected constructor(root: BirchRoot, tree: IBirchTreeSupervisor, parent: BirchFolder, folderName: string, details: ITreeItem) {
		super(root, tree, parent, folderName, details)
		this.isExpanded = false
		this._branchSize = 0
		this._children = null!
	}

	get type(): EnumTreeItemType {
		return EnumTreeItemType.Folder
	}

	get children() {
		return this._children ? this._children.slice() : null
	}

	get expanded() {
		return this.isExpanded
	}

	/**
	 * Number of *visible* flattened leaves this branch is incharge of (recursive)
	 *
	 * When a folder is expanded, its entire branch (recursively flattened) is owned by a branch higher up (either BirchRoot (at surface) or a branch in collapsed state (buried))
	 *
	 * When a folder is collapsed, its entire branch (recursively flattened) is "returned" back to it by one of its parent higher up
	 */
	get branchSize() {
		return this._branchSize
	}

	/**
	 * Ensures the children of this `BirchFolder` are loaded (without effecting the `expanded` state)
	 *
	 * If children are already loaded, returned `Promise` resolves immediately
	 *
	 * Otherwise a hard reload request is issued and returned `Promise` resolves when that process finishes.
	 *
	 * tl;dr: `BirchFolder#children` are accessible once the returned `Promise` resolves
	 */
	public async ensureLoaded() {
		if (this._children) {
			return
		}
		return this.hardReloadChildren()
	}

	public async setExpanded(ensureVisible = true) {
		if (this.isExpanded) {
			return
		}
		this.isExpanded = true
		if (this._children === null) {
			await this.hardReloadChildren()

			// check if still expanded; maybe setCollapsed was called in the meantime
			if (!this.isExpanded) {
				return
			}
		}

		if (ensureVisible && this.parent && this.parent !== this.root) {
			await this.parent.setExpanded(true)
		}

		// async (user might have changed their mind in the meantime)
		if (this.isExpanded) {
			this._superv.notifyWillChangeExpansionState(this, true)
			this.expandBranch(this)
			this._superv.notifyDidChangeExpansionState(this, true)
		}
	}

	public setCollapsed() {
		if (!this.isExpanded) {
			return
		}
		if (this._children && this.parent) {
			this._superv.notifyWillChangeExpansionState(this, false)
			this.shrinkBranch(this)
		}
		this.isExpanded = false

		this._superv.notifyDidChangeExpansionState(this, false)
	}

	/**
	 * Inserts the item into it's own parent (if not already)
	 *
	 * Gets called upon `IBirchWatcherAddEvent` or `IBirchWatcherMoveEvent`
	 *
	 * Calling this method directly WILL NOT trigger `onWillHandleWatchEvent` and `onDidHandleWatchEvent` events
	 *
	 * Prefer using `BirchRoot#dispatch` instead
	 */
	public insertItem(item: BirchItem | BirchFolder) {
		if (item.parent !== this) {
			item.mv(this, item.label)
			return
		}
		if (this._children.indexOf(item) > -1) {
			return
		}
		const branchSizeIncrease = 1 + ((item instanceof BirchFolder && item.expanded) ? item._branchSize : 0)
		this._children.push(item)
		this._children.sort(this.root.host.sortComparator as any || BirchFolder.defaultSortComparator)
		this._branchSize += branchSizeIncrease
		let master: BirchFolder = this
		while (!master.flattenedBranch) {
			if (master.parent) {
				master = master.parent
				master._branchSize += branchSizeIncrease
			}
		}
		let relativeInsertionIndex = this._children.indexOf(item)
		const leadingSibling = this._children[relativeInsertionIndex - 1]
		if (leadingSibling) {
			const siblingIdx = master.flattenedBranch.indexOf(leadingSibling.birchId)
			relativeInsertionIndex = siblingIdx + ((leadingSibling instanceof BirchFolder && leadingSibling.expanded) ? leadingSibling._branchSize : 0)
		} else {
			relativeInsertionIndex = master.flattenedBranch.indexOf(this.birchId)
		}
		const absInsertionIndex = relativeInsertionIndex + 1 // +1 to accomodate for itself

		const branch = new Uint32Array(branchSizeIncrease)
		branch[0] = item.birchId
		if (item instanceof BirchFolder && item.expanded && item.flattenedBranch) {
			branch.set(item.flattenedBranch, 1)
			item.setFlattenedBranch(null!)
		}
		master.setFlattenedBranch(spliceTypedArray(master.flattenedBranch, absInsertionIndex, 0, branch))
	}

	/**
	 * Removes the item from parent
	 *
	 * Gets called upon `IBirchWatcherRemoveEvent` or `IBirchWatcherMoveEvent`
	 *
	 * Calling this method directly WILL NOT trigger `onWillHandleWatchEvent` and `onDidHandleWatchEvent` events
	 *
	 * Prefer using `BirchRoot#dispatch` instead
	 */
	public unlinkItem(item: BirchItem | BirchFolder, reparenting: boolean = false): void {
		const idx = this._children.indexOf(item)
		if (idx === -1) {
			return
		}
		this._children.splice(idx, 1)
		const branchSizeDecrease = 1 + ((item instanceof BirchFolder && item.expanded) ? item._branchSize : 0)
		this._branchSize -= branchSizeDecrease
		// find out first owner of topDownFlatLeaves struct
		let master: BirchFolder = this
		while (!master.flattenedBranch) {
			if (master.parent) {
				master = master.parent
				master._branchSize -= branchSizeDecrease
			}
		}
		const removalBeginIdx = master.flattenedBranch.indexOf(item.birchId)
		if (removalBeginIdx === -1) {
			return
		}
		// is folder and DOES NOT owns its leaves (when folder is expanded, its leaves are owned by someone higher up) (except during transfers)
		if (item instanceof BirchFolder && item.expanded) {
			item.setFlattenedBranch(master.flattenedBranch.slice(removalBeginIdx + 1, removalBeginIdx + branchSizeDecrease))
		}
		master.setFlattenedBranch(spliceTypedArray(
			master.flattenedBranch,
			removalBeginIdx,
			branchSizeDecrease))

		if (!reparenting && item.parent === this) {
			item.mv(null!)
		}
	}

	public mv(to: BirchFolder, newName: string = this.label) {

		// get the old path before `super.mv` refreshes it
		const prevPath = this.path

		super.mv(to, newName)

		if (to && typeof this.watchTerminator === 'function') {
			this.watchTerminator(prevPath)
			// If we got children, we gotta watch em'!
			if (this._children) {
				this.watchTerminator = this._superv.supervisedWatch(this.path, this.handleWatchEvent)
			}
		}
		if (this._children) {
			for (let i = 0; i < this._children.length; i++) {
				const child = this._children[i]
				// It'll reset the cached resolved path
				child.mv(child.parent, child.label)
			}
		}
	}

    /**
     * WARNING: This will only stop watchers and clear bookkeeping records
     * To clean-up flattened branches and stuff, call BirchFolder#removeItem in the parent
     * BirchFolder#removeItem will call BirchFolder#dispose anyway
     */
	protected dispose() {
		if (typeof this.watchTerminator === 'function') {
			this.watchTerminator(this.path)
		}
		if (this._children) {
			this._children.forEach((child) => (child as BirchFolder).dispose())
		}
		super.dispose()
	}

	/**
	 * Using setter as BirchRoot needs to capture when the root flat tree is altered
	 */
	protected setFlattenedBranch(leaves: Uint32Array) {
		this.flattenedBranch = leaves
	}

	protected expandBranch(branch: BirchFolder) {
		if (this !== branch) {
			this._branchSize += branch._branchSize
		}
		// when `this` itself is in collapsed state, it'll just "adopt" given branch's leaves without propagating any further up
		if (this !== branch && this.flattenedBranch) {
			const injectionStartIdx = this.flattenedBranch.indexOf(branch.birchId) + 1
			this.setFlattenedBranch(spliceTypedArray(this.flattenedBranch, injectionStartIdx, 0, branch.flattenedBranch))
			// [CRITICAL] take "away" the branch ownership
			branch.setFlattenedBranch(null!)
		} else if (this.parent) {
			this.parent.expandBranch(branch)
		}
	}

	protected shrinkBranch(branch: BirchFolder) {
		if (this !== branch) {
			// branch size for `this` hasn't changed, `this` still has same number of leaves, but from parents frame of reference, their branch has shrunk
			this._branchSize -= branch._branchSize
		}
		if (this !== branch && this.flattenedBranch) {
			const removalStartIdx = this.flattenedBranch.indexOf(branch.birchId) + 1
			// [CRITICAL]  "return" the branch ownership
			branch.setFlattenedBranch(this.flattenedBranch.slice(removalStartIdx, removalStartIdx + branch._branchSize))
			this.setFlattenedBranch(spliceTypedArray(this.flattenedBranch, removalStartIdx, branch.flattenedBranch.length))
		} else if (this.parent) {
			this.parent.shrinkBranch(branch)
		}
	}

	protected async hardReloadChildren() {
		if (this.hardReloadPromise) {
			return this.hardReloadPromise
		}
		this.hardReloadPromise = new Promise((res) => this.hardReloadPResolver = res)
		this.hardReloadPromise.then(() => {
			this.hardReloadPromise = null!
			this.hardReloadPResolver = null!
		})
		
		const rawItemsPre = await this.root.host.getChildren({ path: this.path, tid: this._details.tid }) || []
		const rawItems = await Promise.all(rawItemsPre.map(raw => this.root.host.getTreeItem(raw)))

		if (this._children) {
			this.shrinkBranch(this) 
		}

		const flatTree = new Uint32Array(rawItems.length)
		this._children = Array(rawItems.length)
		for (let i = 0; i < rawItems.length; i++) {
			const rawTreeItem = rawItems[i]
			if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
				BirchItem.checkRawItem(rawTreeItem)
			}
			const { type, label, tid } = rawTreeItem
			const child = new (type === EnumTreeItemType.Folder ? BirchFolder : BirchItem)(this.root, this._superv, this, label || "untitled", rawTreeItem )
			this._children[i] = child
		}

		this._children.sort(this.root.host.sortComparator as any || BirchFolder.defaultSortComparator)

		for (let i = 0; i < rawItems.length; i++) {
			flatTree[i] = this._children[i].birchId
		}
		this._branchSize = flatTree.length
		this.setFlattenedBranch(flatTree)
		if (typeof this.watchTerminator === 'function') {
			this.watchTerminator(this.path)
		}

		this.watchTerminator = this._superv.supervisedWatch(this.path, this.handleWatchEvent)
		this.hardReloadPResolver()
	}

	/**
	 * Looks up for given item or folder at tid in the tree (pre-loaded tree only)
	 *
	 * This method, unlike `BirchRoot#forceLoadItemEntryAtPath`, WILL NOT, force load anything (synchronous for that reason)
	 */
	public findItemEntryInLoadedTreeById(tid: string): BirchItem | BirchFolder {
		let next = this._children

		var arrayLength = next.length;
		for (var i = 0; i < arrayLength; i++) {
			let item = next[i]
	
			if (item.tid === tid) { return item }

			if (item.type === EnumTreeItemType.Folder) {
				if ((item as BirchRoot)._children) {
					const result = (item as BirchFolder).findItemEntryInLoadedTreeById(tid)
					if (result) { return result }
				}
			}
		}

		return null! // the journey ends here for this folder

	}

	private handleWatchEvent = async (event: IBirchWatcherEvent) => {
		this._superv.notifyWillProcessWatchEvent(this, event)
		if (event.type === EnumBirchWatchEvent.DidChangeTreeData) {

			const { item: rawItem } = event
			BirchItem.checkRawItem(rawItem)
			const target = this.root.findItemEntryInLoadedTreeById(rawItem.tid!)

			if (target) {

				const oldPath = target.path
				const newPath = this.root.pathfx.join(target.parent.path, rawItem.label!)
				target["_details"] = rawItem
	
					this.root.dispatch({
						type: EnumBirchWatchEvent.Moved,
						tid: target.tid,
						oldPath,
						newPath,
					})

				if (target.type == EnumTreeItemType.Folder) {
					(target as BirchFolder).didChangeItem()
				}

				this._superv.notifyDidChangeTreeData(target)

			} else {
				console.log("BirchFolder handleWatchEvent could not find item id", rawItem.tid)
			}
		} else if (event.type === EnumBirchWatchEvent.Moved) {
			const { oldPath, newPath } = event
			if (typeof oldPath !== 'string') { throw new TypeError(`Expected oldPath to be a string`) }
			if (typeof newPath !== 'string') { throw new TypeError(`Expected newPath to be a string`) }
			if (this.root.pathfx.isRelative(oldPath)) { throw new TypeError(`oldPath must be absolute`) }
			if (this.root.pathfx.isRelative(newPath)) { throw new TypeError(`newPath must be absolute`) }
			this.transferItem(oldPath, newPath)
		} else if (event.type === EnumBirchWatchEvent.Added) {
			const { item: rawTreeItem } = event
			BirchItem.checkRawItem(rawTreeItem)
			const newItem = new (rawTreeItem.type === EnumTreeItemType.Folder ? BirchFolder : BirchItem)(this.root, this._superv, this, rawTreeItem.label!, rawTreeItem)
			this.insertItem(newItem)
		} else if (event.type === EnumBirchWatchEvent.Removed) {
			const { path } = event
			const folderName = this.root.pathfx.dirname(path)
			const label = this.root.pathfx.basename(path)
			if (folderName === this.path) {
				const item = this._children.find((c) => c.label === label)
				if (item) {
					this.unlinkItem(item)
				}
			}
		} else /* Maybe generic change event */ {
			// TODO: Try to "rehydrate" tree instead of hard reset (if possible) (using tid?)
			for (let i = 0; i < this._children.length; i++) {
				(this._children[i] as BirchFolder).dispose()
			}
			this.hardReloadChildren()
		}
		this._superv.notifyDidProcessWatchEvent(this, event)
	}


	protected async didChangeItem() {
		await super.didChangeItem()

		for (let i = 0; i < this._children.length; i++) {
			(this._children[i] as BirchFolder).dispose()
		}
		
		this.hardReloadChildren()
	}

	private transferItem(oldPath: string, newPath: string) {
		const { dirname, basename } = this.root.pathfx
		const from = dirname(oldPath)
		if (from !== this.path) {
			return
		}
		const label = basename(oldPath)
		const item = this._children.find((c) => c.label === label)
		if (!item) {
			return
		}
		const to = dirname(newPath)
		const destDir = to === from ? this : this.root.findItemEntryInLoadedTree(to)
		if (!(destDir instanceof BirchFolder)) {
			this.unlinkItem(item)
			return
		}
		item.mv(destDir, basename(newPath))
	}
}
