import * as React from 'react'
import { useMemo } from 'react'
import styled from 'styled-components'
import { space, fontFamily, color } from 'styled-system'
import type { IBirchTreeViewHandleExtended } from 'react-birch-types'

const Flex = styled.div.attrs({})`
  display: flex;
  ${space};
` as React.FC<any>

const HeadingText = styled.li.attrs({
  p: 2,
  fontFamily: 'heading',
  color: 'gray6'
})`
  position: relative;
  display: block;
  overflow: hidden;
  font-size: 12px;
  letter-spacing: 0.33em;
  text-decoration: none;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
  flex: 1 1 1auto;
  ${space} ${fontFamily} ${color};
`

const HeadingIcon = styled<any>('i')`
  font-size: 14px;
  text-align: center;
  height: 14px;
  width: 14px;
  cursor: pointer;
  margin-right: 10px;

  &:before {
    height: inherit;
    width: inherit;
    display: inline-block;
    content: ${(props) => props.icon};
  }
`

export const TreeViewHeadingIcons = styled.div.attrs({
  py: 2
})`
  margin-left: auto;
  opacity: 0;
  display: flex;
  ${space}
`

export interface TreeViewHeadingProps {
  id: number
  title: string
  titleMenus: {
    command: string
    title: string
    icon: string
    handler?: (handle: IBirchTreeViewHandleExtended) => void
  }[]
  handle: React.MutableRefObject<IBirchTreeViewHandleExtended>
}

export const TreeViewHeading: React.FC<TreeViewHeadingProps> = ({
  id,
  title,
  titleMenus,
  handle
}) => {
  const icons = useMemo(() => {
    return titleMenus.map(({ command, title, icon, handler }) => {
      return (
        <HeadingIcon
          key={command}
          title={title}
          // eslint-disable-next-line react/jsx-no-bind
          onClick={() => {
            handler!(handle.current)
          }}
          icon={icon}
        />
      )
    })
  }, [titleMenus, id, handle.current && handle.current.id])

  return (
    <Flex mr={2}>
      <HeadingText>{title}</HeadingText>
      <TreeViewHeadingIcons>{icons}</TreeViewHeadingIcons>
    </Flex>
  )
}
