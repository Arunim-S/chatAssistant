import React, { useState } from "react";
import "./sidebar.css";

const Sidebar = ({ session_no, sessionData, setSession, open}) => {
  // Ensure sessionData is an array before mapping over it
  // if (!Array.isArray(sessionData)) {
  //   return <div>No sessions available</div>;
  // }
  return (
    <div className={`text-center p-4 gap-2 ${open? "hidden lg:flex" : "hidden" } flex-col bg-black text-white w-full h-full lg:flex`}>
      <p className="p-2">Chat Sessions</p>
      {sessionData &&
        sessionData.map((session, index) => (
          <button
            onClick={() => {
              setSession(index);
            }}
            key={index}
            className={`${
              session_no === index
                ? "bg-gray-500 whitespace-nowrap overflow-hidden overflow-ellipsis text-white"
                : "bg-white whitespace-nowrap overflow-hidden overflow-ellipsis text-black"
            }  p-4  w-full rounded-xl`}
          >
            {session.questions && session.questions.length > 0
              ? session.questions[session.questions.length - 1].question
              : "Empty Session"}
          </button>
        ))}
    </div>
  );
};

export default Sidebar;
