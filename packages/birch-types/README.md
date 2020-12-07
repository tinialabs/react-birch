# React Birch

React Birch is one of **the most** performant solution for displaying ~~nested trees~~ *dynamic* nested trees in React apps.  It was forked from [`react-aspen`](https://github.com/NeekSandhu/react-aspen) which claims the performance spot (I haven't verified delta) and further streamlined to:


## Motivation and Enhancements Included

* Support a `VSCode` Monaco-like configuration-driven API
* Consolidate multiple packages into a single `react-birch` (with a mono repository structure to include highly associated but loosely coupled dependencies like `birch-context-menu`)
* Use `React Hooks` instead of React `Components` throughout
* Use [`styled-components`](https://www.styled-components.com/) and standard theming instead of custom `.sass` and non-standard theming
* Uses `VSCode` styling for folder views for a professional look out of the box
* Allows concept of configurable action commands for each tree row and for a tree title area;   examples are provided for `Add Item`, `Delete Item`, `Rename Item` and `Collapse All`;  these can be shown in both right click context menus as well as tiny icons on one side of each row, just like VSCode
* Eliminate dependencies where possible (e.g., `tinyemitter` and `Notificar` replaced with a very simple in repository fork called `birch-event-emitter`)

Just like `react-aspen`, it uses lightning fast `TypedArray`s to represent the data and `react-window` for super-efficient rendering. You define **what** needs to be rendered
and Birch figures out the **how**

## Base Features

 - Zero recursion. Unlike most implementations, which recurse the given nested object to flatten it out at once, Birch sets up an initial `Uint32Array` for
 initially visible items and then uses *diff/patch* technique thereafter for when subsequent nodes are expanded or collapsed. During benchmarks (expanding/collapsing
 nodes), Birch was `150x` faster than `react-virtualized-tree` which uses recursive flattening and `4x` faster than VSCode's TreeView which uses
 "linked-lists" as the data container (see below for flamegraph)
 - Best of the best; Birch uses `Uint32Arrays` internally to represent the flattened structure, this is awesome since `TypedArrays` are way faster than regular `Arrays` in all
 the operations, especially splicing and lookups. While benchmarking, `TypedArray`s were found to be `5x`
 times faster than regular `Array`s when tested in Safari.
 - Ability to rename (and create new) items **inline**, previsously this was not so trivial especially when working with virtualized lists. Just call `#promptRename`
 or `#promptNewItem` and setup your renderer to render the passed `<ProxiedInput/>` component as you like.
 - `Drag`, `Drop`, `Add`, `Move`, `Remove` anything and anywhere, Birch will seamlessly apply that update while preserving tree expansion state, once again, without recursion.
 Updates like these get applied like "patches" thus nothing gets lost.
 - Since Birch uses virtualized lists, *nested* structures aren't rendered as *nested* DOM nodes, but instead as individual items, thus CSS inheritence doesn't work.
 Therefore, to fix that Birch comes with a slick decorations system (in addition to `styled-components`), where you can specify the styles for one parent and Birch will work out the inheritance automatically for all of its children (of course you can negate any children if you so desire, just like CSS's `:not` selector).

These were just some of the awesome features Birch has to offer. Birch still has a lower-level library with a lot of very low-level API's. With that said, if you truly want low-level and don't want the Monaco API, then you may find the original `react-aspen` more to your liking.

## Usage

```bash
npm i react-birch
```

It is highly recommended that you fork off of [`sample`](https://github.com/tinialabs/react-birch/tree/master/packages/sample) which has all of the high level features implemented and
ready-to-go. 

Once you fork, please give back by creating a pull request should you make a change. That helps all of us.

## License

Licensed under MIT license. If you use this package in your app or product please consider crediting as you see fit. Not required, but would be nice 🙂
