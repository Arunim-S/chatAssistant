import React from "react";
import icons from "../../icons";
const Header = ({
  handleSessions,
  handleDeleteSession,
  session_no,
  selectAssistant,
  setSelectAssistant,
}) => {
  /**
   * Configuration of Icons used in buttons
   * @type {Object}
   */
  const assistantButtons = [
    { id: 0, icon: icons.writingAIcon },
    { id: 1, icon: icons.knowAssisIcon },
    { id: 2, icon: icons.grammerAssisIcon },
    { id: 3, icon: icons.summaryAssisIcon },
    { id: 4, icon: icons.techAssisIcon },
    { id: 5, icon: icons.masterAssisIcon },
  ];
  return (
    <div className="flex justify-around bg-gray-200">
      <div className="flex gap-4 items-center">
        <div className="flex gap-4">
          <button className="p-4 bg-white rounded-xl" onClick={handleSessions}>
            {icons.sessionIcon}
          </button>
          <button
            className="flex items-center justify-center gap-4 bg-red-300 rounded-xl px-4"
            onClick={(e) => {
              handleDeleteSession(session_no);
            }}
          >
            {icons.deleteIcon}
          </button>
        </div>
        <p>Choose an assistant:</p>
        {assistantButtons &&
          assistantButtons.map((assistant) => (
            <button
              key={assistant.id}
              className={`p-4 ${
                selectAssistant === assistant.id
                  ? "bg-black text-white"
                  : "bg-white"
              } rounded-xl`}
              onClick={() => {
                setSelectAssistant(assistant.id);
              }}
            >
              {assistant.icon}
            </button>
          ))}
      </div>
    </div>
  );
};

export default Header;
