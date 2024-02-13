import React from "react";

const Header = ({ icons, handleSessions, handleDeleteSession, assistantButtons, session_no, selectAssistant, setSelectAssistant }) => {
  return (
    <div className="flex justify-around">
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
      <div className="flex gap-4 items-center">
        <p>Choose an assistant:</p>
        {assistantButtons.map((assistant) => (
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
