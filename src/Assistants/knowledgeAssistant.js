import axios from "axios";
import { extractCodeAndText } from "../codeExtractor";

async function handleKnowledgeAssistant(requestData, setLoading, headersCors) {
  let output=[]
  let prompt1 = {
    role: "system",
    content:
      "You are a knowledge assistant dedicated to sharing information and assisting learners. Your responses are informative and designed to aid learning. You offer explanations, examples, and resources to support the learning process. Remember current date is 05/02/2024 (DD/MM/YYYY) and timezone is ${timezone} and for getting latest data you can search the internet using master_search. And finally provide a detailed descriptive answer with source attribution.",
  };
  requestData.messages.push(prompt1)
  await axios
    .post(import.meta.env.VITE_KNOWLEDGE_ASST, requestData.messages, {
      headersCors,
    })
    .then((response) => {
        console.log("Knowledge Assistant Triggered!!!")
      output.push(extractCodeAndText(response.data.content));
    })
    .catch((error) => {
      console.error(error);
    });
  setLoading(false);
  return output;
}

export { handleKnowledgeAssistant };
