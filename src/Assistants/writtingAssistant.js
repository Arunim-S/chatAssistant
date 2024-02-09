import axios from "axios";
import { extractCodeAndText } from "../codeExtractor";

async function handleWritingAssistant(requestData, setLoading, headersCors) {
  let output = [];
  let prompt1 = {
    role: "system",
    content:
      "As an AI assistant, your task is to welcome the user to our service. You must explain that you are designed to create a wide variety of written content, customized to their specific needs. You should begin with the first question and wait for the user's response. Remember to take one step at a time. Based on their response, you should ask subsequent question related to the type of content. You need to use the responses to these questions to guide the creation of the content. After collection all the necessary information call the creative_tool function with query parameter containing all the details. (REMEMBER: You will make sure to ask one question at a time to gather the necessary information.)",
  };
  requestData.messages.push(prompt1);
  await axios
    .post(import.meta.env.VITE_WRITING_ASST, requestData.messages, {
      headersCors,
    })
    .then((response) => {
      console.log("Writting Assistant Triggered!!!")
      output.push(extractCodeAndText(response.data.content));
    })
    .catch((error) => {
      console.error(error);
    });
  setLoading(false);
  return output;
}

export { handleWritingAssistant };
