export enum EnumTreeViewEventType {
  didExpand = 1,
  didCollapse,
  didChangeSelection,
  didChangeVisibility,
  // extended
  DidChangeModel,
  DidUpdate,
  OnBlur,
  OnDidChangeSelection
}

export enum EnumBirchTreeEvent {
  WillChangeExpansionState = 1,
  DidChangeExpansionState,
  WillChangeParent,
  DidChangeParent,
  WillDispose,
  DidDispose,
  BranchDidUpdate,
  DidChangePath,
  DidProcessWatchEvent,
  WillProcessWatchEvent,
  DidChangeTreeData
}

export enum EnumBirchTreeStateEvent {
  DidChangeScrollOffset = 1,
  DidChangeFolderExpansionState,
  DidChangeRelativePath,
  DidChange
}
