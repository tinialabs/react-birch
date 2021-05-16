import { EventEmitter, DisposablesComposite } from 'react-birch-event-emitter'
import { EnumBirchTreeStateEvent } from 'react-birch-types'
import { BirchDecorationManager } from './BirchDecorationManager'
import { BirchRoot } from './BirchRoot'
import type {
  IDisposable,
  ITreeViewOptions,
  IBirchCoreHost,
  IBirchFolder,
  IBirchDecorationManager,
  IBirchRoot
} from 'react-birch-types'

export class BirchTreeViewModel {
  public readonly root: IBirchRoot

  public readonly decorations: IBirchDecorationManager

  private events: EventEmitter<EnumBirchTreeStateEvent> = new EventEmitter()

  private expandedFolders: Map<IBirchFolder, string> = new Map()

  private _scrollOffset: number = 0

  public readonly viewId: string

  private disposables: DisposablesComposite = new DisposablesComposite()

  constructor({
    options,
    viewId
  }: {
    options: ITreeViewOptions
    viewId: string
  }) {
    this.viewId = viewId

    const host: IBirchCoreHost = {
      ...options.treeDataProvider,
      pathStyle: 'unix',
      watch: options.treeDataProvider.watch
    }

    this.root = new BirchRoot(host, options.rootPath, viewId)

    this.events = new EventEmitter()

    this.disposables.add(
      this.root.onDidChangeFolderExpansionState(this.handleExpansionChange)
    )
    this.disposables.add(this.root.onDidChangePath(this.handleDidChangePath))

    this.disposables.add(this.root.onDidBranchUpdate(this.dispatchChange))

    this.decorations = new BirchDecorationManager(this.root, viewId)
  }

  dispose() {
    this.decorations.dispose()
    this.disposables.dispose()
    this.events.clear()
  }

  public onChange(callback: () => void): IDisposable {
    return this.events.on(EnumBirchTreeStateEvent.DidChange, callback)
  }

  private dispatchChange = () => {
    this.events.emit(EnumBirchTreeStateEvent.DidChange)
  }

  get scrollOffset() {
    return this._scrollOffset
  }

  public saveScrollOffset(scrollOffset: number) {
    this._scrollOffset = scrollOffset
    this.events.emit(
      EnumBirchTreeStateEvent.DidChangeScrollOffset,
      scrollOffset
    )
  }

  public onChangeScrollOffset(
    callback: (newOffset: number) => void
  ): IDisposable {
    return this.events.on(
      EnumBirchTreeStateEvent.DidChangeScrollOffset,
      callback
    )
  }

  public onDidChangeFolderExpansionState(
    callback: (
      relDirPath: string,
      nowExpanded: boolean,
      visibleAtSurface: boolean
    ) => void
  ): IDisposable {
    return this.events.on(
      EnumBirchTreeStateEvent.DidChangeFolderExpansionState,
      callback
    )
  }

  public onDidChangeRelativePath(
    callback: (prevPath: string, newPath: string) => void
  ): IDisposable {
    return this.events.on(
      EnumBirchTreeStateEvent.DidChangeRelativePath,
      callback
    )
  }

  private handleExpansionChange = (
    target: IBirchFolder,
    isExpanded: boolean,
    isVisibleAtSurface: boolean
  ) => {
    let relativePath = this.expandedFolders.get(target)

    if (isExpanded && !relativePath) {
      relativePath = this.root.pathfx.relative(this.root.path, target.path)
      this.expandedFolders.set(target, relativePath)
      this.events.emit(
        EnumBirchTreeStateEvent.DidChangeFolderExpansionState,
        relativePath,
        isExpanded,
        isVisibleAtSurface
      )
    } else if (!isExpanded && relativePath) {
      this.expandedFolders.delete(target)
      this.events.emit(
        EnumBirchTreeStateEvent.DidChangeFolderExpansionState,
        relativePath,
        isExpanded,
        isVisibleAtSurface
      )
    }
  }

  private handleDidChangePath = (target: IBirchFolder) => {
    if (this.expandedFolders.has(target)) {
      const prevPath = this.expandedFolders.get(target)
      const newPath = this.root.pathfx.relative(this.root.path, target.path)
      this.expandedFolders.set(target, newPath)
      this.events.emit(
        EnumBirchTreeStateEvent.DidChangeRelativePath,
        prevPath,
        newPath
      )
    }
  }
}
