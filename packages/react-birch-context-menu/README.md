# react-birch-context-menu

Custom context (right click) menu for react.  Forked from `context-menu` and ported to React Hooks and `styled-components`

## Motivation and enhancements

* Included as a core dependency of `react-birch` directly in the mono repository
* Converted to use `React Hooks` throughout instead of React `Component`
* Added styling and theming based on `styled-components` instead of being hard-coded and limited to only light and dark
* css and sass converted to `styled-components`
* Uses React `createPortal` and creates a standalone `div` adjacent to and after the main component tree (eliminated need to use `ReactDOM.render` twice in one app 
* Eliminated reliance on singleton classes and instead uses React Context accessed through React Hooks
* Uses VSCode extension style API for configuration of menu items and groups

We use `react-birch-context-menu` and `react-birch` as drop in replacements for the VSCode TreeView and VSCode context menu / keyboard bindings in production apps based on the `monaco` editor.

## Simple usage

### Install
```bash
$ npm install react-birch-context-menu
```

