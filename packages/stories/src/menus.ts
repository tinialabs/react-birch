import {
  EnumTreeItemType,
  IBirchFolder,
  IBirchItem,
  ITreeItem,
  IBirchTreeViewHandleExtended,
  ITreeDataProvider
} from 'react-birch-types'
import { toFileIcon } from './util/icons'

export const contributes = (treeDataProvider: ITreeDataProvider) => ({
  titleMenus: [
    {
      command: 'explorer.uploadItem',
      title: 'Upload new item',
      handler: (view: IBirchTreeViewHandleExtended) => {
        const uploadElement = document.getElementById('selectImage')
        uploadElement.click()
      },

      //  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><polygon fill="#424242" points="9.676,2 6.414,2 7.414,3 9,3 9,6 12,6 12,13 4,13 4,9 3,9 3,14 13,14 13,5"/><polygon fill="#00539C" points="7,4 4,1 1,4 1,6 3,4 3,8 5,8 5,4 7,6"/></svg>
      icon: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='13 2 8 2 6 2 6 0 2 0 2 2 0 2 0 6 2 6 2 8 4 8 4 16 16 16 16 5' fill='%23F6F6F6'/%3E%3Cpolygon points='12 3 8 3 8 4 11 4 11 7 14 7 14 14 6 14 6 8 5 8 5 15 15 15 15 6' fill='%23424242'/%3E%3Cpolygon points='7,4 4,1 1,4 1,6 3,4 3,8 5,8 5,4 7,6' fill='%23388A34'/%3E%3Cpolygon points='11 7 11 4 8 4 8 6 6 6 6 8 6 14 14 14 14 7' fill='%23F0EFF1'/%3E%3C/svg%3E%0A\")"
    },
    {
      command: 'explorer.newItem',
      title: 'Add new item',
      handler: (view: IBirchTreeViewHandleExtended) => {
        const item = view.getPseudoActiveItem() || view.getModel().root
        if (item.type === EnumTreeItemType.Folder) {
          view.newItem(item.path, toFileIcon('text', '.md'))
        } else {
          view.newItem(item.parent.path, toFileIcon('text', '.md'))
        }
      },
      icon: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 16 16' xmlns='http://www.w3.org/2000/svg'%3E%3Cpolygon points='13 2 8 2 6 2 6 0 2 0 2 2 0 2 0 6 2 6 2 8 4 8 4 16 16 16 16 5' fill='%23F6F6F6'/%3E%3Cpolygon points='12 3 8 3 8 4 11 4 11 7 14 7 14 14 6 14 6 8 5 8 5 15 15 15 15 6' fill='%23424242'/%3E%3Cpath d='m7 3.018h-2v-2.018h-1.981v2.018h-2.019v1.982h2.019v2h1.981v-2h2v-1.982z' fill='%23388A34'/%3E%3Cpolygon points='11 7 11 4 8 4 8 6 6 6 6 8 6 14 14 14 14 7' fill='%23F0EFF1'/%3E%3C/svg%3E%0A\")"
    },
    {
      command: 'explorer.newFolder',
      title: 'Add new folder',
      handler: (view) => {
        const item = view.getPseudoActiveItem() || view.getModel().root
        if (item.type === EnumTreeItemType.Folder) {
          view.newFolder(item.path)
        } else {
          view.newFolder(item.parent.path)
        }
      },
      icon: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16'%3E%3Cpolygon points='9,3 8,5 8,2 6,2 6,0 2,0 2,2 0,2 0,6 2,6 2,8 2,15 16,15 16,3' fill='%23F6F6F6'/%3E%3Cpath d='M14 4h-4.382l-1 2h-2.618v2h-3v6h12v-10h-1zm0 2h-3.882l.5-1h3.382v1z' fill='%23656565'/%3E%3Cpolygon points='7,3.018 5,3.018 5,1 3.019,1 3.019,3.018 1,3.018 1,5 3.019,5 3.019,7 5,7 5,5 7,5' fill='%23388A34'/%3E%3Cpolygon points='14,5 14,6 10.118,6 10.618,5' fill='%23F0EFF1'/%3E%3C/svg%3E\")"
    },
    {
      command: 'explorer.collapseAll',
      title: 'Collapse all',
      handler: (view) => {
        view.collapseAll()
      },
      icon: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='-1 0 16 16' enable-background='new -1 0 16 16'%3E%3Cpath fill='%23424242' d='M14 1v9h-1v-8h-8v-1h9zm-11 2v1h8v8h1v-9h-9zm7 2v9h-9v-9h9zm-2 2h-5v5h5v-5z'/%3E%3Crect x='4' y='9' fill='%2300539C' width='3' height='1'/%3E%3C/svg%3E\")"
    }
  ],
  itemMenus: [
    /*   {
              command: "explorer.delete",
              title: "Delete",
              handler: async (item: ITreeItemExtended) => {
                  const { path } = item
                  if (await treeDataProvider.deleteItem(item)) {
                      item.parent.unlinkItem(item)
                  }
              },
              icon: "Trashcan"
          } */
  ],
  contextMenus: [
    {
      command: 'explorer.newitem',
      title: 'New Item',
      group: '1',
      handler: (view: IBirchTreeViewHandleExtended, item) => {
        view.newItem(item, toFileIcon('text', '.md'))
      },
      when: (item) => item.type === EnumTreeItemType.Folder
    },
    {
      command: 'explorer.newfolder',
      title: 'New Folder',
      group: '1',
      handler: (view: IBirchTreeViewHandleExtended, item) => {
        view.newFolder(item)
      },
      when: (item) => item.type === EnumTreeItemType.Folder
    },
    {
      command: 'explorer.copyItem',
      title: 'Copy',
      group: '2',
      handler: (view: IBirchTreeViewHandleExtended, item: ITreeItem) => {
        /** noop */
      },
      when: (item) => item.type === EnumTreeItemType.Item
    },
    {
      command: 'explorer.pasteItem',
      title: 'Paste',
      group: '2',
      handler: (
        view: IBirchTreeViewHandleExtended,
        item: IBirchItem | IBirchFolder
      ) => {
        /** noop */
      },
      when: (item) => item.type === EnumTreeItemType.Folder
    },
    {
      command: 'explorer.renameitem',
      title: 'Rename',
      group: '3',
      handler: async (
        view: IBirchTreeViewHandleExtended,
        item: IBirchItem | IBirchFolder
      ) => {
        return view.rename(item)
      }
    },
    {
      command: 'explorer.deleteItem',
      title: 'Delete',
      group: '3',
      handler: async (
        view: IBirchTreeViewHandleExtended,
        item: IBirchItem | IBirchFolder
      ) => {
        if (await treeDataProvider.deleteItem(item)) {
          item.parent.unlinkItem(item)
        }
      }
    }
  ],
  keybindings: []
})

export const onCreateView = (
  viewHandle,
  viewHandleExtended: IBirchTreeViewHandleExtended
) => {
  /** future placeholder to set active item */
}
