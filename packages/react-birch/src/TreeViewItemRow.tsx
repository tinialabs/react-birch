import * as React from 'react'
import { useCallback, forwardRef, useContext } from 'react'
import cn from 'classnames'
import styled, { ThemeContext } from 'styled-components'
import { themeGet } from '@styled-system/theme-get'
import { EnumTreeItemTypeExtended, EnumTreeItemType } from 'react-birch-types'
import {
  useForceUpdate,
  BirchPromptHandle,
  useDecorationsChild,
  isPrompt
} from 'react-birch-headless'
import { Icon } from './Icon'
import type {
  IBirchFolder,
  IBirchItem,
  IBirchRenamePromptHandle,
  IBirchItemRendererWrapProps
} from 'react-birch-types'

/* STYLED WIDGETS */

const WidgetStyle = styled<any>('a')`
  margin-left: auto;
  color: ${themeGet('colors.gray2')} !important;
  cursor: pointer;
  transition: all 0.5s;
  opacity: 0;

  &:hover {
    color: ${themeGet('colors.gray5')} !important;
    background-color: ${themeGet('colors.gray2')};
  }

  display: inline-block;
  font: normal normal normal 18px/1 'default-icons';
  font-size: 18px;
  text-align: center;
  height: 18px;
  width: 18px;

  &:before {
    height: inherit;
    width: inherit;
    display: inline-block;
    content: url('${(props) => props.icon}');
  }
`

const TreeViewItemRowStyle = styled('div')`
  font: inherit;
  text-align: left;
  display: flex;
  align-items: center;
  white-space: nowrap;
  padding: 2px 0;
  margin-left: 2px;
  padding-right: 2px;
  cursor: pointer;
  padding-left: ${(props) => 16 * (props['data-depth'] - 1)}px;
  border-radius: ${themeGet('radii.1')}px;
  display: flex;
  color: ${themeGet('colors.primary')};

  &:hover {
    background-color: ${themeGet('colors.beige1')};
  }

  &.pseudo-active,
  &:hover.pseudo-active {
    color: ${themeGet('colors.light1')};
    background-color: ${themeGet('colors.dark1')};
  }

  &:hover ${WidgetStyle} {
    opacity: 1;
  }

  &.active,
  &.prompt {
    background-color: ${themeGet('colors.accent3')};
  }

  &.dragover {
    background-color: ${themeGet('colors.accent2')};
  }
`

const FolderToggleIcon = styled.span`
  display: inline-block;
  font: normal normal normal 18px/1 'default-icons';
  font-size: 18px;
  text-align: center;
  height: 18px;
  width: 18px;

  &:before {
    height: inherit;
    width: inherit;
    display: inline-block;

    content: ${({ open }: { open: boolean }) =>
      !open
        ? "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZmlsbD0iIzY0NjQ2NSIgZD0iTTYgNHY4bDQtNC00LTR6bTEgMi40MTRMOC41ODYgOCA3IDkuNTg2VjYuNDE0eiIvPjwvc3ZnPg==')"
        : "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNiAxNiI+PHBhdGggZmlsbD0iIzY0NjQ2NSIgZD0iTTExIDEwSDUuMzQ0TDExIDQuNDE0VjEweiIvPjwvc3ZnPg==')"};
  }
`

const TreeViewItemLabel = styled.span`
  display: flex;
  align-items: center;
  overflow: hidden;
  color: inherit;
`

const TreeViewItemFileName = styled.span`
  font: inherit;
  color: inherit;
  user-select: none;
  margin-left: 3px;
  overflow: hidden;
  text-overflow: ellipsis;

  & input[type='text'] {
    display: block;
    width: 500px;
    margin: 0;
    font: inherit;
    border-radius: 3px;
    padding: 1px 2px;
    border: 0;
    background: transparent;
    color: inherit;
    outline: none;
    position: relative;
    z-index: 1;
    margin-top: -2px;
    top: 1px;
    left: -2px;

    &:focus {
      box-shadow: 0px 0px 1px 1px ${themeGet('colors.accent3')};
    }
  }
`

function useTheme() {
  return useContext(ThemeContext)
}

export const TreeViewItemStyled = forwardRef(
  (
    {
      item,
      itemType,
      onClick,
      decorations,
      itemMenus,
      ...props
    }: IBirchItemRendererWrapProps,
    ref
  ) => {
    const forceUpdate = useForceUpdate()
    const theme: any = useTheme()

    /**
     * Cascade Decorations
     */
    useDecorationsChild({ decorations, forceUpdate })

    const itemIsPrompt = isPrompt(itemType)

    /**
     * On Click Callback
     */
    const handleClick = useCallback(
      (ev: React.MouseEvent) => {
        if (
          itemType === EnumTreeItemTypeExtended.Item ||
          itemType === EnumTreeItemTypeExtended.Folder
        ) {
          onClick(ev, item as IBirchItem)
        }
      },
      [item, itemType, onClick]
    )

    if ((item as IBirchItem).disposed) {
      return null
    }

    /**
     * Current item state helpers
     */
    const isDirExpanded =
      itemType === EnumTreeItemTypeExtended.Folder
        ? (item as IBirchFolder).expanded
        : itemType === EnumTreeItemTypeExtended.RenamePrompt &&
          (item as IBirchRenamePromptHandle).target.type ===
            EnumTreeItemType.Folder
        ? ((item as IBirchRenamePromptHandle).target as IBirchFolder).expanded
        : false

    const itemOrFolder =
      itemType === EnumTreeItemTypeExtended.Item ||
      itemType === EnumTreeItemTypeExtended.NewItemPrompt ||
      (itemType === EnumTreeItemTypeExtended.RenamePrompt &&
        (item as IBirchRenamePromptHandle).target.type ===
          EnumTreeItemType.Item)
        ? 'item'
        : 'folder'

    /**
     * Create right hand side icon array
     */
    const icons = itemMenus.map(({ icon, command, handler }) => {
      const onClick = React.useCallback(
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          handler(item)
        },
        [handler, item]
      )
      return (
        <WidgetStyle key={command} icon={theme.icons[icon]} onClick={onClick} />
      )
    })

    /**
     * Render item row
     */
    return (
      <TreeViewItemRowStyle
        ref={ref as any}
        className={cn(decorations ? decorations.classlist : null)}
        data-depth={item.depth}
        onClick={handleClick}
        title={!itemIsPrompt ? (item as IBirchItem).path : undefined}
        {...props}
      >
        {itemOrFolder === 'folder' ? (
          <FolderToggleIcon open={isDirExpanded} />
        ) : null}

        <TreeViewItemLabel className="birch-label">
          {itemOrFolder === 'item' && (
            <Icon
              mx={1}
              src={(item as IBirchItem).iconPath || 'octicons/file'}
            />
          )}
          <TreeViewItemFileName>
            {itemIsPrompt && item instanceof BirchPromptHandle ? (
              <item.BirchTreeViewItemPrompt />
            ) : (
              (item as IBirchItem).label
            )}
          </TreeViewItemFileName>
        </TreeViewItemLabel>
        {icons}
      </TreeViewItemRowStyle>
    )
  }
)
