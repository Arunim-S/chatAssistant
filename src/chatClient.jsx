import { useEffect, useState, useRef } from "react";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import axios from "axios";
import { CosmosClient } from "@azure/cosmos";
import DotLoader from "react-spinners/DotLoader";

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

class UserData {
  constructor(userId, userName, sessions, timestamp) {
    this.userId = userId;
    this.userName = userName;
    this.sessions = sessions;
    this.timestamp = timestamp;
  }
}

class Session {
  constructor(sessionId, userName, questions, timestamp) {
    this.sessionId = sessionId;
    this.userName = userName;
    this.questions = questions;
    this.timestamp = timestamp;
  }
}

/**
 * Endpoint for Cosmos DB
 * @type {string}
 */
const endpoint_cosmos = import.meta.env.VITE_AZURE_COSMOS_ENDPOINT;

/**
 * connection string for Cosmos DB
 * @type {string}
 */
const connection_string = import.meta.env.VITE_COSMOS_CONNECTION_STRING;

/**
 * Api Key for cosmos DB
 * @type {string}
 */
const key_cosmos = import.meta.env.VITE_AZURE_COSMOS_KEY;

/**
 * client for database
 * @type {Object{}}
 */
const clientCosmos = new CosmosClient(connection_string);

/**
 * container to store messages
 * @type {Object{}}
 */
const container = clientCosmos.database("Testing_Purpose").container("test");
/**
 * Endpoint
 * @type {string}
 */
const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;

/**
 * Api Key
 * @type {string}
 */
const azureApiKey = import.meta.env.VITE_AZURE_OPENAI_KEY;

/**
 * Headers for API
 * @type {Object{}}
 */
const headers = {
  "Content-Type": "application/json",
  "api-key": azureApiKey,
};

const headersCors = {
  "Content-Type": "application/json",
  "api-key": azureApiKey,
};

const userName = localStorage.getItem("userName");

const chatClient = ({setSessionData, session}) => {
  const [loading, setLoading] = useState(true);
  const [searchItem, setSearchItem] = useState("");
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState([]);
  const [sessionTime, setSessionTime] = useState("");
  const [selectAssistant, setSelectAssistant] = useState(0);
  let session_no = session;
  const messagesEndRef = useRef(null);

  const getMessagesFromCosmosDB = async () => {
    try {
      const { resources } = await container.items.readAll().fetchAll();
      let userExists = false;
      console.log(resources);
      // console.log("User Name:" +  userName)
      resources.forEach((e) => {
        if (e.userName === userName) {
          userExists = true;
          setUserData(e);
          // Ensure messages is initialized as an array, even if there are no questions
          setMessages(e.sessions[0]?.questions || []);
          setSessionData(e.sessions)
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
        // Ensure messages is initialized as an array for the new user
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
   * Add message
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
    console.log(userData);
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

    // Update the user data with the modified session
    setUserData((prevUserData) => ({
      ...prevUserData,
      sessions: [currentSession],
    }));
    await container.items.upsert(userData);
    console.log(userData);
    setMessages(currentSession.questions);
  };

  const generateRandomSessionId = () => {
    return Math.random().toString(36).substr(2, 8);
  };

  /**
   * scroll to see messages to bottom
   * @type {Function}
   */
  const scrollToBottom = () => {
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * get the response
   * @type {Function}
   * @param {string} endpoint
   * @param {Object{}} requestdata
   * @param {Object{}} headers
   */
  async function getResponse(endpoint, requestData, headers) {
    let output = "";
    if(selectAssistant == "0")
    {
      let res = await axios
      .post(import.meta.env.VITE_WRITING_ASST, requestData)
      .then((response) => {
        const data = response.data;
        data &&
          data.choices.map((e) => {
            output = e.message.content;
          });
      })
      .catch((error) => {
        console.error(error);
      });
    }
    else if(selectAssistant == "1")
    {
      let res = await axios
      .post(import.meta.env.VITE_KNOWLEDGE_ASST, requestData)
      .then((response) => {
        const data = response.data;
        console.log(response)
        data &&
          data.choices.map((e) => {
            output = e.message.content;
          });
      })
      .catch((error) => {
        console.error(error);
      });
    }
    else{
      let res = await axios
      .post(endpoint, requestData, { headers })
      .then((response) => {
        const data = response.data;
        data &&
          data.choices.map((e) => {
            output = e.message.content;
          });
      })
      .catch((error) => {
        console.error(error);
      });
    }

    setLoading(false);
    return output;
  }

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
            role: "system",
            content: searchItem,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
        frequency_penalty: 0,
        presence_penalty: 0,
        top_p: 0.95,
        stop: null,
      };
      setLoading(true);
      const response = await getResponse(endpoint, requestData, headers);
      const timestamp = new Date();
      const questionType = "New Chat";

      const newMessage = new Message(
        userName,
        searchItem,
        response,
        timestamp,
        questionType,
        selectAssistant==0?"Writing Assistant" : (selectAssistant == 1)? "Knowledge Assistant" : "Simple"
      );
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      console.log("hi");
      await addMessage(
        userName,
        response,
        searchItem,
        "Assistant",
        userData,
        session_no
      );
      // let updatedUserData = { ...userData };
      // updatedUserData.questions = [...userData.questions, newMessage];
      // console.log(updatedUserData)
      // await container.items.upsert(updatedUserData);
      setSearchItem("");
    } catch (err) {
      console.error(err);
    }
  };
  /**
   * Handle Search
   * @param {string} index
   * @type {Function}
   */
  const handleDelete = async (index) => {
    const updatedMessages = [...messages];
    updatedMessages.splice(index, 1);

    setMessages(updatedMessages);
    let currentSession = userData.sessions && userData.sessions[session_no];
    currentSession.questions = updatedMessages;
    setUserData(userData);
    await container.items.upsert(userData);
  };
  const handleSessions  = async() =>{
    const timestamp = new Date();
    console.log("hi")
    userData.sessions.push(new Session(
      generateRandomSessionId(),
      userName,
      [],
      timestamp
    ));
    setMessages([]);
    setSessionData(userData.sessions);
    location.reload()
    await container.items.upsert(userData)
  }
  const override = {
    display: "flex",
    borderColor: "white",
  };
  console.log(selectAssistant);

  return (
    <div className="flex flex-col h-screen w-full items-center justify-cneter">
      <div className="flex w-full gap-12 h-full">
        <div className="flex flex-col bg-gray-200 w-full h-full border gap-4 p-12">
          <div className="flex justify-evenly">
            <h1 className="text-[2rem]">Chat Assistant</h1>
            <button className="p-4 bg-white rounded-xl" onClick={handleSessions}> Add new Session</button>
            <div className="flex gap-4 items-center">
              <p>Choose a assistant:</p>
              <button
                className={`p-4 ${
                  selectAssistant == "0" ? "bg-black text-white" : "bg-white"
                } rounded-xl`}
                onClick={(e) => {
                  setSelectAssistant(0);
                }}
              >
                Writing
              </button>
              <button
                className={`p-4 ${
                  selectAssistant == "1" ? "bg-black text-white" : "bg-white"
                } rounded-xl`}
                onClick={(e) => {
                  setSelectAssistant(1);
                }}
              >
                Knowledge
              </button>
            </div>
          </div>

          <div className="gap-4 h-full flex flex-col">
            <div className="relative flex flex-col w-full h-[65vh] rounded-[1rem] overflow-y-scroll p-4">
              {loading && (
                <div className="flex absolute w-full mx-auto h-full items-center justify-center">
                  <DotLoader
                    color="#858f6f"
                    loading={loading}
                    cssOverride={override}
                    size={150}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                  />
                </div>
              )}
              {messages &&
                messages.map((message, index) => (
                  <div
                    key={index}
                    className="flex relative flex-col bg-black text-white p-12 rounded-[2rem] gap-2 m-2 message"
                  >
                    <div className="flex justify-end">
                      <button
                        className="text-center w-32"
                        onClick={() => handleDelete(index)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          xmlns:xlink="http://www.w3.org/1999/xlink"
                          fill="#fff"
                          version="1.1"
                          id="Capa_1"
                          width="30px"
                          height="30px"
                          viewBox="0 0 482.428 482.429"
                          xml:space="preserve"
                        >
                          <g>
                            <g>
                              <path d="M381.163,57.799h-75.094C302.323,25.316,274.686,0,241.214,0c-33.471,0-61.104,25.315-64.85,57.799h-75.098    c-30.39,0-55.111,24.728-55.111,55.117v2.828c0,23.223,14.46,43.1,34.83,51.199v260.369c0,30.39,24.724,55.117,55.112,55.117    h210.236c30.389,0,55.111-24.729,55.111-55.117V166.944c20.369-8.1,34.83-27.977,34.83-51.199v-2.828    C436.274,82.527,411.551,57.799,381.163,57.799z M241.214,26.139c19.037,0,34.927,13.645,38.443,31.66h-76.879    C206.293,39.783,222.184,26.139,241.214,26.139z M375.305,427.312c0,15.978-13,28.979-28.973,28.979H136.096    c-15.973,0-28.973-13.002-28.973-28.979V170.861h268.182V427.312z M410.135,115.744c0,15.978-13,28.979-28.973,28.979H101.266    c-15.973,0-28.973-13.001-28.973-28.979v-2.828c0-15.978,13-28.979,28.973-28.979h279.897c15.973,0,28.973,13.001,28.973,28.979    V115.744z" />
                              <path d="M171.144,422.863c7.218,0,13.069-5.853,13.069-13.068V262.641c0-7.216-5.852-13.07-13.069-13.07    c-7.217,0-13.069,5.854-13.069,13.07v147.154C158.074,417.012,163.926,422.863,171.144,422.863z" />
                              <path d="M241.214,422.863c7.218,0,13.07-5.853,13.07-13.068V262.641c0-7.216-5.854-13.07-13.07-13.07    c-7.217,0-13.069,5.854-13.069,13.07v147.154C228.145,417.012,233.996,422.863,241.214,422.863z" />
                              <path d="M311.284,422.863c7.217,0,13.068-5.853,13.068-13.068V262.641c0-7.216-5.852-13.07-13.068-13.07    c-7.219,0-13.07,5.854-13.07,13.07v147.154C298.213,417.012,304.067,422.863,311.284,422.863z" />
                            </g>
                          </g>
                        </svg>
                      </button>
                    </div>

                    <p>
                      <b>User</b>
                    </p>
                    <span className="rounded-xl pb-8">{message.question}</span>
                    <p>
                      <b>Assistant</b>
                    </p>
                    <div
                      className="rounded-xl"
                      dangerouslySetInnerHTML={{ __html: message.answer }}
                    />
                  </div>
                ))}
              <div ref={messagesEndRef}></div>
            </div>

              <p className="p-4">Switched to : {selectAssistant==0?"Writing Assistant": (selectAssistant ==1?"Knowledge Assistant":"Assistant")}</p>
            <div className="flex h-fit w-full flex-col items-end justify-center">
              <input
                placeholder="search anything here ..."
                onChange={handleSearchItem}
                value={searchItem}
                className="p-4 relative shadow-lg rounded-[2rem] w-full"
                id="search"
              />
              <button
                className="absolute hover:translate-x-2 hover:ease-in-out hover:transition-all px-8"
                onClick={handleSearch}
              >
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
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default chatClient;
