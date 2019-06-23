
import { 
	BirchFolder, 
	BirchItem, 
	PromptHandleNewItem, 
	PromptHandleRename 
} from '../models'

export enum EnumBirchItemType {
	BirchItem = 1,
	BirchFolder,
	NewItemPrompt,
	NewFolderPrompt,
	RenamePrompt,
}

export interface BirchItemEntryProps {
	item: BirchItem
	itemType: EnumBirchItemType.BirchItem
}

export interface BirchItemFolderProps {
	item: BirchFolder
	itemType: EnumBirchItemType.BirchFolder
}

export interface BirchItemRendererNewItemProps {
	item: PromptHandleNewItem
	itemType: EnumBirchItemType.NewItemPrompt
}

export interface BirchItemRendererNewFolderProps {
	item: PromptHandleNewItem
	itemType: EnumBirchItemType.NewFolderPrompt
}

export interface BirchItemRendererRenamePromptProps {
	item: PromptHandleRename
	itemType: EnumBirchItemType.RenamePrompt
}

export type IBirchTreeItemProps = BirchItemEntryProps | BirchItemFolderProps | BirchItemRendererNewItemProps | BirchItemRendererNewFolderProps | BirchItemRendererRenamePromptProps
