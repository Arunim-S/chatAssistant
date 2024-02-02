import { useEffect, useState, useRef } from "react";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import axios from "axios";
import { CosmosClient } from "@azure/cosmos";

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
  constructor(userId, userName, questions, timestamp) {
    this.userId = userId;
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

const userName = localStorage.getItem("userName");

const chatClient = () => {
  const [loading, setLoading] = useState(true);
  const [searchItem, setSearchItem] = useState("");
  const [messages, setMessages] = useState([]);
  const [userData, setUserData] = useState([]);
  const messagesEndRef = useRef(null);

  const getMessagesFromCosmosDB = async () => {
    try {
      const { resources } = await container.items.readAll().fetchAll();
      let isUser = false;

      resources.map((e) => {
        if (Object.values(e).includes(userName)) {
          isUser = true;
          setUserData(e);
          setMessages(e.questions);
        }
      });
      if (isUser === false) {
        const questions = [];
        const timestamp = new Date();
        const userId = generateRandomUserId();
        const user = new UserData(userId, userName, questions, timestamp);
        await container.items.create(user);
      }
      const retrievedUsers = resources.map((item) => ({
        userName: item.userName,
      }));
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
   *  Save Message to the container
   *  @type {Function}
   * */
  const saveMessage = async (userName, answer, question, persona, userData) => {
    const timestamp = new Date();
    const questionType = "New Chat";
    const message = new Message(
      userName,
      question,
      answer,
      timestamp,
      questionType,
      persona
    );
    const arr = userData.questions;
    arr.push(message);
    await container.items.upsert(userData);
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
  const addMessage = (userName, answer, question, persona, userData) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { userName, answer, question, persona, userData },
    ]);
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
    let output = ""
    let res = await axios
      .post(endpoint, requestData, { headers })
      .then((response) => {
        const data = response.data;
        data &&
          data.choices.map((e) => {
            output  = e.message.content;
          });
      })
      .catch((error) => {
        console.error(error);
      });
    return output;
  }

  /**
   * Handle Search
   * @type {Function}
   */
  const handleSearch = async () => {
    try {
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
  
      const response = await getResponse(endpoint, requestData, headers);  
      const timestamp = new Date();
      const questionType = "New Chat";
  
      const newMessage = new Message(
        userName,
        searchItem,
        response,
        timestamp,
        questionType,
        "Assistant"
      );
      setMessages((prevMessages) => [...prevMessages, newMessage]);
  
      const updatedUserData = { ...userData };
      updatedUserData.questions = [...userData.questions, newMessage];
  
      await container.items.upsert(updatedUserData);
  
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
  
    const updatedUserData = { ...userData };
    updatedUserData.questions = updatedMessages;
    setUserData(updatedUserData);
  
    await container.items.upsert(updatedUserData);
  };
  
  return (
    <div className="flex flex-col h-screen w-full items-center justify-cneter">
      <div className="flex w-full gap-12 h-full">
        <div className="flex flex-col bg-gray-200 w-full h-full border gap-4 p-12">
          <h1 className="text-[2rem] text-center w-full">Chat Assistant</h1>
          <div className="gap-4 h-full flex flex-col">
            <div className="flex flex-col bg-white w-full h-[75vh] rounded-[1rem] overflow-y-scroll p-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className="flex flex-col gap-2 m-2 message"
                >
                  {index+1}
                  <button className="text-center w-32" onClick={() => handleDelete(index)}>remove</button>
                  <span className="bg-gray-200 ease-in-out transition-all p-4 max-w-md rounded-[2rem]">
                    {message.answer}
                  </span>
                  <span className="bg-gray-200 ease-in-out transition-all p-4 max-w-md rounded-[2rem]">
                    {message.question}
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
    </div>
  );
};

export default chatClient;
