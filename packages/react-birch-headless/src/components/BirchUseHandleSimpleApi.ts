import { useEffect, useRef } from 'react'
import { DisposablesComposite, EventEmitter } from 'react-birch-event-emitter'

import { observable } from 'mobx'
import {
  EnumTreeViewEventType,
  IBirchItem,
  IDisposable
} from 'react-birch-types'

import type {
  ITreeViewOptions,
  IBirchContext,
  ITreeDataProvider,
  IBirchTreeViewHandle,
  ITreeItem,
  ITreeViewExpansionEvent,
  ITreeViewSelectionChangeEvent,
  ITreeViewVisibilityChangeEvent
} from 'react-birch-types'

export class TreeViewHandle implements IBirchTreeViewHandle {
  protected disposers: (() => void)[] = []

  private viewId: string

  dataProvider: ITreeDataProvider

  public events: EventEmitter<EnumTreeViewEventType>

  @observable
  selection: ITreeItem[]

  @observable
  visible: boolean

  constructor(viewId: string, options: ITreeViewOptions, disposer: () => void) {
    this.events = new EventEmitter<EnumTreeViewEventType>()
    this.dataProvider = options.treeDataProvider
    this.viewId = viewId
    this.disposers.push(disposer)
  }

  public static registerTreeDataProvider(
    viewId: string,
    treeDataProvider: ITreeDataProvider
  ): IDisposable {
    return this.createTreeView(viewId, {
      treeDataProvider,
      contributes: {
        contextMenus: [],
        itemMenus: [],
        keybindings: [],
        titleMenus: []
      },
      rootPath: 'ROOT'
    })
  }

  public static createTreeView(
    viewId: string,
    options: ITreeViewOptions
  ): IBirchTreeViewHandle {
    return new TreeViewHandle(viewId, options, () => undefined)
  }

  onDidExpandElement(handler: (event: ITreeViewExpansionEvent) => void) {
    return this.events.on(EnumTreeViewEventType.didExpand, handler)
  }

  onDidCollapseElement(handler: (event: ITreeViewExpansionEvent) => void) {
    return this.events.on(EnumTreeViewEventType.didCollapse, handler)
  }

  onDidChangeSelection(callback: (selection: IBirchItem) => void) {
    return this.events.on(
      EnumTreeViewEventType.didChangeSelection,
      (event: ITreeViewSelectionChangeEvent) => {
        callback(event.selection[0] as IBirchItem)
      }
    )
  }

  onDidChangeVisibility(
    handler: (event: ITreeViewVisibilityChangeEvent) => void
  ) {
    return this.events.on(EnumTreeViewEventType.didChangeVisibility, handler)
  }

  public async reveal(
    element: ITreeItem,
    options?: { select?: boolean; focus?: boolean; expand?: boolean | number }
  ): Promise<void> {
    throw new Error('not yet implemented')
  }

  dispose(): void {
    this.events.clear()
    this.disposers.forEach((d) => d())
  }
}

export const useHandleSimpleApi = (
  birchContextRef: React.MutableRefObject<IBirchContext>
) => {
  const disposables = useRef<DisposablesComposite>()

  const viewId = birchContextRef.current.viewId

  useEffect(() => {
    disposables.current = new DisposablesComposite()

    return () => {
      disposables.current.dispose()
    }
  }, [viewId])

  useEffect(() => {
    const { treeViewHandleExtended, treeViewHandleSimple, model, forceUpdate } =
      birchContextRef.current

    disposables.current.add(
      treeViewHandleExtended.current.onDidChangeSelection((e) => {
        treeViewHandleSimple.events!.emit(
          EnumTreeViewEventType.didChangeSelection,
          e ? { tid: e.tid, path: e.path } : { path: null }
        )
      })
    )

    disposables.current.add(
      model.root.onDidChangeFolderExpansionState((dir, expanded) => {
        if (expanded) {
          treeViewHandleSimple.events!.emit(EnumTreeViewEventType.didExpand, {
            tid: dir.tid,
            path: dir.path
          })
        } else {
          treeViewHandleSimple.events!.emit(EnumTreeViewEventType.didCollapse, {
            tid: dir.tid,
            path: dir.path
          })
        }
      })
    )

    disposables.current.add(
      model.root.onDidChangeTreeData((item) => {
        item.forceUpdate?.call(item)
        forceUpdate()
      })
    )
  }, [])
}
