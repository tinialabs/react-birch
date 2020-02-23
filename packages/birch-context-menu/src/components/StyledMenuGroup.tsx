import styled from 'styled-components'

const StyledMenuGroup = styled.ul<{ dark?: string }>`
{
    list-style: none;
    padding: 0;
    margin: 0;
    padding: 4px 0; 

    border-top:${props =>
      props.dark ? `1px solid #676767` : `1px solid #eaeaea`};

    &:first-child {
        border-top: 0; 
    }
`

export default StyledMenuGroup
