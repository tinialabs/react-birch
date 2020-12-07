import {
  IBirchFolder,
  IBirchItem,
  IPromptHandleNewItem,
  IPromptHandleRename
} from '../models'

export enum EnumBirchItemType {
  BirchItem = 1,
  BirchFolder,
  NewItemPrompt,
  NewFolderPrompt,
  RenamePrompt
}

export interface BirchItemEntryProps {
  item: IBirchItem
  itemType: EnumBirchItemType.BirchItem
}

export interface BirchItemFolderProps {
  item: IBirchFolder
  itemType: EnumBirchItemType.BirchFolder
}

export interface BirchItemRendererNewItemProps {
  item: IPromptHandleNewItem
  itemType: EnumBirchItemType.NewItemPrompt
}

export interface BirchItemRendererNewFolderProps {
  item: IPromptHandleNewItem
  itemType: EnumBirchItemType.NewFolderPrompt
}

export interface BirchItemRendererRenamePromptProps {
  item: IPromptHandleRename
  itemType: EnumBirchItemType.RenamePrompt
}

export type IBirchTreeItemProps =
  | BirchItemEntryProps
  | BirchItemFolderProps
  | BirchItemRendererNewItemProps
  | BirchItemRendererNewFolderProps
  | BirchItemRendererRenamePromptProps
