import { useEffect, useState } from "react";
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
 * Request Data for API
 * @type {Array}
 */
const requestData = {
  messages: [
    {
      role: "system",
      content: "You are an AI assistant that helps people find information.",
    },
  ],
  max_tokens: 800,
  temperature: 0.7,
  frequency_penalty: 0,
  presence_penalty: 0,
  top_p: 0.95,
  stop: null,
};

/**
 * Headers for API
 * @type {Object{}}
 */
const headers = {
  "Content-Type": "application/json",
  "api-key": azureApiKey,
};

/**
 * App
 * @type {Function}
 */
function App() {
  const [searchItem, setSearchItem] = useState("");
  const [res, setRes] = useState("");

  /**
   * Handle Search Item
   * @param {object[]} e handles the search item on trigger event
   */
  const handleSearchItem = (e) => {
    setSearchItem(e.target.value);
  };

  async function getResponse(endpoint, requestData, headers) {
    requestData = getRequestoData();
    await axios
      .post(endpoint, requestData, { headers })
      .then((response) => {
        console.log(response.data);
        const data = response.data;
        data&&data.choices.map((e)=>{
          setRes(e.message.content)
      })
      })
      .catch((error) => {
        console.error(error);
      });
  }

  const handleSearch = async () => {
    try {
      await getResponse(endpoint, requestData, headers);
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
          <div className="h-2/4 flex bg-white w-full rounded-[1rem]">
          <h1 className="mx-auto p-4">Results</h1>
              {res && <div>{res}</div>}
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
        {/* <div className="flex flex-col w-2/3 border items-center gap-8 p-12 rounded-[2rem]">
          <h1>Results</h1>
          {res && <div>{res}</div>}
        </div> */}
      </div>
    </div>
  );
}

export default App;
