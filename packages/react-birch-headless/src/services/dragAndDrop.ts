import { EventEmitter } from 'react-birch-event-emitter'
import {
  EnumTreeItemType,
  EnumBirchDecorationsTargetMatchMode
} from 'react-birch-types'
import { BirchDecoration } from '../models'
import type {
  IBirchItem,
  IBirchFolder,
  IBirchDecoration,
  IBirchTreeViewModel
} from 'react-birch-types'

enum EnumBirchDragDropServiceEvent {
  FinishDragDrop
}

const MS_TILL_DRAGGED_OVER_EXPANDS = 500

export class BirchDragAndDropService {
  private model: IBirchTreeViewModel

  private events: EventEmitter<EnumBirchDragDropServiceEvent> =
    new EventEmitter()

  private wasBeingDraggedExpanded: boolean

  private beingDraggedItem: IBirchItem | IBirchFolder

  private draggedOverItem: IBirchItem | IBirchFolder

  private potentialParent: IBirchFolder

  private expandDraggedOverFolderTimeout: number

  private beingDraggedDecoration: IBirchDecoration = new BirchDecoration(
    'dragging'
  )

  private draggedOverDecoration: IBirchDecoration = new BirchDecoration(
    'dragover'
  )

  constructor(model: IBirchTreeViewModel) {
    this.setModel(model)
  }

  public dispose() {
    this.events.clear()
    this.events = null
    this.model = null
  }

  public onDragAndDrop(
    cb: (target: IBirchItem | IBirchFolder, to: IBirchFolder) => void
  ) {
    this.events.on(EnumBirchDragDropServiceEvent.FinishDragDrop, cb)
  }

  public setModel(model: IBirchTreeViewModel) {
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
    item: IBirchItem | IBirchFolder
  ) => {
    this.beingDraggedItem = item
    const isDirAndExpanded =
      item.type === EnumTreeItemType.Folder && (item as IBirchFolder).expanded
    this.wasBeingDraggedExpanded = isDirAndExpanded
    if (isDirAndExpanded) {
      ;(item as IBirchFolder).setCollapsed()
    }
    this.beingDraggedDecoration.addTarget(
      item as any,
      EnumBirchDecorationsTargetMatchMode.Self
    )
  }

  public handleDragEnd = (
    ev: React.DragEvent,
    item: IBirchItem | IBirchFolder
  ) => {
    if (this.wasBeingDraggedExpanded && item.type === EnumTreeItemType.Folder) {
      void (item as IBirchFolder).setExpanded()
    }
    this.wasBeingDraggedExpanded = false
    this.beingDraggedDecoration.removeTarget(item)
    this.draggedOverDecoration.removeTarget(this.potentialParent)
    this.beingDraggedItem = null
    this.potentialParent = null
    if (this.expandDraggedOverFolderTimeout) {
      clearTimeout(this.expandDraggedOverFolderTimeout)
    }
  }

  public handleDragEnter = (
    ev: React.DragEvent,
    item: IBirchItem | IBirchFolder
  ) => {
    if (this.expandDraggedOverFolderTimeout) {
      clearTimeout(this.expandDraggedOverFolderTimeout)
    }
    this.draggedOverItem = item
    if (item === this.beingDraggedItem) {
      return
    }
    const newPotentialParent: IBirchFolder =
      item.type === EnumTreeItemType.Folder && (item as IBirchFolder).expanded
        ? (item as IBirchFolder)
        : item.parent

    if (
      this.potentialParent !== newPotentialParent &&
      newPotentialParent !== this.beingDraggedItem.parent
    ) {
      this.draggedOverDecoration.removeTarget(this.potentialParent)
      this.potentialParent = newPotentialParent
      this.draggedOverDecoration.addTarget(
        this.potentialParent,
        EnumBirchDecorationsTargetMatchMode.SelfAndChildren
      )
    }

    if (
      this.potentialParent !== item &&
      item.type === EnumTreeItemType.Folder
    ) {
      this.expandDraggedOverFolderTimeout = setTimeout(async () => {
        this.expandDraggedOverFolderTimeout = null
        await this.model.root.expandFolder(item as IBirchFolder)
        // make sure it's still the same thing
        if (this.draggedOverItem === item) {
          this.draggedOverDecoration.removeTarget(this.potentialParent)
          this.potentialParent = item as IBirchFolder
          this.draggedOverDecoration.addTarget(
            this.potentialParent,
            EnumBirchDecorationsTargetMatchMode.SelfAndChildren
          )
        }
      }, MS_TILL_DRAGGED_OVER_EXPANDS) as unknown as number
    }
  }

  public handleDrop = (ev: React.DragEvent) => {
    ev.preventDefault()
    const item = this.beingDraggedItem
    if (this.wasBeingDraggedExpanded && item.type === EnumTreeItemType.Folder) {
      void (item as IBirchFolder).setExpanded()
    }
    this.wasBeingDraggedExpanded = false
    this.beingDraggedDecoration.removeTarget(item)
    this.draggedOverDecoration.removeTarget(this.potentialParent)

    this.events.emit(
      EnumBirchDragDropServiceEvent.FinishDragDrop,
      this.beingDraggedItem,
      this.potentialParent
    )

    this.beingDraggedItem = null
    this.potentialParent = null
    if (this.expandDraggedOverFolderTimeout) {
      clearTimeout(this.expandDraggedOverFolderTimeout)
    }
  }

  public handleDragOver = (ev: React.DragEvent) => {
    ev.preventDefault()
  }
}
