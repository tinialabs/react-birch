import { IDisposable } from 'birch-event-emitter'
import { IBirchFolder, IBirchItem } from '..'

export enum EnumDecorationTargetMatchMode {
  None = 1,
  Self = 2,
  Children = 3,
  SelfAndChildren = 4
}
export interface IDecoration {
  /**
   * Do not mutate directly, use `IDecoration#addCSSClass()` / `IDecoration#removeCSSClass` instead
   */
  readonly cssClasslist: Set<string>
  disabled: boolean
  readonly appliedTargets: Map<
    IBirchItem | IBirchFolder,
    EnumDecorationTargetMatchMode
  >
  readonly negatedTargets: Map<
    IBirchItem | IBirchFolder,
    EnumDecorationTargetMatchMode
  >
  addCSSClass(classname: string): void
  removeCSSClass(classname: string): void
  addTarget(folder: IBirchFolder, flags: EnumDecorationTargetMatchMode): void
  addTarget(item: IBirchItem): void
  removeTarget(folder: IBirchFolder): void
  removeTarget(item: IBirchItem): void
  negateTarget(folder: IBirchFolder, flags: EnumDecorationTargetMatchMode): void
  negateTarget(item: IBirchItem): void
  unNegateTarget(folder: IBirchFolder): void
  unNegateTarget(item: IBirchItem): void
  onDidAddTarget(
    callback: (
      decoration: IDecoration,
      target: IBirchItem | IBirchFolder,
      flags: EnumDecorationTargetMatchMode
    ) => void
  ): IDisposable
  onDidRemoveTarget(
    callback: (
      decoration: IDecoration,
      target: IBirchItem | IBirchFolder
    ) => void
  ): IDisposable
  onDidNegateTarget(
    callback: (
      decoration: IDecoration,
      target: IBirchItem | IBirchFolder,
      flags: EnumDecorationTargetMatchMode
    ) => void
  ): IDisposable
  onDidUnNegateTarget(
    callback: (
      decoration: IDecoration,
      target: IBirchItem | IBirchFolder
    ) => void
  ): IDisposable
  onDidRemoveCSSClassname(
    callback: (decoration: IDecoration, classname: string) => void
  ): IDisposable
  onDidAddCSSClassname(
    callback: (decoration: IDecoration, classname: string) => void
  ): IDisposable
  onDidEnableDecoration(
    callback: (decoration: IDecoration) => void
  ): IDisposable
  onDidDisableDecoration(
    callback: (decoration: IDecoration) => void
  ): IDisposable
}
