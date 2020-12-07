import { ITreeDataProvider } from './ITreeDataProvider'
import { ITreeViewHandle, ITreeViewExtendedHandle } from '.'

export interface ITreeViewProps {
  /** View Id */
  viewId: string

  /** Title of the view */
  title: string

  /** Comprehensive options object */
  options: ITreeViewOptions<any>

  renderItem: React.FC<any>
}

export interface IBirchTreeViewPropsInternal extends ITreeViewProps {
  handle: React.MutableRefObject<ITreeViewExtendedHandle>
}

export interface ITreeViewOptions<T> {
  /** A data provider that provides tree data. */
  treeDataProvider: ITreeDataProvider<T>

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
      handler?: (view: ITreeViewExtendedHandle) => void
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
      handler?: (view: ITreeViewExtendedHandle, item: any) => void
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
    handle: ITreeViewHandle<any>,
    _handle: ITreeViewExtendedHandle
  ) => void

  /** Callback to pass the extended API */
  onReady?: (handle: ITreeViewExtendedHandle) => void
}
