import { useEffect, useState, useRef } from "react";
import { CosmosClient } from "@azure/cosmos";
import DotLoader from "react-spinners/DotLoader";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { getResponse } from "../../getResponse";
import icons from "../../icons";
import Sidebar from "../Sidebar/sidebar";
import Header from "../Header/Header";
import "../../hourglass.css";
/**
 * Message Class
 * @type {Class}
 */
class Message {
  constructor(userName, question, answer, timestamp, questiontype, persona) {
    this.userName = userName;
    this.question = question;
    this.answer = answer;
    this.timestamp = timestamp;
    this.questiontype = questiontype;
    this.persona = persona;
  }
}

/**
 * User Data Class
 * @type {Class}
 */
class UserData {
  constructor(userId, userName, sessions, timestamp) {
    this.userId = userId;
    this.userName = userName;
    this.sessions = sessions;
    this.timestamp = timestamp;
  }
}

/**
 * Session Class
 * @type {Class}
 */
class Session {
  constructor(sessionId, userName, questions, timestamp) {
    this.sessionId = sessionId;
    this.userName = userName;
    this.questions = questions;
    this.timestamp = timestamp;
  }
}

/**
 * connection string for Cosmos DB
 * @type {String}
 */
const connection_string = import.meta.env.VITE_COSMOS_CONNECTION_STRING;

/**
 * client for database
 * @type {Object}
 */
const clientCosmos = new CosmosClient(connection_string);

/**
 * container to store messages
 * @type {Object}
 */
const container = clientCosmos.database("Testing_Purpose").container("test");

/**
 * Username stored in the localstorage
 * @type {String}
 */
const userName = localStorage.getItem("userName");

const chatClient = () => {
  const [copied, setCopied] = useState(false);
  const [userData, setUserData] = useState([]);
  const [sessionData, setSessionData] = useState([]);
  const [session, setSession] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchItem, setSearchItem] = useState("");
  const [deletingSesstion, setDeletingSession] = useState(false);
  const [selectAssistant, setSelectAssistant] = useState(5);
  let [messages, setMessages] = useState([]);
  let [open, setOpen] = useState(true);
  let session_no = session;

  /**
   * Message reference
   * @type {Function}
   */
  const messagesEndRef = useRef(null);

  /**
   *  Get Messages from the data base and create a user if there is no user present
   *  @type {Function}
   * */
  const getMessagesFromCosmosDB = async () => {
    try {
      const { resources } = await container.items.readAll().fetchAll();
      let userExists = false;
      resources.forEach((e) => {
        if (e.userName === userName) {
          userExists = true;
          setUserData(e);
          setMessages(e.sessions[0]?.questions || []);
          setSessionData(e.sessions);
        }
      });

      if (!userExists) {
        const timestamp = new Date();
        const userId = generateRandomUserId();
        const session = new Session(
          generateRandomSessionId(),
          userName,
          [],
          timestamp
        );
        const newUser = new UserData(userId, userName, [session], timestamp);
        await container.items.create(newUser);
        setMessages([]);
      }
    } catch (error) {
      console.error("Error retrieving messages from Cosmos DB:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMessagesFromCosmosDB();
  }, []);

  let currentSession = userData.sessions && userData.sessions[session_no];
  messages = currentSession && currentSession.questions;

  /**
   *  Generate a random user ID
   *  @type {Function}
   * */
  const generateRandomUserId = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  /**
   * Handle search item
   * @type {Function}
   */
  const handleSearchItem = (e) => {
    setSearchItem(e.target.value);
  };

  /**
   * Add message to the state and update the database as well
   * @type {Function}
   */
  const addMessage = async (
    userName,
    answer,
    question,
    persona,
    userData,
    session_no
  ) => {
    let currentSession = userData.sessions && userData.sessions[session_no];
    const timestamp = new Date();
    const questionType = "New Chat";

    const newMessage = new Message(
      userName,
      question,
      answer,
      timestamp,
      questionType,
      persona
    );
    currentSession.questions.push(newMessage);
    setUserData((prevUserData) => ({
      ...prevUserData,
      sessions: [currentSession],
    }));
    setMessages(currentSession.questions);
    console.log(messages);
    await container.items.upsert(userData);
  };

  /**
   * Handle the message copied function
   * @type {Function}
   */
  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  /**
   * This function generates the random session id string
   * @type {Function}
   */
  const generateRandomSessionId = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  /**
   * scroll to see messages to bottom
   * @type {Function}
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Handle Search
   * @type {Function}
   */
  const handleSearch = async () => {
    try {
      if (searchItem == "") return;
      const requestData = {
        messages: [
          {
            role: "user",
            content: searchItem,
          },
        ],
      };
      setLoading(true);
      const response = await getResponse(
        requestData,
        selectAssistant,
        setLoading
      );
      const timestamp = new Date();
      const questionType = "New Chat";
      // console.log(session_no);
      const newMessage = new Message(
        userName,
        searchItem,
        response,
        timestamp,
        questionType,
        selectAssistant == 0
          ? "Writing Assistant"
          : selectAssistant == 1
          ? "Knowledge Assistant"
          : "Simple"
      );
      if (userData.sessions.length == 0) {
        userData.sessions.push(
          new Session(generateRandomSessionId(), userName, [], timestamp)
        );
        setSessionData(userData.sessions);
      }
      addMessage(
        userName,
        response,
        searchItem,
        "Assistant",
        userData,
        session_no
      );
      setSearchItem("");
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Handle Delete Message
   * @param {string} index
   * @type {Function}
   */
  const handleDeleteMessage = async (index) => {
    const updatedMessages = [...messages];
    updatedMessages.splice(index, 1);

    setMessages(updatedMessages);
    let currentSession = userData.sessions && userData.sessions[session_no];
    currentSession.questions = updatedMessages;
    setUserData(userData);
    await container.items.upsert(userData);
  };

  /**
   * Handle Delete Session
   * @param {string} index
   * @type {Function}
   */
  const handleDeleteSession = async (index) => {
    const currentSession = userData.sessions;
    currentSession.splice(index, 1);
    userData.sessions = currentSession;
    setSessionData(userData.sessions);
    setUserData(userData);
    setDeletingSession(true);
    setTimeout(() => {
      setDeletingSession(false);
    }, 1000);
    setMessages(currentSession.questions);
    await container.items.upsert(userData);
  };

  /**
   * Handle Create Session
   * @type {Function}
   */
  async function handleSessions() {
    const timestamp = new Date();
    userData.sessions.push(
      new Session(generateRandomSessionId(), userName, [], timestamp)
    );
    // location.reload();
    setUserData(userData);
    setSessionData(userData.sessions);
    setMessages([]);
    await container.items.upsert(userData);
  }

  /**
   * Override CSS for Loader
   * @type {Object}
   */
  const override = {
    display: "flex",
    borderColor: "white",
  };

  /**
   * This function process the text to fomrat the message to be rendered on the screen
   * @type {Function}
   */
  function processText(inputString) {
    const stringWithBreaks = inputString.replace(/\n/g, "<br>");
    const stringWithoutUrls = stringWithBreaks.replace(
      /\((https?:\/\/[^\s]+)\)/g,
      ""
    );
    const stringWithHeadings = stringWithoutUrls.replace(
      /\*\*(.*?)\*\*/g,
      '<h1 style="font-size: 1.5rem">$1</h1>'
    );
    const boldText = stringWithHeadings.replace(/`([^`]+)`/g, "<b>$1</b>");
    // console.log(boldText);
    return boldText;
  }

  if(window.innerWidth<1024)open=false;

  console.log(open)

  // Get the input field
  var input = document.getElementById("search");

  input&&input.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("btn").click();
    }
  });

  return (
    <div className="flex flex-col h-screen w-full items-center justify-cneter">
      <div className="bg-gray-200 flex w-full h-full">
      {open&&
        <div className="flex lg:w-[20rem]">
          <Sidebar
            session_no={session_no}
            sessionData={sessionData}
            setSession={setSession}
            open={open}
          ></Sidebar>
        </div>
}
        {open?
        <button onClick={(e)=>{setOpen(false)}} className="w-10 text-red-400 text-2xl"><b>{"<"}</b></button>
        :
        <button onClick={(e)=>{setOpen(true)}} className="w-10 text-red-400 text-2xl"><b>{">"}</b></button>
        }
        {deletingSesstion == true ? (
          <div className="w-full h-full flex absolute items-center justify-center z-50">
            <DotLoader
              color="#FCA5A5"
              loading={deletingSesstion}
              cssOverride={override}
              size={250}
              aria-label="Loading Spinner"
              data-testid="loader"
            />
          </div>
        ) : (
          <div className="flex flex-col bg-gray-200 w-full h-full border gap-4 pt-12 px-12">
            <Header
              handleSessions={handleSessions}
              handleDeleteSession={handleDeleteSession}
              session_no={session_no}
              selectAssistant={selectAssistant}
              setSelectAssistant={setSelectAssistant}
            ></Header>
            <div className="gap-4 h-full flex flex-col">
              
              <div className="relative flex flex-col w-full h-[65vh] rounded-[1rem] overflow-y-scroll p-4">
                {messages &&
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className="flex relative flex-col bg-black text-white p-12 rounded-[2rem] gap-2 m-2 message"
                    >
                      <div className="flex justify-end">
                        <button
                          className="text-center w-32"
                          onClick={() => handleDeleteMessage(index)}
                        >
                          {icons.deleteMessage}
                        </button>
                      </div>

                      <p>
                        <b>User</b>
                      </p>
                      <span className="rounded-xl pb-8">
                        {message.question}
                      </span>
                      <p>
                        <b>Assistant</b>
                      </p>
                      {message.answer.map((e, index) => (
                        <div key={index}>
                          {e.map((f, innerIndex) => (
                            <div key={innerIndex}>
                              {f.type === "code" ? (
                                <div className="flex flex-col justify-end w-full">
                                  <CopyToClipboard
                                    text={f.content}
                                    onCopy={handleCopy}
                                  >
                                    <button className="text-right px-8">
                                      {copied ? "Copied!" : "Copy"}
                                    </button>
                                  </CopyToClipboard>
                                  <pre className="bg-gray-300 rounded-xl p-12 m-4 text-black ">
                                    {f.content}
                                  </pre>
                                </div>
                              ) : (
                                <div
                                  className=" text-white"
                                  dangerouslySetInnerHTML={{
                                    __html: processText(f.content),
                                  }}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                <div ref={messagesEndRef}></div>
              </div>
              <div className="flex ">
                <p className="p-4">
                  Switched to :{" "}
                  {selectAssistant == 0
                    ? "Writing Assistant"
                    : selectAssistant == 1
                    ? "Knowledge Assistant"
                    : selectAssistant == 2
                    ? "Grammer Assistant"
                    : selectAssistant == 3
                    ? "Summary Assistant"
                    : selectAssistant == 4
                    ? "TOT Assistant"
                    : selectAssistant == 5
                    ? "Master Assistant"
                    : "Assistant"}
                </p>
              </div>

              <div className="flex h-fit w-full flex-col items-end justify-center">
                <textarea
                  placeholder="search anything here ..."
                  onChange={handleSearchItem}
                  value={searchItem}
                  className="pl-8 pr-16 py-4 relative shadow-lg h-[12vh] rounded-[1rem] w-full"
                  id="search"
                />
                <button
                  className="absolute px-8"
                  onClick={handleSearch}
                  type="submit"
                  id="btn"
                  alt="button submit"
                >
                  {!loading ? (
                    <div className="hover:translate-x-2 hover:ease-in-out hover:transition-all">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="28px"
                        height="28px"
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d="M11.5003 12H5.41872M5.24634 12.7972L4.24158 15.7986C3.69128 17.4424 3.41613 18.2643 3.61359 18.7704C3.78506 19.21 4.15335 19.5432 4.6078 19.6701C5.13111 19.8161 5.92151 19.4604 7.50231 18.7491L17.6367 14.1886C19.1797 13.4942 19.9512 13.1471 20.1896 12.6648C20.3968 12.2458 20.3968 11.7541 20.1896 11.3351C19.9512 10.8529 19.1797 10.5057 17.6367 9.81135L7.48483 5.24303C5.90879 4.53382 5.12078 4.17921 4.59799 4.32468C4.14397 4.45101 3.77572 4.78336 3.60365 5.22209C3.40551 5.72728 3.67772 6.54741 4.22215 8.18767L5.24829 11.2793C5.34179 11.561 5.38855 11.7019 5.407 11.8459C5.42338 11.9738 5.42321 12.1032 5.40651 12.231C5.38768 12.375 5.34057 12.5157 5.24634 12.7972Z"
                          stroke="#000000"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    </div>
                  ) : (
                    <div className="hourglass">{icons.hourGlass}</div>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default chatClient;
