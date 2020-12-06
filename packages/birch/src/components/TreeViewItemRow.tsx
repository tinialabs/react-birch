import * as React from 'react'

import { useCallback, forwardRef, useReducer, useContext } from 'react'
import cn from 'classnames'
import styled, { ThemeContext } from 'styled-components'
import { themeGet } from '@styled-system/theme-get'
import {
  BirchFolder,
  BirchItem,
  PromptHandleRename,
  PromptHandle
} from '../models'

import {
  EnumBirchItemType,
  EnumTreeItemType,
  ITreeViewItemRendererProps
} from '../types'

import { Icon } from './Icon'
import { useDecorationsChild } from './BirchUseDecorations'
import { usePromptsChild } from './BirchUsePrompts'

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
    content: url('${props => props.icon}');
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
  padding-left: ${props => 16 * (props['data-depth'] - 1)}px;
  border-radius: ${themeGet('radii.1')}px;
  display: flex;

  &:hover,
  &.pseudo-active {
    background-color: ${themeGet('colors.beige1')};
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
  color: ${themeGet('colors.primary')};
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

const useForceUpdate = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [, update] = useReducer(
    (num: number): number => (num + 1) % 1_000_000,
    0
  )
  return update as () => void
}


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
    }: ITreeViewItemRendererProps,
    ref
  ) => {
    const forceUpdate = useForceUpdate()
    const theme: any = useTheme()

    /**
     * Cascade Decorations
     */
    useDecorationsChild({ decorations, forceUpdate })

    /**
     * isPrompt state helper for Renaming and Adding New Folders and Items
     */
    const isPrompt = usePromptsChild(itemType)[0]

    /**
     * On Click Callback
     */
    const handleClick = useCallback(
      (ev: React.MouseEvent) => {
        if (
          itemType === EnumBirchItemType.BirchItem ||
          itemType === EnumBirchItemType.BirchFolder
        ) {
          onClick(ev, item as BirchItem, itemType)
        }
      },
      [item, itemType, onClick]
    )

    if ((item as BirchItem).disposed) {
      return null
    }

    /**
     * Current item state helpers
     */
    const isDirExpanded =
      itemType === EnumBirchItemType.BirchFolder
        ? (item as BirchFolder).expanded
        : itemType === EnumBirchItemType.RenamePrompt &&
          (item as PromptHandleRename).target.type === EnumTreeItemType.Folder
        ? ((item as PromptHandleRename).target as BirchFolder).expanded
        : false

    const itemOrFolder =
      itemType === EnumBirchItemType.BirchItem ||
      itemType === EnumBirchItemType.NewItemPrompt ||
      (itemType === EnumBirchItemType.RenamePrompt &&
        (item as PromptHandleRename).target.constructor === BirchItem)
        ? 'item'
        : 'folder'

    /**
     * Create right hand side icon array
     */
    const icons = itemMenus.map(({ icon, command, handler }) => (
      <WidgetStyle
        key={command}
        icon={theme.icons[icon]}
        onClick={e => {
          e.preventDefault()
          e.stopPropagation()
          handler(item)
        }}
      />
    ))

    /**
     * Render item row
     */
    return (
      <TreeViewItemRowStyle
        ref={ref as any}
        className={cn(decorations ? decorations.classlist : null)}
        data-depth={item.depth}
        onClick={handleClick}
        title={!isPrompt ? (item as BirchItem).path : undefined}
        {...props}
      >
        {itemOrFolder === 'folder' ? (
          <FolderToggleIcon open={isDirExpanded} />
        ) : null}

        <TreeViewItemLabel className="birch-label">
          {itemOrFolder === 'item' && (
            <Icon
              mx={1}
              src={(item as BirchItem).iconPath || 'octicons/file'}
            />
          )}
          <TreeViewItemFileName>
            {isPrompt && item instanceof PromptHandle ? (
              <item.ProxiedInput />
            ) : (
              (item as BirchItem).label
            )}
          </TreeViewItemFileName>
        </TreeViewItemLabel>
        {icons}
      </TreeViewItemRowStyle>
    )
  }
)
