import { EventEmitter } from 'birch-event-emitter'
import { BirchItem, BirchFolder, TreeViewModel } from '../models'
import { EnumTreeItemType } from '../types'
import { Decoration, DecorationTargetMatchMode } from '../models/decoration'

enum DnDServiceEvent {
  FinishDnD
}

const MS_TILL_DRAGGED_OVER_EXPANDS = 500

export class DragAndDropService {
  private model: TreeViewModel

  private events: EventEmitter<DnDServiceEvent> = new EventEmitter()

  private wasBeingDraggedExpanded: boolean

  private beingDraggedItem: BirchItem | BirchFolder

  private draggedOverItem: BirchItem | BirchFolder

  private potentialParent: BirchFolder

  private expandDraggedOverFolderTimeout: number

  private beingDraggedDecoration: Decoration = new Decoration('dragging')

  private draggedOverDecoration: Decoration = new Decoration('dragover')

  constructor(model: TreeViewModel) {
    this.setModel(model)
  }

  public dispose() {
    this.events.clear()
    this.events = null
    this.model = null
  }

  public onDragAndDrop(
    cb: (target: BirchItem | BirchFolder, to: BirchFolder) => void
  ) {
    this.events.on(DnDServiceEvent.FinishDnD, cb)
  }

  public setModel(model: TreeViewModel) {
    if (this.model) {
      this.model.decorations.removeDecoration(this.beingDraggedDecoration)
      this.model.decorations.removeDecoration(this.draggedOverDecoration)
    }
    this.model = model
    this.model.decorations.addDecoration(this.beingDraggedDecoration)
    this.model.decorations.addDecoration(this.draggedOverDecoration)
  }

  public handleDragStart = (
    ev: React.DragEvent,
    item: BirchItem | BirchFolder
  ) => {
    this.beingDraggedItem = item
    const isDirAndExpanded =
      item.type === EnumTreeItemType.Folder && (item as BirchFolder).expanded
    this.wasBeingDraggedExpanded = isDirAndExpanded
    if (isDirAndExpanded) {
      ;(item as BirchFolder).setCollapsed()
    }
    this.beingDraggedDecoration.addTarget(
      item as any,
      DecorationTargetMatchMode.Self
    )
  }

  public handleDragEnd = (
    ev: React.DragEvent,
    item: BirchItem | BirchFolder
  ) => {
    if (this.wasBeingDraggedExpanded && item.type === EnumTreeItemType.Folder) {
      ;(item as BirchFolder).setExpanded()
    }
    this.wasBeingDraggedExpanded = false
    this.beingDraggedDecoration.removeTarget(item)
    this.draggedOverDecoration.removeTarget(this.potentialParent)
    this.beingDraggedItem = null!
    this.potentialParent = null!
    if (this.expandDraggedOverFolderTimeout) {
      clearTimeout(this.expandDraggedOverFolderTimeout)
    }
  }

  public handleDragEnter = (
    ev: React.DragEvent,
    item: BirchItem | BirchFolder
  ) => {
    if (this.expandDraggedOverFolderTimeout) {
      clearTimeout(this.expandDraggedOverFolderTimeout)
    }
    this.draggedOverItem = item
    if (item === this.beingDraggedItem) {
      return
    }
    const newPotentialParent: BirchFolder =
      item.type === EnumTreeItemType.Folder && (item as BirchFolder).expanded
        ? (item as BirchFolder)
        : item.parent

    if (
      this.potentialParent !== newPotentialParent &&
      newPotentialParent !== this.beingDraggedItem.parent
    ) {
      this.draggedOverDecoration.removeTarget(this.potentialParent)
      this.potentialParent = newPotentialParent
      this.draggedOverDecoration.addTarget(
        this.potentialParent,
        DecorationTargetMatchMode.SelfAndChildren
      )
    }

    if (
      this.potentialParent !== item &&
      item.type === EnumTreeItemType.Folder
    ) {
      this.expandDraggedOverFolderTimeout = setTimeout(async () => {
        this.expandDraggedOverFolderTimeout = null!
        await this.model.root.expandFolder(item as BirchFolder)
        // make sure it's still the same thing
        if (this.draggedOverItem === item) {
          this.draggedOverDecoration.removeTarget(this.potentialParent)
          this.potentialParent = item as BirchFolder
          this.draggedOverDecoration.addTarget(
            this.potentialParent,
            DecorationTargetMatchMode.SelfAndChildren
          )
        }
      }, MS_TILL_DRAGGED_OVER_EXPANDS) as any
    }
  }

  public handleDrop = (ev: React.DragEvent) => {
    ev.preventDefault()
    const item = this.beingDraggedItem
    if (this.wasBeingDraggedExpanded && item.type === EnumTreeItemType.Folder) {
      ;(item as BirchFolder).setExpanded()
    }
    this.wasBeingDraggedExpanded = false
    this.beingDraggedDecoration.removeTarget(item)
    this.draggedOverDecoration.removeTarget(this.potentialParent)

    this.events.emit(
      DnDServiceEvent.FinishDnD,
      this.beingDraggedItem,
      this.potentialParent
    )

    this.beingDraggedItem = null!
    this.potentialParent = null!
    if (this.expandDraggedOverFolderTimeout) {
      clearTimeout(this.expandDraggedOverFolderTimeout)
    }
  }

  public handleDragOver = (ev: React.DragEvent) => {
    ev.preventDefault()
  }
}
