import { EventEmitter } from 'birch-event-emitter'

export interface IMenuItem {
  label: string
  disabled: boolean
}

export interface ITextMenuItem extends IMenuItem {
  sublabel?: string
  onClick: () => void
}

export interface ISubMenuItem extends IMenuItem {
  submenu: IContextMenuData
}

export type IMenuItemGroup = Array<ITextMenuItem | ISubMenuItem>

export type IContextMenuData = IMenuItemGroup[]

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface IContextMenuProps {
  /** empty */
}

export interface IContextMenuReactContext {
  showContextMenu: (
    data:
      | (ITextMenuItem | ISubMenuItem)[][]
      | Promise<(ITextMenuItem | ISubMenuItem)[][]>,
    pos?: IPosition
  ) => {
    onShow: (cb: any) => void
    onClose: (cb: any) => void
    update: (newData: (ITextMenuItem | ISubMenuItem)[][]) => void
    close: () => void
    isActive: () => boolean
  }
  hideContextMenu: () => void
  pos: {
    x: number
    y: number
  }
  visible: boolean
  data: any[]
}

export interface IPosition {
  x: number
  y: number
}
