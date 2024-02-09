import axios from "axios";
import { extractCodeAndText } from "../codeExtractor";

async function handleTechnicalAssistant(requestData, setLoading, headers) {
  let output = [];
  await axios
    .post(import.meta.env.VITE_AZURE_OPENAI_ENDPOINT, requestData, {
      headers,
    })
    .then((response) => {

      console.log("Technical Assistant is Triggered!!!")
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

export { handleTechnicalAssistant };
