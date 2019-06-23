export enum EnumTreeItemType {
	Item = 1,
	Folder,
}

declare class Uri {
    static parse(value: string, strict?: boolean): Uri;
    static file(path: string): Uri;
    private constructor(scheme: string, authority: string, path: string, query: string, fragment: string);
    readonly scheme: string;
    readonly authority: string;
    readonly path: string;
    readonly query: string;
    readonly fragment: string;
    readonly fsPath: string;
    with(change: { scheme?: string; authority?: string; path?: string; query?: string; fragment?: string }): Uri;
    toString(skipEncoding?: boolean): string;
    toJSON(): any;
}

/**
 * Collapsible state of the tree item
 */
export enum EnumTreeItemCollapsibleState {

    /**
     * Determines an item can be neither collapsed nor expanded. Implies it has no children.
     */
    None = 0,

    /**
     * Determines an item is collapsed
     */
    Collapsed = 1,
    
    /**
     * Determines an item is expanded
     */
    Expanded = 2
}

export declare interface ITreeItem {

    /**
     * A human-readable string describing this item. When `falsy`, it is derived from [resourceUri](#ITreeItem.resourceUri).
     */
    label: string;

    /**
     * Tree item identifier (tid) for the tree item that has to be unique across tree. 
     * 
     * The tid is used to preserve the selection and expansion state of the tree item.
     */
    tid: string;

    /**
     * Whether this item has children (Folder) or is only a child leaf (Item)
     */
    type: EnumTreeItemType

     /**
     * Icon representation of this item as represented in the theme file e.g. "octicons/file"
     */
    iconPath?: string

     /**
     * A human readable string which is rendered less prominent.
     * When `true`, it is derived from [label](#ITreeItem.label) and when `falsy`, it is not shown.
     */
    description?: string | boolean;

    /**
     * The tooltip text when you hover over this item.
     */
    tooltip?: string | undefined;

    /**
     * The [command](#Command) that should be executed when the tree item is selected.
     */
    command?: Command;

    /**
     * [EnumTreeItemCollapsibleState](#EnumTreeItemCollapsibleState) of the tree item.
     */
    collapsibleState?: EnumTreeItemCollapsibleState;

    /**
     * Context value of the tree item. This can be used to contribute item specific actions in the tree.
     * For example, a tree item is given a context value as `folder`. When contributing actions to `view/item/context`
     * using `menus` extension point, you can specify context value for key `viewItem` in `when` expression like `viewItem == folder`.
     * ```
     *	"contributes": {
     *		"menus": {
     *			"view/item/context": [
     *				{
     *					"command": "extension.deleteFolder",
     *					"when": "viewItem == folder"
     *				}
     *			]
     *		}
     *	}
     * ```
     * This will show action `extension.deleteFolder` only for items with `contextValue` is `folder`.
     */
    contextValue?: string;


}

export declare interface ITreeItemExtended extends ITreeItem {

    /**
     * A human-readable path to this item. 
     */
    path: string;

    /**
     * A human-readable path to this item. 
     */
    parent: ITreeItemExtendedFolder;


}

export declare interface ITreeItemExtendedFolder extends ITreeItemExtended {

    /**
     * Remove child
     */
    unlinkItem: (item: ITreeItemExtended) => void

}


export interface Command {

    /**
     * The identifier of the actual command handler.
     * @see [commands.registerCommand](#commands.registerCommand).
     */
    command: string;

    /**
     * Title of the command, like `save`.
     */
    title: string;

    handler?: (item: ITreeItemExtended) => void;

    /**
     * A tooltip for the command, when represented in the UI.
     */
    tooltip?: string;

    /**
     * Arguments that the command handler should be
     * invoked with.
     */
    arguments?: any[];

}
