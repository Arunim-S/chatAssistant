import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import dotenv from "dotenv";
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

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
 * Prompts
 * @type {Array}
 */
const messages = [
  { role: "system", content: "You are a helpful assistant." },
  { role: "user", content: "Does Azure OpenAI support customer managed keys?" },
  {
    role: "assistant",
    content: "Yes, customer managed keys are supported by Azure OpenAI",
  },
  { role: "user", content: "Do other Azure AI services support this too" },
];

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



  const handleSearch = async () => {
    try {
      /**
       * OpenAIClient
       * @param {string} endpoint The endpoint of api at which we will hit to get the data
       * @param {string} azureapikey The api key to access the gpt model
       * @returns {object[]} returns a client object
       */
      const client = new OpenAIClient(
        endpoint,
        new AzureKeyCredential(azureApiKey)
      );
      /**
       * Deployment Id
       * @type {string}
       */
      const deploymentId = "DanielGPT4";
      /**
       * result
       * @type {Object[]}
       */
      const result = await client.getCompletions(deploymentId, searchItem);
      setRes(result);
      console.log(result);
      // for (const choice of result.choices) {
      //   console.log(choice.message);
      // }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-full w-full items-center justify-cneter">
      <h1 className="text-[2rem] p-8">Chat Assistant</h1>
      <div className="flex w-full justify-around gap-12 h-[80vh] px-28">
        <div className="flex flex-col w-1/2 border items-center justify-evenly gap-8 p-12 rounded-[2rem]">
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl text-center">Hi</h1>
            <p className="text-md">How may I help you?</p>
          </div>
          <div className="flex flex-col items-center justify-center gap-8 w-10/12">
            <input
              placeholder="search anything here ..."
              onChange={handleSearchItem}
              value={searchItem}
              className="p-4 border border-black rounded-[2rem] w-full"
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
        <div className="flex flex-col w-2/3 border items-center gap-8 p-12 rounded-[2rem]">
          <h1>Results</h1>
          {res && <div>{res.content}</div>}
        </div>
      </div>
    </div>
  );
}

export default App;
