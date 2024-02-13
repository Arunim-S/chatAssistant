import React from "react";
import './input.css'
const Input = ({handleSearchItem, searchItem}) => {
  return (
    <div>
      <input
        placeholder="search anything here ..."
        onChange={handleSearchItem}
        value={searchItem}
        className="input"
        id="search"
      />
    </div>
  );
};

export default Input;
