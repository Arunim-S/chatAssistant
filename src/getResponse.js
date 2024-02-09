import { handleWritingAssistant } from "./Assistants/writtingAssistant";
import { handleKnowledgeAssistant } from "./Assistants/knowledgeAssistant";
import { handleSummaryAssistant } from "./Assistants/summaryAssistant";
import { handleMasterAssistant } from "./Assistants/masterAssistant";
import { handleTechnicalAssistant } from "./Assistants/technicalAssistant";
import { handleGrammerAssistant } from "./Assistants/grammerAssistant";

/**
 * get the response
 * @type {Function}
 * @param {string} endpoint
 * @param {Object{}} requestdata
 * @param {Object{}} headers
 */
async function getResponse(requestData, selectAssistant, setLoading) {
  /**
   * stores result
   * @type {Array} Output
   */
  let output = [];
  /**
   * Api Key
   * @type {string}
   */
  const azureApiKey = import.meta.env.VITE_AZURE_OPENAI_KEY;
  /**
   * Headers for API call for Open AI
   * @type {Object}
   */
  const headers = {
    "Content-Type": "application/json",
    "api-key": azureApiKey,
  };
  /**
   * Headers for API call for Assistant functional Apps
   * @type {Object}
   */
  const headersCors = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin'": "*",
    cors: "no-cors",
  };

  if (selectAssistant == "0") {
    output = await handleWritingAssistant(requestData, setLoading, headersCors);
  } else if (selectAssistant == "1") {
    output = await handleKnowledgeAssistant(
      requestData,
      setLoading,
      headersCors
    );
  } else if (selectAssistant == "2") {
    output = await handleGrammerAssistant(requestData, setLoading, headers);
  } else if (selectAssistant == "3") {
    output = await handleSummaryAssistant(requestData, setLoading, headersCors);
  } else if (selectAssistant == "4") {
    output = await handleTechnicalAssistant(requestData, setLoading, headers);
  } else if (selectAssistant == "5") {
    output = await handleMasterAssistant(requestData, setLoading, headersCors);
  }
  return output;
}

export { getResponse };
