import * as React from 'react'
import { DisposablesComposite, EventEmitter } from 'birch-event-emitter'

import {
	TreeViewModel,
	BirchItem,
	BirchFolder,
	PromptHandleNewItem,
	PromptHandleRename,
} from '../models'

import {
	IBirchTreeItemProps,
	ITreeViewExtendedHandle,
	ITreeViewHandle,
	EnumBirchItemType,
	ITreeViewOptions,
} from '.'

import { Decoration } from '../models/decoration';

export interface IBirchContext {
	viewId: string,
	options: ITreeViewOptions<any>,
	disposables:DisposablesComposite
	forceUpdate: (resolver?: any) => void
	treeViewHandleExtended: React.MutableRefObject<ITreeViewExtendedHandle>
	treeViewHandleSimple: ITreeViewHandle<{}>;
	idxTorendererPropsCache: Map<number, IBirchTreeItemProps>
	events: EventEmitter<{}>
	listRef: React.MutableRefObject<any>
	wrapperRef: React.MutableRefObject<HTMLDivElement>
	model: TreeViewModel
	itemIdToRefMap: Map<number, HTMLDivElement>
	didUpdate: () => void;
	getItemAtIndex: (index: number) => IBirchTreeItemProps;
	commitDebounce: () => Promise<void>;
	adjustedRowCount: number;

	prompts: {
		promptRename: (pathOrItemEntry: string | BirchItem) => Promise<PromptHandleRename>;
		promptNewFolder: (pathOrFolder: string | BirchFolder) => Promise<PromptHandleNewItem>;
		promptNewItem: (pathOrFolder: string | BirchFolder, iconPath: string) => Promise<PromptHandleNewItem>;
		supervisePrompt: (promptHandle: PromptHandleNewItem | PromptHandleRename) => void;
	},

	decorations: {
		activeItemDecoration: Decoration
		pseudoActiveItemDecoration: Decoration
	},

	activeSelection: {
		handleItemClicked: (ev: React.MouseEvent<Element, MouseEvent>, item: BirchItem | BirchFolder, type: EnumBirchItemType) => void;
		activeItem: BirchItem | BirchFolder
		pseudoActiveItem: BirchItem | BirchFolder
		updateActiveItem: (fileOrDirOrPath: string | BirchItem | BirchFolder) => Promise<void>
		updatePseudoActiveItem: (fileOrDirOrPath: string | BirchItem | BirchFolder) => Promise<void>;
		handleKeyDown: (ev: React.KeyboardEvent<Element>) => boolean;
		selectionProps: {
			onKeyDown: (ev: React.KeyboardEvent<Element>) => boolean;
			onBlur: () => void;
			onClick: (ev: React.MouseEvent<Element, MouseEvent>) => void;
		};
	},

	contextMenu: {
		handleContextMenu: (ev: React.MouseEvent<Element, MouseEvent>) => void;
		handleItemContextMenu: (ev: React.MouseEvent<Element, MouseEvent>, item: BirchItem | BirchFolder) => void;
	}

	dragDrop: {
		dragAndDropService: React.MutableRefObject<any>;
		dragged: boolean;
	}

	treeItemView: {
		renderer: any
	}

}