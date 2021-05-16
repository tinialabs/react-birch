import type {
  BirchWatcherCallbackType,
  IBirchWatcherEvent
} from './IBirchWatcher'
import type { IBirchFolder } from './IBirchFolder'
import type { IBirchItem } from './IBirchItem'

/**
 * Every `BirchRoot` has one `TreeSupervisor` created at the very moment a `BirchRoot` is created
 *
 * It exists to facilitate event delegation for events originiating somewhere down in the tree and other bunch of shared stuff (shared in the tree, but unique to each `BirchRoot`)
 */
export interface IBirchTreeSupervisor {
  // Helpers //
  supervisedWatch(path: string, callback: BirchWatcherCallbackType)

  // Event delegations //

  notifyDidChangeTreeData(target: IBirchItem | IBirchFolder)

  notifyWillChangeParent(
    target: IBirchItem | IBirchFolder,
    prevParent: IBirchFolder,
    newParent: IBirchFolder
  )
  notifyDidChangeParent(
    target: IBirchItem | IBirchFolder,
    prevParent: IBirchFolder,
    newParent: IBirchFolder
  )

  notifyWillDispose(target: IBirchItem | IBirchFolder)
  notifyDidDispose(target: IBirchItem | IBirchFolder)

  notifyWillProcessWatchEvent(target: IBirchFolder, event: IBirchWatcherEvent)
  notifyDidProcessWatchEvent(target: IBirchFolder, event: IBirchWatcherEvent)

  notifyWillChangeExpansionState(target: IBirchFolder, nowExpanded: boolean)
  notifyDidChangeExpansionState(target: IBirchFolder, nowExpanded: boolean)

  notifyDidChangePath(target: IBirchItem | IBirchFolder)
}
