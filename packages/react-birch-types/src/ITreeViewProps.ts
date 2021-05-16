import { ITreeDataProvider } from './ITreeDataProvider'
import {
  IBirchTreeViewHandle,
  IBirchTreeViewHandleExtended
} from './IBirchTreeViewHandle'

export interface ITreeViewProps {
  /** View Id */
  viewId: string

  /** Title of the view */
  title: string

  /** Comprehensive options object */
  options: ITreeViewOptions

  renderItem: React.FC<any>
}

export interface ITreeViewPropsInternal extends ITreeViewProps {
  handle: React.MutableRefObject<IBirchTreeViewHandleExtended>
}

export interface ITreeViewOptions {
  /** A data provider that provides tree data. */
  treeDataProvider: ITreeDataProvider

  /** Height of each row in px */
  itemHeight?: number

  /** Total height of container (if not specified, expand) */
  height?: number

  contributes: {
    /** Icon Menus for title row */
    titleMenus: {
      command: string
      title: string
      icon: string
      when?: () => boolean
      handler?: (view: IBirchTreeViewHandleExtended) => void
    }[]

    /** Icon Menus for each item row */
    itemMenus: {
      command: string
      title: string
      icon: string
      when?: (item: any) => boolean
      handler?: (item: any) => void
    }[]

    /** Context Menus for TreeView */
    contextMenus: {
      command: string
      title: string
      icon?: string
      when?: (item: any) => boolean
      group?: string
      handler?: (view: IBirchTreeViewHandleExtended, item: any) => void
    }[]

    /** Key bindings */
    keybindings: {
      command: string
      key: string
      mac: string
      when: string
    }[]
  }

  /** Style to pass to inner container */
  style?: React.CSSProperties

  /** Classname to pass to inner container */
  className?: string

  /** Root path e.g., /app used as basename for calculating all tree view paths */
  rootPath: string

  /** Callback to pass the simple Monaco style API */
  onCreateView?: (
    handle: IBirchTreeViewHandle,
    _handle: IBirchTreeViewHandleExtended
  ) => void

  /** Callback to pass the extended API */
  onReady?: (handle: IBirchTreeViewHandleExtended) => void
}
