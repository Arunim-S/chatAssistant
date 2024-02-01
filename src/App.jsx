import { useEffect, useState, useRef } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import dotenv from "dotenv";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import axios from "axios";
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
function App() {
  const [searchItem, setSearchItem] = useState("");
  const [messages, setMessages] = useState([]);
  const [res, setRes] = useState("");
  const messagesEndRef = useRef(null);

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
      addMessage(searchItem, "user");
      setSearchItem("");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-cneter">
      <h1 className="text-[2rem] p-8">Chat Assistant</h1>
      <div className="flex w-full justify-around gap-12 h-[80vh]">
        <div className="flex flex-col bg-gray-200 w-2/3 border items-center justify-evenly gap-8 p-12 rounded-[2rem]">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl text-center">Hi</h1>
            <p className="text-md">How may I help you?</p>
          </div>
          <div className="h-2/4 flex flex-col bg-white w-full rounded-[1rem] overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex gap-2 m-2 message ${
                  message.sender === "system" ? "system" : "user"
                }`}
              >
                <span className="bg-gray-300 p-4 rounded-[2rem]">{message.sender}: {message.content}</span>
              </div>
            ))}
            <div ref={messagesEndRef}></div>
          </div>
          <div className="flex h-1/4 w-full flex-col items-center justify-center gap-8">
            <input
              placeholder="search anything here ..."
              onChange={handleSearchItem}
              value={searchItem}
              className="p-4 shadow-lg rounded-[2rem] w-full"
              id="search"
            />
            <button
              className="w-32 h-10 bg-black text-white hover:bg-gray-500 rounded-[2rem]"
              onClick={handleSearch}
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
