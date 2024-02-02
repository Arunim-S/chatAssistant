import { useEffect, useState, useRef } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import dotenv from "dotenv";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import axios from "axios";
import { CosmosClient } from "@azure/cosmos";
import { MsalProvider } from "@azure/msal-react";
import AuthPage from "./authpage";
class Message {
  constructor(userId, userName, content, sender) {
    this.userId = userId;
    this.userName = userName;
    this.content = content;
    this.sender = sender;
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
console.log(container);
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

/**
 * APP Function
 * @type {Function}
 */
function App({ instance }) {
  const [searchItem, setSearchItem] = useState("");
  const [messages, setMessages] = useState([]);
  const [res, setRes] = useState("");
  const messagesEndRef = useRef(null);

  /**
   *  Generate a random user ID
   *  @type {Function}
   * */
  const generateRandomUserId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  /**
   *  Save Message to the container
   *  @type {Function}
   * */
  const saveMessage = async (userName, content, sender) => {
    const userId = generateRandomUserId();
    const message = new Message(userId, userName, content, sender);
    await container.items.create(message);
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
  const addMessage = (content, sender) => {
    setMessages((prevMessages) => [...prevMessages, { content, sender }]);
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
    await axios
      .post(endpoint, requestData, { headers })
      .then((response) => {
        const data = response.data;
        data &&
          data.choices.map((e) => {
            setRes(e.message.content);
            addMessage(e.message.content, "system");
          });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  /**
   * Handle Search
   * @type {Function}
   */
  const handleSearch = async () => {
    try {
      /**
       * Request Data
       * @type {Object{}}
       */
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

      await getResponse(endpoint, requestData, headers);
      await saveMessage("Anonymous", searchItem, "user");
      addMessage(searchItem, "user");
      setSearchItem("");
    } catch (err) {
      console.error(err);
    }
  };
  messages.reverse();

  return (
    <MsalProvider instance={instance}>
      <div className="flex flex-col h-screen pb-8 w-full items-center justify-cneter">
        <h1 className="text-[2rem] p-8">Chat Assistant</h1>
        <AuthPage instance={instance} />
        <div className="flex w-full justify-around gap-12 h-full">
          <div className="flex flex-col bg-gray-200 w-2/3 h-full border items-center justify-between gap-8 p-12 rounded-[2rem]">
            {/* <div className="flex flex-col gap-4"> */}
            {/* <p className="text-md">search here</p> */}
            {/* </div> */}
            <div className="flex flex-col bg-white w-full h-[65vh] rounded-[1rem] overflow-y-scroll p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 m-2 message ${
                    message.sender === "user" ? "user" : "system"
                  }`}
                >
                  <span className="bg-gray-300 ease-in-out transition-all p-4 rounded-[2rem]">
                    {message.sender}: {message.content}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef}></div>
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
    </MsalProvider>
  );
}

export default App;
