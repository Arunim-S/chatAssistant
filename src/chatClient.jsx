import { useEffect, useState, useRef } from "react";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import axios from "axios";
import { CosmosClient } from "@azure/cosmos";
import DotLoader from "react-spinners/DotLoader";
import RingLoader from "react-spinners/CircleLoader";
import extractCodeAndText from "./codeExtractor";
import "./hourglass.css";
import { CopyToClipboard } from "react-copy-to-clipboard";
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
  "Access-Control-Allow-Origin'": "*",
  cors: "no-cors",
};

const userName = localStorage.getItem("userName");

const chatClient = () => {
  const [copied, setCopied] = useState(false);
  const [sessionData, setSessionData] = useState([]);
  const [session, setSession] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchItem, setSearchItem] = useState("");
  const [userData, setUserData] = useState([]);
  const [sessionTime, setSessionTime] = useState("");
  const [selectAssistant, setSelectAssistant] = useState(5);
  let [messages, setMessages] = useState([]);
  const [deletingSesstion, setDeletingSession] = useState(false);
  let session_no = session;
  const messagesEndRef = useRef(null);

  const getMessagesFromCosmosDB = async () => {
    try {
      const { resources } = await container.items.readAll().fetchAll();
      let userExists = false;
      // console.log(resources);
      // console.log("User Name:" +  userName)
      resources.forEach((e) => {
        if (e.userName === userName) {
          userExists = true;
          setUserData(e);
          // Ensure messages is initialized as an array, even if there are no questions
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
    // console.log(userData);
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
    // console.log(currentSession);
    currentSession.questions.push(newMessage);

    // Update the user data with the modified session
    setUserData((prevUserData) => ({
      ...prevUserData,
      sessions: [currentSession],
    }));
    setMessages(currentSession.questions);
    await container.items.upsert(userData);
    // console.log(userData);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000); // Reset the copied state after 2 seconds
  };

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
   * get the response
   * @type {Function}
   * @param {string} endpoint
   * @param {Object{}} requestdata
   * @param {Object{}} headers
   */
  async function getResponse(endpoint, requestData, headers) {
    let output = [];
    if (selectAssistant == "0") {
      let res = await axios
        .post(import.meta.env.VITE_WRITING_ASST, requestData.messages, {
          headersCors,
        })
        .then((response) => {
          output.push(extractCodeAndText(response.data.content));
        })
        .catch((error) => {
          console.error(error);
        });
    } else if (selectAssistant == "1") {
      let res = await axios
        .post(import.meta.env.VITE_KNOWLEDGE_ASST, requestData.messages, {
          headersCors,
        })
        .then((response) => {
          output.push(extractCodeAndText(response.data.content));
        })
        .catch((error) => {
          console.error(error);
        });
    } else if (selectAssistant == "3") {
      let res = await axios
        .post(import.meta.env.VITE_SUMMARIZING_ASST, requestData.messages, {
          headersCors,
        })
        .then((response) => {
          const data = response.data;
          output.push(extractCodeAndText(response.data.content));
        })
        .catch((error) => {
          console.error(error);
        });
    } else if (selectAssistant == "5") {
      let res = await axios
        .post(import.meta.env.VITE_MASTER_ASST, requestData.messages, {
          headersCors,
        })
        .then((response) => {
          const data = response.data;
          output.push(extractCodeAndText(response.data.content));
        })
        .catch((error) => {
          console.error(error);
        });
    } else {
      let res = await axios
        .post(endpoint, requestData, { headers })
        .then((response) => {
          const data = response.data;
          data &&
            data.choices.map((e) => {
              output.push(extractCodeAndText(e.message.content));
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
      };
      setLoading(true);
      const response = await getResponse(endpoint, requestData, headers);
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
      // console.log(userData.sessions.length);
      if (userData.sessions.length == 0) {
        userData.sessions.push(
          new Session(generateRandomSessionId(), userName, [], timestamp)
        );
        setSessionData(userData.sessions);
        setUserData(userData);
      }
      setMessages((prevMessages) => [...prevMessages, newMessage]);
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
  const handleDeleteMessage = async (index) => {
    const updatedMessages = [...messages];
    updatedMessages.splice(index, 1);

    setMessages(updatedMessages);
    let currentSession = userData.sessions && userData.sessions[session_no];
    currentSession.questions = updatedMessages;
    setUserData(userData);
    await container.items.upsert(userData);
  };

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

  async function handleSessions() {
    const timestamp = new Date();
    userData.sessions.push(
      new Session(generateRandomSessionId(), userName, [], timestamp)
    );
    setMessages([]);
    setSessionData(userData.sessions);
    // location.reload();
    setUserData(userData);
    await container.items.upsert(userData);
  }

  // console.log(session);
  console.log(messages);
  const override = {
    display: "flex",
    borderColor: "white",
  };

  function convertNewlinesToHTML(inputString) {
    // Replace '\n' with '<br>'
    return inputString.replace(/\n/g, "<br>");
  }

  function removeUrls(inputString) {
    // Regular expression to match URLs enclosed within parentheses
    const urlRegex = /\((https?:\/\/[^\s]+)\)/g;
    // Replace all matched URLs enclosed within parentheses with an empty string
    return inputString.replace(urlRegex, "");
  }

  return (
    <div className="flex flex-col h-screen w-full items-center justify-cneter">
      <div className="flex w-full h-full">
        <div className="w-1/6">
          <div className="text-center p-4 gap-2 flex flex-col bg-black text-white w-full h-full">
            <p className="p-2">Chat Sessions</p>
            {sessionData &&
              sessionData.map((session, index) => (
                <button
                  onClick={(e) => {
                    setSession(index);
                  }}
                  key={index}
                  className={`${
                    session_no == index
                      ? "bg-gray-500 text-white"
                      : "bg-white text-black"
                  }  p-4  w-full rounded-xl`}
                >
                  Session {index + 1}
                </button>
              ))}
          </div>
        </div>
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
          <div className="flex flex-col bg-gray-200 w-full h-full border gap-4 p-12">
            <div className="flex justify-around">
              <div className="flex gap-4">
                <button
                  className="p-4 bg-white rounded-xl"
                  onClick={handleSessions}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    xmlns:sketch="http://www.bohemiancoding.com/sketch/ns"
                    width="24px"
                    height="24px"
                    viewBox="0 0 32 32"
                    version="1.1"
                  >
                    <title>new</title>
                    <desc>Created with Sketch Beta.</desc>
                    <defs></defs>
                    <g
                      id="Page-1"
                      stroke="none"
                      stroke-width="1"
                      fill="none"
                      fill-rule="evenodd"
                      sketch:type="MSPage"
                    >
                      <g
                        id="Icon-Set"
                        sketch:type="MSLayerGroup"
                        transform="translate(-516.000000, -99.000000)"
                        fill="#000000"
                      >
                        <path
                          d="M527.786,122.02 L522.414,125.273 C521.925,125.501 521.485,125.029 521.713,124.571 L524.965,119.195 L527.786,122.02 L527.786,122.02 Z M537.239,106.222 L540.776,109.712 L529.536,120.959 C528.22,119.641 526.397,117.817 526.024,117.444 L537.239,106.222 L537.239,106.222 Z M540.776,102.683 C541.164,102.294 541.793,102.294 542.182,102.683 L544.289,104.791 C544.677,105.18 544.677,105.809 544.289,106.197 L542.182,108.306 L538.719,104.74 L540.776,102.683 L540.776,102.683 Z M524.11,117.068 L519.81,125.773 C519.449,126.754 520.233,127.632 521.213,127.177 L529.912,122.874 C530.287,122.801 530.651,122.655 530.941,122.365 L546.396,106.899 C547.172,106.124 547.172,104.864 546.396,104.088 L542.884,100.573 C542.107,99.797 540.85,99.797 540.074,100.573 L524.619,116.038 C524.328,116.329 524.184,116.693 524.11,117.068 L524.11,117.068 Z M546,111 L546,127 C546,128.099 544.914,129.012 543.817,129.012 L519.974,129.012 C518.877,129.012 517.987,128.122 517.987,127.023 L517.987,103.165 C517.987,102.066 518.902,101 520,101 L536,101 L536,99 L520,99 C517.806,99 516,100.969 516,103.165 L516,127.023 C516,129.22 517.779,131 519.974,131 L543.817,131 C546.012,131 548,129.196 548,127 L548,111 L546,111 L546,111 Z"
                          id="new"
                          sketch:type="MSShapeGroup"
                        ></path>
                      </g>
                    </g>
                  </svg>
                </button>
                <button
                  className="flex items-center justify-center gap-4 bg-red-300 rounded-xl px-4"
                  onClick={(e) => {
                    handleDeleteSession(session_no);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    fill="#000"
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
                  <svg
                    fill="blue"
                    width="24px"
                    height="24px"
                    viewBox="0 0 32 32"
                    version="1.1"
                  >
                    <g id="Layer1">
                      <path d="M3,25l8,-0c0.552,0 1,-0.448 1,-1c0,-0.552 -0.448,-1 -1,-1l-8,-0c-0.552,0 -1,0.448 -1,1c0,0.552 0.448,1 1,1Zm10.914,-6.671l-0.895,4.475c-0.065,0.328 0.037,0.667 0.274,0.903c0.236,0.237 0.575,0.339 0.903,0.274l4.475,-0.895l-4.757,-4.757Zm12.586,-2.415l-6.086,6.086l-5.414,-5.414l6.086,-6.086l5.414,5.414Zm-4,-6.828l5.414,5.414l1.793,-1.793c0.391,-0.39 0.391,-1.024 0,-1.414l-4,-4c-0.39,-0.391 -1.024,-0.391 -1.414,-0l-1.793,1.793Z" />
                    </g>
                  </svg>
                </button>
                <button
                  className={`p-4 ${
                    selectAssistant == "1" ? "bg-black text-white" : "bg-white"
                  } rounded-xl`}
                  onClick={(e) => {
                    setSelectAssistant(1);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="blue"
                    width="24px"
                    height="24px"
                    viewBox="0 0 512 512"
                  >
                    <g id="Knowledge">
                      <path d="M397.5765,258.8732,269.125,287.3982v183.75l134.0506-29.8367A13.0954,13.0954,0,0,0,413.5,428.5358V271.6478A13.0751,13.0751,0,0,0,397.5765,258.8732Zm-18.4634,141.75-70,15.5753c-16.7352,3.5675-22.5757-21.6251-5.6866-25.6369l70-15.5753C390.3091,371.5209,395.9274,396.6024,379.1131,400.6227Zm0-61.25-70,15.5753c-16.7352,3.5675-22.5757-21.6251-5.6866-25.6369l70-15.5753C390.3091,310.2709,395.9274,335.3524,379.1131,339.3727Z" />

                      <path d="M98.5,271.6478v156.888a13.0193,13.0193,0,0,0,10.239,12.7757l134.136,29.8367v-183.75l-128.4494-28.525A13.0427,13.0427,0,0,0,98.5,271.6478Zm39.9881,40.3385,70,15.5752a13.13,13.13,0,1,1-5.6866,25.6369l-70-15.5752C116.0214,333.6135,121.5692,308.52,138.4881,311.9863Zm0,61.25,70,15.5752a13.13,13.13,0,1,1-5.6866,25.6369l-70-15.5752C116.0214,394.8635,121.5692,369.77,138.4881,373.2363Z" />

                      <path d="M295.375,198.4114h-78.75C211.0644,262.2762,300.8758,262.3157,295.375,198.4114Z" />

                      <path d="M223.8006,172.1614H288.114l16.8869-23.9749a59.9765,59.9765,0,0,0-6.7377-76.65c-52.5556-50.1672-131.6495,16.2162-91.2619,76.65Z" />

                      <path d="M339.0823,176.9979c4.3088,2.01,15.4449,10.3991,20.4309,9.7786,13.0267.3108,18.1793-18.0822,6.571-24.4941l-13.8769-8.014C337.134,145.8773,324.2867,168.125,339.0823,176.9979Z" />

                      <path d="M159.7415,154.263l-13.8855,8.0152c-11.6126,6.4161-6.4515,24.8005,6.571,24.4983,5.0458.5928,16.06-7.7524,20.44-9.7744C187.662,168.1154,174.8254,145.9082,159.7415,154.263Z" />

                      <path d="M346.3967,113.8626a13.1256,13.1256,0,0,0,13.125,13.125h16.0218c17.2522-.2916,17.2479-25.9584,0-26.25H359.5217A13.1257,13.1257,0,0,0,346.3967,113.8626Z" />

                      <path d="M136.4053,126.9876H152.427c17.2522-.2916,17.2479-25.9584,0-26.25H136.4053a13.125,13.125,0,0,0,0,26.25Z" />

                      <path d="M345.6533,75.2182c5.0458.5907,16.0517-7.7566,20.4309-9.7786,14.802-8.876,1.94-31.1206-13.125-22.73l-13.8769,8.0151C327.4676,57.1361,332.633,75.5258,345.6533,75.2182Z" />

                      <path d="M145.856,65.4439c4.3087,2.01,15.4513,10.397,20.4394,9.7743,13.0289.3066,18.1793-18.0842,6.5711-24.4983l-13.8855-8.014C143.8928,34.34,131.0668,56.5647,145.856,65.4439Z" />
                    </g>
                  </svg>
                </button>
                <button
                  className={`p-4 ${
                    selectAssistant == "2" ? "bg-black text-white" : "bg-white"
                  } rounded-xl`}
                  onClick={(e) => {
                    setSelectAssistant(2);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="blue"
                    width="24px"
                    height="24px"
                    viewBox="0 0 24 24"
                    data-name="Layer 1"
                  >
                    <path d="M14.022,7h1a1.0013,1.0013,0,0,1,1,1V9a1,1,0,0,0,2,0V8a3.00328,3.00328,0,0,0-3-3h-1a1,1,0,0,0,0,2Zm-4,9h-1a1.0013,1.0013,0,0,1-1-1V14a1,1,0,0,0-2,0v1a3.00328,3.00328,0,0,0,3,3h1a1,1,0,0,0,0-2Zm11-1a1,1,0,0,0,0-2h-3v-.5a1,1,0,0,0-2,0V13h-3a1,1,0,0,0,0,2h5.18427a6.72756,6.72756,0,0,1-1.22553,2.52667,6.66828,6.66828,0,0,1-.62915-.98272.99972.99972,0,1,0-1.77929.9121,8.67791,8.67791,0,0,0,.9591,1.468A6.6182,6.6182,0,0,1,13.10645,20.023a1.00008,1.00008,0,0,0,.42675,1.9541,8.63506,8.63506,0,0,0,3.445-1.62164,8.72368,8.72368,0,0,0,3.46857,1.62115,1,1,0,1,0,.43066-1.95312,6.72477,6.72477,0,0,1-2.4461-1.09009A8.73637,8.73637,0,0,0,20.24371,15ZM9.05176,11.24268a1.00011,1.00011,0,0,0,1.94043-.48536L9.23486,3.72754a2.28107,2.28107,0,0,0-4.42578,0L3.05176,10.75732a1.00011,1.00011,0,0,0,1.94043.48536L5.5528,9H8.49115ZM6.0528,7l.69671-2.78711a.2913.2913,0,0,1,.54492,0L7.99115,7Z" />
                  </svg>
                </button>
                <button
                  className={`p-4 ${
                    selectAssistant == "3" ? "bg-black text-white" : "bg-white"
                  } rounded-xl`}
                  onClick={(e) => {
                    setSelectAssistant(3);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="blue"
                    width="24px"
                    height="24px"
                    viewBox="0 0 52 52"
                    enable-background="new 0 0 52 52"
                    xml:space="preserve"
                  >
                    <g>
                      <g>
                        <g>
                          <path d="M48.5,2h-45C2.7,2,2,2.7,2,3.5v5C2,9.3,2.7,10,3.5,10h45c0.8,0,1.5-0.7,1.5-1.5v-5C50,2.7,49.3,2,48.5,2z     " />
                        </g>
                      </g>
                      <g>
                        <g>
                          <path d="M48.5,14h-35c-0.8,0-1.5,0.7-1.5,1.5v3c0,0.8,0.7,1.5,1.5,1.5h35c0.8,0,1.5-0.7,1.5-1.5v-3     C50,14.7,49.3,14,48.5,14z" />
                        </g>
                      </g>
                      <g>
                        <g>
                          <path d="M48.5,34h-35c-0.8,0-1.5,0.7-1.5,1.5v3c0,0.8,0.7,1.5,1.5,1.5h35c0.8,0,1.5-0.7,1.5-1.5v-3     C50,34.7,49.3,34,48.5,34z" />
                        </g>
                      </g>
                      <g>
                        <g>
                          <path d="M48.5,44h-39C8.7,44,8,43.3,8,42.5v-7C8,34.7,7.3,34,6.5,34h-3C2.7,34,2,34.7,2,35.5v13     C2,49.3,2.7,50,3.5,50h3H8h40.5c0.8,0,1.5-0.7,1.5-1.5v-3C50,44.7,49.3,44,48.5,44z" />
                        </g>
                      </g>
                      <g>
                        <g>
                          <path d="M48.5,24h-39C8.7,24,8,23.3,8,22.5v-7C8,14.7,7.3,14,6.5,14h-3C2.7,14,2,14.7,2,15.5v13     C2,29.3,2.7,30,3.5,30h2H8h40.5c0.8,0,1.5-0.7,1.5-1.5v-3C50,24.7,49.3,24,48.5,24z" />
                        </g>
                      </g>
                    </g>
                  </svg>
                </button>
                <button
                  className={`p-4 ${
                    selectAssistant == "4" ? "bg-black text-white" : "bg-white"
                  } rounded-xl`}
                  onClick={(e) => {
                    setSelectAssistant(4);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24px"
                    height="24px"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="none"
                      stroke="blue"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16.5,19 C17.8807119,19 19,17.8807119 19,16.5 C19,15.1192881 17.8807119,14 16.5,14 C15.1192881,14 14,15.1192881 14,16.5 C14,17.8807119 15.1192881,19 16.5,19 Z M10,5 L12,3 M7.5,10 C8.88071187,10 10,8.88071187 10,7.5 C10,6.11928813 8.88071187,5 7.5,5 C6.11928813,5 5,6.11928813 5,7.5 C5,8.88071187 6.11928813,10 7.5,10 Z M8,16 L16,8 M5.5,21 C6.88071187,21 8,19.8807119 8,18.5 C8,17.1192881 6.88071187,16 5.5,16 C4.11928813,16 3,17.1192881 3,18.5 C3,19.8807119 4.11928813,21 5.5,21 Z M18.5,8 C19.8807119,8 21,6.88071187 21,5.5 C21,4.11928813 19.8807119,3 18.5,3 C17.1192881,3 16,4.11928813 16,5.5 C16,6.88071187 17.1192881,8 18.5,8 Z M12,21 L14,19"
                    />
                  </svg>
                </button>
                <button
                  className={`p-4 ${
                    selectAssistant == "5" ? "bg-black text-white" : "bg-white"
                  } rounded-xl`}
                  onClick={(e) => {
                    setSelectAssistant(5);
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    xmlns:xlink="http://www.w3.org/1999/xlink"
                    fill="blue"
                    height="24px"
                    width="24px"
                    version="1.1"
                    id="Capa_1"
                    viewBox="0 0 410 410"
                    xml:space="preserve"
                  >
                    <g>
                      <path d="M360.684,250.083H49.318C22.088,250.083,0,272.169,0,299.403c0,27.23,22.088,49.306,49.318,49.306h311.365   c27.243,0,49.316-22.075,49.316-49.306C410,272.169,387.927,250.083,360.684,250.083z M290.461,310.503c-8.283,0-15-6.717-15-15   c0-8.283,6.717-15,15-15s15,6.717,15,15C305.461,303.787,298.744,310.503,290.461,310.503z M341,310.503c-8.283,0-15-6.717-15-15   c0-8.283,6.717-15,15-15s15,6.717,15,15C356,303.787,349.283,310.503,341,310.503z" />
                      <path d="M360.684,233.861c16.054,0,30.77,5.812,42.177,15.43L317.343,64.195c-0.818-1.77-2.589-2.903-4.539-2.903l-39.147,0   l-125.081,0.001l-51.38-0.001h0c-1.949,0-3.721,1.133-4.539,2.903L7.139,249.292c11.408-9.618,26.124-15.431,42.179-15.431H360.684   z M160.94,115.263c1.555-0.794,3.221-1.197,4.953-1.197c4.119,0,7.841,2.276,9.715,5.941c2.015,3.938,1.46,8.664-1.414,12.038   l17.546,14.976l9.101-22.042c-4.095-1.694-6.741-5.65-6.741-10.078c0-6.009,4.89-10.898,10.901-10.898   c6.01,0,10.899,4.889,10.899,10.898c0,4.428-2.646,8.384-6.74,10.078l9.102,22.042l17.544-14.976   c-2.873-3.374-3.428-8.1-1.412-12.039c1.872-3.663,5.595-5.939,9.714-5.939c1.732,0,3.398,0.402,4.95,1.196   c5.351,2.739,7.479,9.318,4.746,14.667c-2.007,3.923-6.171,6.254-10.584,5.904l-0.003,0l-3.523,43.265   c-0.105,1.297-1.189,2.297-2.492,2.297h-64.404c-1.302,0-2.386-0.999-2.492-2.297l-3.521-43.264   c-4.484,0.355-8.582-1.98-10.588-5.902C153.462,124.58,155.59,118.001,160.94,115.263z" />
                    </g>
                  </svg>
                </button>
              </div>
            </div>

            <div className="gap-4 h-full flex flex-col">
              <div className="relative flex flex-col w-full h-[65vh] rounded-[1rem] overflow-y-scroll p-4">
                {loading && (
                  <div className="flex absolute w-full mx-auto h-full items-center justify-center z-50">
                    <DotLoader
                      color="#FCA5A5"
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
                          onClick={() => handleDeleteMessage(index)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            xmlns:xlink="http://www.w3.org/1999/xlink"
                            fill="#FCA5A5"
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
                                <div>
                                  <pre className="bg-gray-300 rounded-xl p-12 m-4 text-black ">
                                    {f.content}
                                  </pre>
                                  <CopyToClipboard
                                    text={f.content}
                                    onCopy={handleCopy}
                                  >
                                    <button>
                                      {copied ? "Copied!" : "Copy"}
                                    </button>
                                  </CopyToClipboard>
                                </div>
                              ) : (
                                <div
                                  className="rounded-xl text-white p-4"
                                  dangerouslySetInnerHTML={{
                                    __html: convertNewlinesToHTML(
                                      removeUrls(f.content)
                                    ),
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
                {/* {loading && (
                  <RingLoader
                    color="#000"
                    loading={loading}
                    cssOverride={override}
                    size={40}
                    aria-label="Loading Spinner"
                    data-testid="loader"
                  ></RingLoader>
                )} */}
              </div>

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
                  type="submit"
                >
                  {!loading ? (
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
                  ) : (
                    <div className="wrapper">
                      <svg
                        className="hourglass"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 120 206"
                        preserveAspectRatio="none"
                      >
                        <path
                          class="middle"
                          d="M120 0H0v206h120V0zM77.1 133.2C87.5 140.9 92 145 92 152.6V178H28v-25.4c0-7.6 4.5-11.7 14.9-19.4 6-4.5 13-9.6 17.1-17 4.1 7.4 11.1 12.6 17.1 17zM60 89.7c-4.1-7.3-11.1-12.5-17.1-17C32.5 65.1 28 61 28 53.4V28h64v25.4c0 7.6-4.5 11.7-14.9 19.4-6 4.4-13 9.6-17.1 16.9z"
                        />
                        <path
                          class="outer"
                          d="M93.7 95.3c10.5-7.7 26.3-19.4 26.3-41.9V0H0v53.4c0 22.5 15.8 34.2 26.3 41.9 3 2.2 7.9 5.8 9 7.7-1.1 1.9-6 5.5-9 7.7C15.8 118.4 0 130.1 0 152.6V206h120v-53.4c0-22.5-15.8-34.2-26.3-41.9-3-2.2-7.9-5.8-9-7.7 1.1-2 6-5.5 9-7.7zM70.6 103c0 18 35.4 21.8 35.4 49.6V192H14v-39.4c0-27.9 35.4-31.6 35.4-49.6S14 81.2 14 53.4V14h92v39.4C106 81.2 70.6 85 70.6 103z"
                        />
                      </svg>
                    </div>
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
