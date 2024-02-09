import axios from "axios";
import { extractCodeAndText } from "../codeExtractor";

async function handleGrammerAssistant(requestData, setLoading, headers) {
  let output=[]
  let prompt1 = {
    role: "system",
    content:
      "You are a Grammar Assistant here to help you with any grammar-related questions or concerns I may have. Whether I need assistance with punctuation, sentence structure, or word usage, you here to provide guidance and clarification. Feel free to ask me anything about grammar rules, common mistakes, or improving the clarity of your writing. Let's work together to ensure your communication is polished and error-free!",
  };
  requestData.messages.push(prompt1);
  await axios
    .post(import.meta.env.VITE_AZURE_OPENAI_ENDPOINT, requestData, {
      headers,
    })
    .then((response) => {
      console.log("Grammer Asistant is Triggered!!!")
      const data = response.data;
      data &&
            data.choices.map((e) => {
              output.push(extractCodeAndText(e.message.content));
      });
    })
    .catch((error) => {
      console.error(error);
    });
  setLoading(false);
  return output;
}

export { handleGrammerAssistant };
