import {  BirchItem, BirchFolder } from '../models'
import { ITreeViewExtendedHandle, EnumTreeViewExtendedEvent, EnumTreeItemType, IBirchContext } from '../types'
import * as React from 'react'

export class KeyboardHotkeys {
    private hotkeyActions = {
        'ArrowUp': () => this.jumpToPrevItem(),
        'ArrowDown': () => this.jumpToNextItem(),
        'ArrowRight': () => this.expandOrJumpToFirstChild(),
        'ArrowLeft': () => this.collapseOrJumpToFirstParent(),
        'Space': () => this.toggleFolderExpand(),
        'Enter': () => this.selectItemOrToggleDirState(),
        'Home': () => this.jumpToFirstItem(),
        'End': () => this.jumpToLastItem(),
        'F2': () => this.triggerRename(),
        'Escape': () => this.resetSteppedOrSelectedItem(),
    }


    constructor(private readonly birchContext: React.MutableRefObject<IBirchContext>) { }

    public handleKeyDown = (ev: React.KeyboardEvent) => {
        if (!this.birchContext.current.treeViewHandleExtended.current.hasDirectFocus()) {
            return false
        }
        const { code } = ev.nativeEvent
        if (code in this.hotkeyActions) {
            ev.preventDefault()
            this.hotkeyActions[code]()
            return true
        }
        return false
    }

    private jumpToFirstItem = (): void => {
        const { root } = this.birchContext.current.treeViewHandleExtended.current.getModel()
        this.birchContext.current.treeViewHandleExtended.current.setPseudoActiveItem(root.getItemEntryAtIndex(0)!)
    }

    private jumpToLastItem = (): void => {
        const { root } = this.birchContext.current.treeViewHandleExtended.current.getModel()
        this.birchContext.current.treeViewHandleExtended.current.setPseudoActiveItem(root.getItemEntryAtIndex(root.branchSize - 1)!)
    }

    private jumpToNextItem = (): void => {
        const { root } = this.birchContext.current.treeViewHandleExtended.current.getModel()
        let currentPseudoActive = this.birchContext.current.treeViewHandleExtended.current.getPseudoActiveItem()
        if (!currentPseudoActive) {
            const selectedItem = this.birchContext.current.treeViewHandleExtended.current.getActiveItem()
            if (selectedItem) {
                currentPseudoActive = selectedItem
            } else {
                return this.jumpToFirstItem()
            }
        }
        const idx = root.getIndexAtItemEntry(currentPseudoActive)
        if (idx + 1 > root.branchSize) {
            return this.jumpToFirstItem()
        } else if (idx > -1) {
            this.birchContext.current.treeViewHandleExtended.current.setPseudoActiveItem(root.getItemEntryAtIndex(idx + 1)!)
        }
    }

    private jumpToPrevItem = (): void => {
        const { root } = this.birchContext.current.treeViewHandleExtended.current.getModel()
        let currentPseudoActive = this.birchContext.current.treeViewHandleExtended.current.getPseudoActiveItem()
        if (!currentPseudoActive) {
            const selectedItem = this.birchContext.current.treeViewHandleExtended.current.getActiveItem()
            if (selectedItem) {
                currentPseudoActive = selectedItem
            } else {
                return this.jumpToLastItem()
            }
        }
        const idx = root.getIndexAtItemEntry(currentPseudoActive)
        if (idx - 1 < 0) {
            return this.jumpToLastItem()
        } else if (idx > -1) {
            this.birchContext.current.treeViewHandleExtended.current.setPseudoActiveItem(root.getItemEntryAtIndex(idx - 1)!)
        }
    }

    private expandOrJumpToFirstChild(): void {
        const currentPseudoActive = this.birchContext.current.treeViewHandleExtended.current.getPseudoActiveItem()
        if (currentPseudoActive && currentPseudoActive.type === EnumTreeItemType.Folder) {
            if ((currentPseudoActive as BirchFolder).expanded) {
                return this.jumpToNextItem()
            } else {
                this.birchContext.current.treeViewHandleExtended.current.openFolder(currentPseudoActive as BirchFolder)
            }
        }
    }

    private collapseOrJumpToFirstParent(): void {
        const currentPseudoActive = this.birchContext.current.treeViewHandleExtended.current.getPseudoActiveItem()
        if (currentPseudoActive) {
            if (currentPseudoActive.type === EnumTreeItemType.Folder && (currentPseudoActive as BirchFolder).expanded) {
                return this.birchContext.current.treeViewHandleExtended.current.closeFolder(currentPseudoActive as BirchFolder)
            }
            this.birchContext.current.treeViewHandleExtended.current.setPseudoActiveItem(currentPseudoActive.parent)
        }
    }

    private triggerRename(): void {
        const currentPseudoActive = this.birchContext.current.treeViewHandleExtended.current.getPseudoActiveItem()
        if (currentPseudoActive) {
            this.birchContext.current.treeViewHandleExtended.current.rename(currentPseudoActive)
        }
    }

    private selectItemOrToggleDirState = (): void => {
        const currentPseudoActive = this.birchContext.current.treeViewHandleExtended.current.getPseudoActiveItem()
        if (!currentPseudoActive) { return }
        if (currentPseudoActive.type === EnumTreeItemType.Folder) {
            this.birchContext.current.treeViewHandleExtended.current.toggleFolder(currentPseudoActive as BirchFolder)
        } else if (currentPseudoActive.type === EnumTreeItemType.Item) {
            this.birchContext.current.treeViewHandleExtended.current.setActiveItem(currentPseudoActive as BirchItem)
            this.birchContext.current.treeViewHandleExtended.current.events.emit(EnumTreeViewExtendedEvent.OnDidChangeSelection, currentPseudoActive as BirchItem)
        }
    }

    private toggleFolderExpand = (): void => {
        const currentPseudoActive = this.birchContext.current.treeViewHandleExtended.current.getPseudoActiveItem()
        if (!currentPseudoActive) { return }
        if (currentPseudoActive.type === EnumTreeItemType.Folder) {
            this.birchContext.current.treeViewHandleExtended.current.toggleFolder(currentPseudoActive as BirchFolder)
        }
    }

    private resetSteppedOrSelectedItem = (): void => {
        const currentPseudoActive = this.birchContext.current.treeViewHandleExtended.current.getPseudoActiveItem()
        if (currentPseudoActive) {
            return this.resetSteppedItem()
        }
        this.birchContext.current.treeViewHandleExtended.current.setActiveItem(null!)
    }

    private resetSteppedItem = () => {
        this.birchContext.current.treeViewHandleExtended.current.setPseudoActiveItem(null!)
    }
}
