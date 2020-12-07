import styled from 'styled-components'

import { color, space, ColorProps, SpaceProps } from 'styled-system'

export interface IconProps extends ColorProps, SpaceProps {
  src: string
}

export const Icon = styled<any>('span')`
  text-align: center;
  font-style: normal;
  font-family: '${(props) =>
    props.src.indexOf('/') > -1
      ? props.src.split('/')[0]
      : Object.keys(props.theme.icons)[0]}' !important;

  &:before {
    height: inherit;
    width: inherit;
    display: inline-block;
    content: '${(props) =>
      props.src.indexOf('/') > -1
        ? props.theme.icons[props.src.split('/')[0]][props.src.split('/')[1]]
        : props.theme.icons[Object.keys(props.theme.icons)[0]][props.src]}';
  }
  ${color};
  ${space};
`
