# birch-event-emitter

## A simpler event emitter for the browser

Features include:

 - Event subscriptions return a `Disposable` object with `dispose()` method to unsubscribe from event.
 - Group event subscriptions using `DisposablesComposite` and dispose them all with one call, i.e `DisposableComposite#dispose()`
 - Listeners voice matters!! You can now dispatch an event using `EventEmitter#emithWithReturn` where each listener's return value can be accessed from returned array.


## Motivation

Forked from `Notificar`

* Included as a core dependency of `react-birch` directly in the mono repository
* Replaces functionality used in some of the original `tiny-emitter` in the `react-aspen` dependencies to avoid unnecessary inclusion of duplicate functionality implemented in different ways
* Transpiled to typescript
* Standard to standard verbs `on`, `emit` instead of `add`, `dispatch`

## License

MIT