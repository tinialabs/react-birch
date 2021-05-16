export enum EnumBirchDecorationsTargetMatchMode {
  None = 1,
  Self,
  Children,
  SelfAndChildren
}

export enum EnumBirchDecorationCompositeType {
  Applicable = 1,
  Inheritable
}

export enum EnumBirchDecorationChangeReason {
  UnTargetDecoration = 1,
  TargetDecoration
}

export enum EnumBirchDecorationEvent {
  DidUpdateResolvedDecorations = 1,
  AddCSSClassname,
  RemoveCSSClassname,
  ChangeCSSClasslist,
  AddTarget,
  RemoveTarget,
  NegateTarget,
  UnNegateTarget,
  DecorationEnabled,
  DecorationDisabled
}
