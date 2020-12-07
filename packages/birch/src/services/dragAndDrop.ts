import { EventEmitter } from 'birch-event-emitter'
import type {
  IBirchItem,
  IBirchFolder,
  IDecoration,
  ITreeViewModel
} from 'react-birch-types'
import { EnumTreeItemType } from 'react-birch-types'
import { Decoration, EnumDecorationTargetMatchMode } from '../models/decoration'

enum DnDServiceEvent {
  FinishDnD
}

const MS_TILL_DRAGGED_OVER_EXPANDS = 500

export class DragAndDropService {
  private model: ITreeViewModel

  private events: EventEmitter<DnDServiceEvent> = new EventEmitter()

  private wasBeingDraggedExpanded: boolean

  private beingDraggedItem: IBirchItem | IBirchFolder

  private draggedOverItem: IBirchItem | IBirchFolder

  private potentialParent: IBirchFolder

  private expandDraggedOverFolderTimeout: number

  private beingDraggedDecoration: IDecoration = new Decoration('dragging')

  private draggedOverDecoration: IDecoration = new Decoration('dragover')

  constructor(model: ITreeViewModel) {
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
    this.events.on(DnDServiceEvent.FinishDnD, cb)
  }

  public setModel(model: ITreeViewModel) {
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
      EnumDecorationTargetMatchMode.Self
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
    this.beingDraggedItem = null!
    this.potentialParent = null!
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
        EnumDecorationTargetMatchMode.SelfAndChildren
      )
    }

    if (
      this.potentialParent !== item &&
      item.type === EnumTreeItemType.Folder
    ) {
      this.expandDraggedOverFolderTimeout = setTimeout(async () => {
        this.expandDraggedOverFolderTimeout = null!
        await this.model.root.expandFolder(item as IBirchFolder)
        // make sure it's still the same thing
        if (this.draggedOverItem === item) {
          this.draggedOverDecoration.removeTarget(this.potentialParent)
          this.potentialParent = item as IBirchFolder
          this.draggedOverDecoration.addTarget(
            this.potentialParent,
            EnumDecorationTargetMatchMode.SelfAndChildren
          )
        }
      }, MS_TILL_DRAGGED_OVER_EXPANDS) as any
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

export default DragAndDropService
