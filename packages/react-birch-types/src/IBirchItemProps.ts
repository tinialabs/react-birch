import { IBirchFolder } from './IBirchFolder'
import { IBirchItem } from './IBirchItem'
import {
  IBirchNewItemPromptHandle,
  IBirchRenamePromptHandle
} from './IBirchPromptHandles'
import { EnumTreeItemTypeExtended } from './ITreeItem'

interface IBirchItemUnionProps {
  item:
    | IBirchItem
    | IBirchFolder
    | IBirchNewItemPromptHandle
    | IBirchNewItemPromptHandle
    | IBirchRenamePromptHandle
  itemType:
    | EnumTreeItemTypeExtended.Item
    | EnumTreeItemTypeExtended.Folder
    | EnumTreeItemTypeExtended.NewItemPrompt
    | EnumTreeItemTypeExtended.NewFolderPrompt
    | EnumTreeItemTypeExtended.RenamePrompt
}

interface IBirchItemFileProps {
  item: IBirchItem
  itemType: EnumTreeItemTypeExtended.Item
}

interface IBirchItemFolderProps {
  item: IBirchFolder
  itemType: EnumTreeItemTypeExtended.Folder
}

interface IBirchItemNewItemProps {
  item: IBirchNewItemPromptHandle
  itemType: EnumTreeItemTypeExtended.NewItemPrompt
}

interface IBirchItemNewFolderProps {
  item: IBirchNewItemPromptHandle
  itemType: EnumTreeItemTypeExtended.NewFolderPrompt
}

interface IBirchItemRenamePromptProps {
  item: IBirchRenamePromptHandle
  itemType: EnumTreeItemTypeExtended.RenamePrompt
}

export type IBirchItemProps =
  | IBirchItemUnionProps
  | IBirchItemFileProps
  | IBirchItemFolderProps
  | IBirchItemNewItemProps
  | IBirchItemNewFolderProps
  | IBirchItemRenamePromptProps
