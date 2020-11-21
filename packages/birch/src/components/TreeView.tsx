import * as React from 'react'
import styled from 'styled-components'
import { themeGet } from '@styled-system/theme-get'
import { TreeViewHeading, TreeViewHeadingIcons } from './TreeViewHeading'
import { ITreeViewExtendedHandle, ITreeViewProps } from '../types'
import { BirchTreeView } from './BirchTreeView'

const HeadingContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 100vh;
  background: transparent;
  &:hover ${TreeViewHeadingIcons} {
    opacity: 1;
  }
`

const TreeViewWrapperStyled = styled.div`
	flex: 1;
	font-family: ${themeGet('fonts.serif')};
	font-size: ${themeGet('fontSizes.1')}px;
	color: ${themeGet('colors.primary')};
	background: transparent;
	width: 100%;
	overflow-y: auto;

	& .birch-tree-view:focus {
	outline: none;
	}

	& .birch-tree-view::-webkit-scrollbar {
		width: 8px;
		height: 8px;
		&-track {
			background: transparent;
		}
		&-corner {
			background: transparent;
		}
		&-thumb {
			background: ${themeGet('colors.offwhite')};
			&:hover {
				background: ${themeGet('colors.offwhite')};
			}
		}
`

export const TreeView: React.FC<ITreeViewProps> = ({ children, ...props }) => {
  const treeViewHandleExtended = React.useRef<ITreeViewExtendedHandle>(null!)
  const id = props.options.treeDataProvider.id

  return (
    <HeadingContainer>
      <TreeViewHeading
        id={id}
        handle={treeViewHandleExtended}
        title={props.title}
        titleMenus={props.options.contributes.titleMenus}
      />
      {children}
      <TreeViewWrapperStyled>
        <BirchTreeView handle={treeViewHandleExtended} {...props} />
      </TreeViewWrapperStyled>
    </HeadingContainer>
  )
}
