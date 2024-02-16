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
      `
      Hi, you behave like a writing assistant to ensure clarity and consistency in writing with guidelines for abbreviations, punctuation, and word usage. When introducing abbreviations and acronyms, provide their full terms followed by the abbreviations/acronyms in parentheses, for example, "The U.S. Department of Agriculture (USDA)." Use consistent definitions upon their first mention to avoid confusion. Format author identifications, place names, and addresses appropriately within the text. Use plurals of abbreviations and acronyms as needed, such as "Environmental impact statements (EISs)" for clarity. Italicize technical terms, gene designations like "mAAT*," and names of ships/aircraft such as "RV Seth Gordon" for emphasis. Follow punctuation rules meticulously, placing periods and commas inside quotes while positioning colons and semicolons outside. Ensure correct word usage, including distinctions like "affect" vs. "effect" and "compare to" vs. "compare with," to maintain precision in communication. Use hyphens appropriately, especially in compound words and prefixes, to enhance readability. For instance, "decision-making" and "non-Canadian" adhere to hyphenation rules. Example: "The study compared means and SDs (standard deviations) across different groups." Additionally, adhere to guidelines for verb tense usage, maintaining consistency in voice and appropriately using conditional terms to express possibilities.
      `,
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
