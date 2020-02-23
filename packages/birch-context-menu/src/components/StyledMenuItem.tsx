import styled from 'styled-components'

export const StyledMenuItem = styled.li<{ dark?: string }>`
  & .disabled {
    opacity: 0.5;
  }

  &:not(.disabled) button:hover {
    background-color: ${props => (props.dark ? `#2f2f2f` : `#efefef`)};
  }
`

export const StyledMenuButton = styled.button`
  background: none;
  border: none;
  border-radius: 0;
  padding: 3px 2px 3px 7px;
  width: 100%;
  color: inherit;
  display: flex;
  align-items: center;
  font-size: inherit;
  outline: none;

  & span.label {
    flex-grow: 1;
    text-align: left;
  }

  & span.label.sublabel {
    font-size: 70%;
    opacity: 0.8;
    margin-left: 30px;
    margin-right: 10px;
    text-align: right;
  }

  & i.submenu-expand {
    display: inline-block;
    font: normal normal normal 14px/1 sans-serif;
    font-size: inherit;
    text-rendering: auto;
    -webkit-font-smoothing: antialiased;
  }

  & i.submenu-expand:after {
    content: '⏵';
  }
`
