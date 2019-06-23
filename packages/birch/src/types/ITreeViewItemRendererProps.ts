import { BirchItem, BirchFolder, PromptHandleNewItem, PromptHandleRename } from "../../src";
import { EnumBirchItemType } from "../types";
import { ClasslistComposite } from "../models/decoration";

export interface ITreeViewItemRendererProps {
    item: BirchItem | BirchFolder | PromptHandleNewItem | PromptHandleRename
    itemType: EnumBirchItemType
    decorations: ClasslistComposite
    onClick: (
      ev: React.MouseEvent,
      item: BirchItem | BirchFolder,
      type: EnumBirchItemType
    ) => void
    itemMenus: { command: string, icon: string, handler: (item) => void }[],
  }