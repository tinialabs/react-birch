import { useEffect, useRef } from "react";
import {  ITreeViewOptions, EnumTreeViewEventType, IBirchContext } from "../types";
import { DisposablesComposite } from 'birch-event-emitter';

import { EventEmitter } from 'birch-event-emitter'
import { observable } from 'mobx';

import {
    ITreeDataProvider,
    ITreeViewHandle,
    ITreeItem,
    ITreeViewExpansionEvent,
    ITreeViewSelectionChangeEvent,
    ITreeViewVisibilityChangeEvent,
} from '../types'

type Disposer = () => void

export class TreeViewHandle<T> implements ITreeViewHandle<T> {

    public static registerTreeDataProvider<T>(viewId: string, treeDataProvider: ITreeDataProvider<T>): Disposer {
        return this.createTreeView(viewId, { 
            treeDataProvider,
            contributes: {
                contextMenus: [],
                itemMenus: [],
                keybindings: [],
                titleMenus: []
            },
            rootPath: 'ROOT'
        }).dispose
    }

    public static createTreeView<T>(viewId: string, options: ITreeViewOptions<T>): ITreeViewHandle<T> {
        return new TreeViewHandle(viewId, options, () => void 0)
    }

    protected disposers: (() => void)[] = []
    private viewId: string
    dataProvider: ITreeDataProvider<T>

    public events: EventEmitter<EnumTreeViewEventType>

    @observable
    selection: ITreeItem[];

    @observable
    visible: boolean;

    constructor(viewId: string, options: ITreeViewOptions<T>, disposer: () => void) {
        this.events = new EventEmitter<EnumTreeViewEventType>()
        this.dataProvider = options.treeDataProvider
        this.viewId = viewId
        this.disposers.push(disposer)
    }

    onDidExpandElement(handler: (event: ITreeViewExpansionEvent) => void) {
        return this.events.on(EnumTreeViewEventType.didExpand, handler).dispose
    }

    onDidCollapseElement(handler: (event: ITreeViewExpansionEvent) => void) {
        return this.events.on(EnumTreeViewEventType.didCollapse, handler).dispose
    }

    onDidChangeSelection(handler: (event: ITreeViewSelectionChangeEvent) => void) {
        return this.events.on(EnumTreeViewEventType.didChangeSelection, handler).dispose
    }

    onDidChangeVisibility(handler: (event: ITreeViewVisibilityChangeEvent) => void) {
        return this.events.on(EnumTreeViewEventType.didChangeVisibility, handler).dispose
    }

    public async reveal(element: ITreeItem, options?: { select?: boolean, focus?: boolean, expand?: boolean | number }): Promise<void> {
        throw new Error("not yet implemented")
    }

    dispose(): void {
        this.events.clear()
        this.disposers.forEach(d => d())
    }

}

export const useHandleSimpleApi = (birchContextRef: React.MutableRefObject<IBirchContext>) => {

    const disposables = useRef<DisposablesComposite>()
	
	const viewId = birchContextRef.current.viewId

    useEffect(() => {

		disposables.current = new DisposablesComposite()
		
		return () => {
			disposables.current.dispose()
		}

    }, [viewId])
    
    useEffect(() => {

        const {
            treeViewHandleExtended,
            treeViewHandleSimple,
            model,
            forceUpdate
        } = birchContextRef.current

        disposables.current.add(treeViewHandleExtended.current.onDidChangeSelection((e) => {
            treeViewHandleSimple.events!.emit(EnumTreeViewEventType.didChangeSelection, e ? { tid: e.tid, path: e.path } : { path: null })
        }))

        disposables.current.add(model.root.onDidChangeFolderExpansionState((dir, expanded) => {
            if (expanded) {
                treeViewHandleSimple.events!.emit(EnumTreeViewEventType.didExpand, { tid: dir.tid, path: dir.path })
            } else {
                treeViewHandleSimple.events!.emit(EnumTreeViewEventType.didCollapse, { tid: dir.tid, path: dir.path })
            }
        }))


        disposables.current.add(model.root.onDidChangeTreeData((item) => {
               item.forceUpdate()
               forceUpdate()
        }))

    }, [])

}