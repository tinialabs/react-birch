import Menu from './StyledMenu'
import styled from 'styled-components'

const StyledSubMenu = styled(Menu)`
    position: absolute;
    display: none;
    background: #ffffff;
    color: #4e4e4e;
    box-shadow: 2px 3px 6px #545454; 
    }  
    & li:not(.disabled) button:hover {
        background-color: #efefef; 
    }
    & ul {
        border-top: 1px solid #eaeaea; 
    }
`

export default StyledSubMenu