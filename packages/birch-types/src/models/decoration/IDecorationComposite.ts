/**
 * The "consumer level" part of Decoration
 *
 * `ClasslistComposite` contains composited classnames from all the decorations applicable to a target
 *
 * The composite includes all the applicable inheritances and negations.
 *
 * Note that due to performance considerations, `ClasslistComposite` is one of the few cases where
 * we *do not* use `Disposables` for event management and instead use old school `addChangeListener`/`removeChangeListener` methods.
 *
 * Remember to pass same **named** function reference to `addChangeListener` and `removeChangeLiseneer` while subscribing and unsusbscribing
 * in `componentDidMount` and `componentWillUnmount` respectively.
 *
 * Note: You should also implement a `componentDidUpdate` hook where you can unsubscribe from previous decoration object and subscribe to the new one.
 */
export interface IClasslistComposite {
  /**
   * Registers a function to be called when composited classlist changes
   *
   * *⚠ Remember not to use anonymous function!! (pass a named function reference instead)*
   */
  readonly addChangeListener: (namedCallback: () => void) => void
  /**
   * Unregisters a previsously registered classlist change listener
   *
   * *⚠ Remember not to use anonymous function!! (pass a named function reference instead)*
   */
  readonly removeChangeListener: (namedCallback: () => void) => void
  classlist: ReadonlyArray<string>
}
export enum DecorationCompositeType {
  Applicable = 1,
  Inheritable = 2
}
export enum EnumChangeReason {
  UnTargetDecoration = 1,
  TargetDecoration = 2
}
