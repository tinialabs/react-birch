import styled, { css } from 'styled-components'
import { Portal } from './Portal'

const StyledMenu = styled(Portal).attrs({
  id: 'context-menu-portal'
})`
{
    border-radius: 4px;
    min-width: 130px;
    font-size: 13px;
    z-index: 10;
    background: #FFF;
    color: #4e4e4e; 
    position: fixed;
    display: none;

    ${props =>
      props.dark
        ? css`
            background: #1d1d1d;
            color: #969696;
            box-shadow: 2px 3px 8px black;
          `
        : css`
            background: #ffffff;
            color: #4e4e4e;
            box-shadow: 2px 3px 6px #545454;
          `}
`

export default StyledMenu
