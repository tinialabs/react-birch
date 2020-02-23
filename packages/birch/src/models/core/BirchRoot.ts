import {
  Disposable,
  DisposablesComposite,
  IDisposable,
  EventEmitter
} from 'birch-event-emitter'
import * as pSeries from 'p-series'
import { PathFx, unix, win32 } from 'path-fx'
import { BirchFolder } from './BirchFolder'
import { BirchItem } from './BirchItem'
import {
  BirchTreeEvent,
  IBirchCoreHost,
  IBirchTreeSupervisor,
  IBirchWatcherEvent,
  BirchWatcherCallback,
  EnumBirchWatchEvent,
  BirchWatchTerminator
} from '../../types/birch'

import { BirchItemOrFolder } from '..'

import { EnumTreeItemType, ITreeItem } from '../../types'

interface IBirchWatcherInfo {
  terminator: BirchWatchTerminator
  callback: BirchWatcherCallback
}

export class BirchRoot extends BirchFolder {
  public readonly host: IBirchCoreHost<any>

  private readonly _pathfx: PathFx

  private rootPath: string

  private events: EventEmitter<BirchTreeEvent>

  private onceItemVisibleWatchers: WeakMap<
    BirchItemOrFolder,
    {
      item: BirchItemOrFolder
      disposer: DisposablesComposite
      callbacks: Set<(item: BirchItemOrFolder) => void>
    }
  >

  private onceFolderExpandedWatchers: WeakMap<
    BirchFolder,
    Set<
      (
        folder: BirchFolder,
        nowExpanded: boolean,
        visibleAtSurface: boolean
      ) => void
    >
  >

  private onceDisposedWatchers: WeakMap<
    BirchItemOrFolder,
    Set<(target: BirchItemOrFolder) => void>
  >

  private onceParentChangedWatchers: WeakMap<
    BirchItemOrFolder,
    Set<
      (
        target: BirchItemOrFolder,
        prevParent: BirchFolder,
        newParent: BirchFolder
      ) => void
    >
  >

  private fswatchers: Map<string, IBirchWatcherInfo>

  /**
   * When a big chain of generic "change" events come our way, we batch them up in a queue and dispatch them "efficently" after 't' milliseconds.
   *
   * This is usually in case of chokidar watcher when usePolling is enabled (https://www.npmjs.com/package/chokidar#performance)
   *
   * ONLY GENERIC CHANGE EVENTS GET QUEUED, OTHER SPECIFIC EVENTS ARE DISPATCHED AS THEY COME
   */
  private changeEventDispatchQueue: [string, string][]

  /**
   * Timeout after which all queued change events will be auto fired and list will be flushed for next use
   */
  private eventFlushTimeout: number

  public readonly viewId: string

  constructor(host: IBirchCoreHost<any>, root: string, viewId: string) {
    const pathfx = host.pathStyle === 'win32' ? win32 : unix
    if (pathfx.isRelative(root)) {
      throw new Error(
        `BirchRoot path must be absolute. Example: 'C:\\Users\\Desktop' or '/home/desktop'`
      )
    }

    const superv: IBirchTreeSupervisor = {
      notifyDidChangeTreeData: (t: BirchItemOrFolder) => {
        this.events.emit(BirchTreeEvent.DidChangeTreeData, t)
      },
      notifyWillProcessWatchEvent: (
        t: BirchFolder,
        event: IBirchWatcherEvent
      ) => {
        this.events.emit(BirchTreeEvent.WillProcessWatchEvent, t, event)
      },
      notifyDidProcessWatchEvent: (
        t: BirchFolder,
        event: IBirchWatcherEvent
      ) => {
        this.events.emit(BirchTreeEvent.DidProcessWatchEvent, t, event)
      },
      notifyDidChangePath: (t: BirchItemOrFolder) => {
        this.events.emit(BirchTreeEvent.DidChangePath, t)
      },
      notifyWillChangeParent: (
        t: BirchItemOrFolder,
        prevParent: BirchFolder,
        newParent: BirchFolder
      ) => {
        this.events.emit(
          BirchTreeEvent.WillChangeParent,
          t,
          prevParent,
          newParent
        )
      },
      notifyDidChangeParent: (
        t: BirchItemOrFolder,
        prevParent: BirchFolder,
        newParent: BirchFolder
      ) => {
        if (this.onceParentChangedWatchers.has(t)) {
          const callbacks = this.onceParentChangedWatchers.get(t)
          callbacks.forEach(cb => {
            cb(t, prevParent, newParent)
          })
          this.onceParentChangedWatchers.delete(t)
        }
        this.events.emit(
          BirchTreeEvent.DidChangeParent,
          t,
          prevParent,
          newParent
        )
      },
      notifyWillDispose: (t: BirchItemOrFolder) => {
        this.events.emit(BirchTreeEvent.WillDispose, t)
      },
      notifyDidDispose: (t: BirchItemOrFolder) => {
        if (this.onceDisposedWatchers.has(t)) {
          const callbacks = this.onceDisposedWatchers.get(t)
          callbacks.forEach(cb => {
            cb(t)
          })
          this.onceDisposedWatchers.delete(t)
        }
        this.events.emit(BirchTreeEvent.DidDispose, t)
      },
      notifyWillChangeExpansionState: (
        t: BirchFolder,
        nowExpanded: boolean
      ) => {
        this.events.emit(
          BirchTreeEvent.WillChangeExpansionState,
          t,
          nowExpanded
        )
      },
      notifyDidChangeExpansionState: (t: BirchFolder, nowExpanded: boolean) => {
        const isVisibleAtSurface = this.isItemVisibleAtSurface(t)
        if (t.expanded) {
          if (this.onceItemVisibleWatchers.has(t) && isVisibleAtSurface) {
            const {
              callbacks,
              disposer,
              item
            } = this.onceItemVisibleWatchers.get(t)!
            callbacks.forEach(cb => {
              cb(item)
            })
            disposer.dispose()
          }
          if (this.onceFolderExpandedWatchers.has(t)) {
            const callbacks = this.onceFolderExpandedWatchers.get(t)!
            callbacks.forEach(cb => {
              cb(t, nowExpanded, isVisibleAtSurface)
            })
            this.onceFolderExpandedWatchers.delete(t)
          }
        }
        this.events.emit(
          BirchTreeEvent.DidChangeExpansionState,
          t,
          nowExpanded,
          isVisibleAtSurface
        )
      },
      supervisedWatch: (
        path: string,
        callback: BirchWatcherCallback
      ): BirchWatchTerminator => {
        path = pathfx.normalize(path)
        // Might be overwritten if host.watch is available
        let terminator: BirchWatchTerminator = this.terminateWatch
        if (host && typeof host.watch === 'function') {
          terminator = host.watch(path)
        }

        this.fswatchers.set(path, { terminator, callback })
        return terminator
      }
    }

    host.onDidChangeTreeData(async preItemRaw => {
      const item = preItemRaw
        ? await host.getTreeItem(preItemRaw)
        : (this as ITreeItem)

      this.dispatch({
        type: EnumBirchWatchEvent.DidChangeTreeData,
        item
      })
    })

    // BirchRoot has no "parent" and no applicable "folderName" or "filename"
    super(null!, superv, null!, null!, { tid: 'ROOT' } as ITreeItem)
    this._pathfx = pathfx
    this.viewId = viewId
    this.host = host
    this.rootPath = root
    this.events = new EventEmitter()
    this.onceItemVisibleWatchers = new WeakMap()
    this.onceFolderExpandedWatchers = new WeakMap()
    this.onceDisposedWatchers = new WeakMap()
    this.onceParentChangedWatchers = new WeakMap()
    this.changeEventDispatchQueue = []
    this.fswatchers = new Map()
    this.terminateWatch = this.terminateWatch.bind(this)
    super.setExpanded()
  }

  /**
   * Path utils like `join`, `basename`, `folderName` etc.
   *
   * Use utils from this object to ensure all operations are compliant with path style as specified by the host
   */
  public get pathfx() {
    return this._pathfx
  }

  public get expanded() {
    return true
  }

  public get path() {
    return this.rootPath
  }

  public onDidChangeTreeData(
    cb: (item: BirchItemOrFolder) => void
  ): IDisposable {
    return this.events.on(BirchTreeEvent.DidChangeTreeData, cb)
  }

  public onDidChangeFolderExpansionState(
    cb: (
      folder: BirchFolder,
      nowExpanded: boolean,
      visibleAtSurface: boolean
    ) => void
  ): IDisposable {
    return this.events.on(BirchTreeEvent.DidChangeExpansionState, cb)
  }

  public onWillChangeFolderExpansionState(
    cb: (folder: BirchFolder, nowExpanded: boolean) => void
  ): IDisposable {
    return this.events.on(BirchTreeEvent.WillChangeExpansionState, cb)
  }

  public onWillProcessWatchEvent(
    cb: (folder: BirchFolder, event: IBirchWatcherEvent) => void
  ): IDisposable {
    return this.events.on(BirchTreeEvent.WillProcessWatchEvent, cb)
  }

  public onDidProcessWatchEvent(
    cb: (folder: BirchFolder, event: IBirchWatcherEvent) => void
  ): IDisposable {
    return this.events.on(BirchTreeEvent.DidProcessWatchEvent, cb)
  }

  public onDidBranchUpdate(cb: () => void): IDisposable {
    return this.events.on(BirchTreeEvent.BranchDidUpdate, cb)
  }

  public onWillDispose(cb: (target: BirchItemOrFolder) => void): IDisposable {
    return this.events.on(BirchTreeEvent.WillDispose, cb)
  }

  public onDidDispose(cb: (target: BirchItemOrFolder) => void): IDisposable {
    return this.events.on(BirchTreeEvent.DidDispose, cb)
  }

  public onDidChangeParent(
    callback: (
      target: BirchItemOrFolder,
      prevParent: BirchFolder,
      newParent: BirchFolder
    ) => void
  ): IDisposable {
    return this.events.on(BirchTreeEvent.DidChangeParent, callback)
  }

  public onWillChangeParent(
    callback: (
      target: BirchItemOrFolder,
      prevParent: BirchFolder,
      newParent: BirchFolder
    ) => void
  ): IDisposable {
    return this.events.on(BirchTreeEvent.WillChangeParent, callback)
  }

  public onDidChangePath(
    callback: (target: BirchItemOrFolder) => void
  ): IDisposable {
    return this.events.on(BirchTreeEvent.DidChangePath, callback)
  }

  public onOnceDisposed(
    target: BirchItemOrFolder,
    callback: (target: BirchItemOrFolder) => void
  ): IDisposable {
    if (target.disposed) {
      callback(target)
      return new Disposable(() => {
        /** empty */
      })
    }
    if (!this.onceDisposedWatchers.has(target)) {
      this.onceDisposedWatchers.set(target, new Set())
    }
    const callbacks = this.onceDisposedWatchers.get(target)!
    callbacks.add(callback)
    return new Disposable(() => {
      callbacks.delete(callback)
      if (callbacks.size === 0) {
        this.onceDisposedWatchers.delete(target)
      }
    })
  }

  public expandFolder(folder: BirchFolder, ensureVisible = true) {
    return (folder as BirchRoot).setExpanded(ensureVisible)
  }

  public collapseFolder(folder: BirchFolder) {
    return (folder as BirchRoot).setCollapsed()
  }

  public dispatch(event: IBirchWatcherEvent): void {
    switch (event.type) {
      case EnumBirchWatchEvent.Moved:
        return this.dispatchWatchEvent(
          this.pathfx.dirname(event.oldPath),
          event
        )
      case EnumBirchWatchEvent.Removed:
        return this.dispatchWatchEvent(this.pathfx.dirname(event.path), event)
      case EnumBirchWatchEvent.Added:
        return this.dispatchWatchEvent(event.folder, event)
      case EnumBirchWatchEvent.Changed:
        return this.queueChangeEvent([event.folder, event.tid])
      case EnumBirchWatchEvent.DidChangeTreeData:
        return this.dispatchWatchEvent(this.rootPath, event)
      default:
        return null
    }
  }

  public getIndexAtItemEntryID(id: number) {
    return this.flattenedBranch.indexOf(id)
  }

  /**
   * Reverse of `BirchRoot#getItemEntryAtIndex`
   */
  public getIndexAtItemEntry(itemEntry: BirchItemOrFolder) {
    return this.flattenedBranch.indexOf(itemEntry.birchId)
  }

  /**
   * Lookup flattened tree structure by index
   *
   * `BirchRoot` manages the flattened structure, which is automatically adjusted whenever a child BirchFolder is expanded or collapsed
   *
   * Total number of items that "can" be visible at surface can be accessed by `BirchRoot#branchSize`
   *
   * Most windowing libraries will require you to specify item count, and upon rendering they will require data for an arbitrary index number
   *
   * Use `BirchRoot#branchSize` and `BirchRoot#getItemEntryAtIndex` respectively.
   *
   */
  public getItemEntryAtIndex(index: number) {
    const id = this.flattenedBranch[index]
    return BirchItem.getItemEntryById(id)
  }

  /**
   * Looks up for given item or folder at path in the tree (pre-loaded tree only)
   *
   * This method, unlike `BirchRoot#forceLoadItemEntryAtPath`, WILL NOT, force load anything (synchronous for that reason)
   */
  public findItemEntryInLoadedTree(path: string): BirchItemOrFolder {
    const pathfrags = this.pathfx.isRelative(path)
      ? this.pathfx.splitPath(path)
      : this.walkPathTillRelative(path)
    if (pathfrags.length === 0) {
      return this
    }
    let next = this._children
    let label
    // eslint-disable-next-line no-cond-assign
    while ((label = pathfrags.shift())) {
      // eslint-disable-next-line no-loop-func
      const item = next.find(c => c.label === label)
      if (item && pathfrags.length === 0) {
        return item
      }
      if (
        !item ||
        // we hit a dead end while we still had path to traverse
        (item.type === EnumTreeItemType.Item && pathfrags.length > 0)
      ) {
        return undefined!
      }
      if (item.type === EnumTreeItemType.Folder) {
        if (!(item as BirchRoot)._children) {
          return null! // the journey ends here
        }
        next = (item as BirchRoot)._children
      }
    }
    return undefined!
  }

  /**
   * Brute force variant of `BirchRoot#findItemEntryInLoadedTree`.
   *
   * This method will force load children of `BirchFolder` if it comes in way of specified path. However, it will not affect visual state of tree.
   */
  public async forceLoadItemEntryAtPath(
    path: string
  ): Promise<BirchFolder | BirchItem> {
    const pathfrags = this.pathfx.isRelative(path)
      ? this.pathfx.splitPath(path)
      : this.walkPathTillRelative(path)
    if (pathfrags.length === 0) {
      return this
    }
    await this.ensureLoaded()
    let next = this._children
    let label
    // eslint-disable-next-line no-cond-assign
    while ((label = pathfrags.shift())) {
      // eslint-disable-next-line no-loop-func
      const item = next.find(c => c.label === label)
      if (item && pathfrags.length === 0) {
        return item
      }
      if (
        !item ||
        // we hit a dead end while we still had path to traverse
        (item.type === EnumTreeItemType.Item && pathfrags.length > 0)
      ) {
        return undefined!
      }
      if (item.type === EnumTreeItemType.Folder) {
        if (!(item as BirchRoot)._children) {
          // eslint-disable-next-line no-await-in-loop
          await (item as BirchRoot).hardReloadChildren()
        }
        next = (item as BirchRoot)._children
      }
    }
    return undefined!
  }

  /**
   * Checks if an item is visible at surface, as opposed to being buried in the tree.
   *
   * "Visible" here does not mean visible in the current view/scroll state of rendered content. Instead, it means the item "can" be visible if scolled to the right spot.
   *
   * "Buried" means that item may (or may not) be inside an expanded folder, but at least one of its parent folder is in collapsed state preventing it
   * from being "visible" at surface.
   */
  public isItemVisibleAtSurface(item: BirchItemOrFolder): boolean {
    if (item === this) {
      return true
    }
    return this.flattenedBranch.indexOf(item.birchId) > -1
  }

  public async setExpanded(_ensureVisible?: boolean): Promise<void> {
    // noop: BirchRoot cannot be expanded
  }

  public setCollapsed() {
    // noop: BirchRoot cannot be collapsed
  }

  public async flushEventQueue() {
    if (this.changeEventDispatchQueue.length === 0) {
      return null
    }
    this.changeEventDispatchQueue.sort((pathA, pathB) => {
      const pathADepth = this.pathfx.pathDepth(pathA[0])
      const pathBDepth = this.pathfx.pathDepth(pathB[0])
      return pathADepth - pathBDepth
    })
    const promise = pSeries(
      this.changeEventDispatchQueue.map(path => async () => {
        const watcher = this.fswatchers.get(path[0])
        if (watcher && typeof watcher.callback === 'function') {
          await watcher.callback({
            type: EnumBirchWatchEvent.Changed,
            tid: path[1],
            folder: path[0]
          })
        }
        return null
      }) as any
    )
    // reset the queue
    this.changeEventDispatchQueue = []
    return promise
  }

  protected setFlattenedBranch(branch: Uint32Array) {
    this.flattenedBranch = branch
    this.events.emit(BirchTreeEvent.BranchDidUpdate)
  }

  private walkPathTillRelative(path: string): string[] {
    if (typeof path !== 'string') {
      throw new TypeError('Path must of type string')
    }
    const { splitPath, join } = this.pathfx
    const pathfrags = splitPath(path)
    const rootPrefix = splitPath(this.path)
    let nextRootFrag
    const matched: any[] = []
    // eslint-disable-next-line no-cond-assign
    while ((nextRootFrag = rootPrefix.shift())) {
      if (nextRootFrag === pathfrags[0]) {
        matched.push(pathfrags.shift())
      } else {
        throw new Error(
          `'${path}' stopped matching after '${join(...matched)}'`
        )
      }
    }
    return pathfrags
  }

  /**
   * ItemTreeView's watcher queues up FS events instead of dispatching them immediately for performance reasons
   * Event queue is flushed after 't' milliseconds after last FS event is dispatched by host.
   * Call it directly if some component requires ItemTreeView to be up to date with any changes.
   *
   * ONLY GENERIC CHANGE EVENTS ARE QUEUED, OTHER SPECIFIC EVENTS ARE DISPATCHED AS THEY COME
   */
  private queueChangeEvent(pathtid: [string, string]) {
    clearTimeout(this.eventFlushTimeout)
    this.eventFlushTimeout = setTimeout(this.flushEventQueue, 150) as any
    this.changeEventDispatchQueue.push(pathtid)
  }

  private dispatchWatchEvent(path: string, event: IBirchWatcherEvent) {
    const watcher = this.fswatchers.get(this.pathfx.normalize(path))
    if (watcher && watcher.callback) {
      watcher.callback(event)
    }
  }

  private terminateWatch(path: string) {
    this.fswatchers.delete(this.pathfx.normalize(path))
  }
}
