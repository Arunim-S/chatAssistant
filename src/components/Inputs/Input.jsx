import React from "react";
import "./input.css";
const Input = ({ handleSearchItem, searchItem }) => {
  return (
    <div>
      <input
        placeholder="search anything here ..."
        onChange={handleSearchItem}
        value={searchItem}
        className="p-4 relative shadow-lg rounded-[2rem] w-full"
        id="search"
      />
    </div>
  );
};

export default Input;
