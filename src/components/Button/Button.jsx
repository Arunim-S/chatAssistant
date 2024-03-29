import React from 'react'
import PropTypes from "prop-types"
function Button({label, backgroundColor="green", size="md", handleClick, fontSize, borderRadius}) {
let scale = 1;
if(size=="sm")scale=0.75
if(size=="lg")scale=1.5

const style = {backgroundColor, padding:`${scale*0.5}rem ${scale*1}rem`, border:"none", fontSize: `${fontSize}`, borderRadius: `${borderRadius}`} 

return (
    <button onClick={handleClick} style={style}>{label}</button>
  )
}
Button.propTypes = {
  label: PropTypes.string,
  backgroundColor: PropTypes.string,
  size: PropTypes.oneOf(["sm", "md", "lg"]), 
  handleClick: PropTypes.func,
  fontSize: PropTypes.string,
  borderRadius: PropTypes.string
}

export default Button