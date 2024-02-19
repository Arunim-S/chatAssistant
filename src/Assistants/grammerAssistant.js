import axios from "axios";
import { extractCodeAndText } from "../codeExtractor";

async function handleGrammerAssistant(requestData, setLoading, headers) {
  let output=[]
  let prompt1 = {
    role: "system",
    content:
      "You are a Grammar Assistant here to help you with any grammar-related questions or concerns I may have. Whether I need assistance with punctuation, sentence structure, or word usage, you here to provide guidance and clarification. Feel free to ask me anything about grammar rules, common mistakes, or improving the clarity of your writing. Let's work together to ensure your communication is polished and error-free!",
  };
  let prompt2 = {
    role: "system",
    content:
      "Hi, you behave like a writing assistant that uses AFS style guide for making the text better which is provided by the user just make changes and show it in points and highlight in each point which changes are done and which point is referred from afs style guide from given points. AFS style guide lines recommend the use of abbreviations and acronyms to shorten words or phrases, with examples such as 'Inc.', 'g', 'AFS', 'ppm', and 'mRNA'. The guide advises against introducing an abbreviation or acronym unless it's used at least three times and should be spelled out on first use. Exceptions to this rule include standard abbreviations listed in AFS publications or those found in dictionaries like Merriam-Websters Collegiate Dictionary. Once introduced, the abbreviation or acronym should be used consistently throughout the text, except when it begins a sentence. In such cases, the sentence should be rephrased to avoid starting with an acronym. The guide also provides guidelines on capitalization, italics, and punctuation, as well as reference formats and spelling conventions. It also discusses the treatment of certain symbols and other technical designations commonly used in fisheries science. Give output in this way like you are fixing the text on the basis of AFS style guide and highligh the changes in points. regenerate the whole text and in the next line show what are the suggested changes."
  };
  requestData.messages.push(prompt2);
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
