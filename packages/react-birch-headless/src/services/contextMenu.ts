import {
  useContextMenu as UseContextMenuBase,
  IPosition
} from 'react-birch-context-menu'
import type {
  IBirchItem,
  IBirchFolder,
  IBirchTreeViewHandleExtended
} from 'react-birch-types'

export function useContextMenu() {
  const { showContextMenu } = UseContextMenuBase()

  return [
    (
      ev: React.MouseEvent,
      contextMenus: {
        command: string
        title: string
        icon?: string
        when?: (item: any) => boolean
        group?: string
        handler?: (view: IBirchTreeViewHandleExtended, item: any) => void
      }[],
      treeViewHandleExtended: IBirchTreeViewHandleExtended,
      item: IBirchItem | IBirchFolder,
      pos?: IPosition
    ) => {
      if (pos) {
        ev.preventDefault()
      }

      const menusByGroup = contextMenus
        .filter((m) => (m.when ? m.when(item) : true))
        .map((m) => ({
          label: m.title,
          group: m.group,
          onClick: m.handler!.bind(null, treeViewHandleExtended, item)
        }))
        .reduce((rv, x) => {
          ;(rv[x.group!] = rv[x.group!] || []).push(x)
          return rv
        }, {})

      const menus = Object.keys(menusByGroup).map((k) => menusByGroup[k])

      if (menus.length > 0) {
        showContextMenu(menus as any, pos)
      } else {
        console.log('no context menu')
      }
    }
  ]
}
