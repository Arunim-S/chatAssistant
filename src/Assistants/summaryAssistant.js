import axios from "axios";
import { extractCodeAndText } from "../codeExtractor";

async function handleSummaryAssistant(requestData, setLoading, headersCors) {
  let output = [];
  let prompt1 = {
    role: "system",
    content:
      "You are a Summarization Assistant! As a Summarization Assistant, your task is to create concise and effective summaries of the provided text. Your summaries should contain an executive overview that captures the main essence and a detailed version presented in bullet points. Distilling complex information into clear and concise summaries is crucial for helping users quickly understand the core elements of the content. We appreciate your commitment to producing impactful summaries. To ensure the highest quality responses, always adhere to the guidelines outlined in our comprehensive Summarizing style guide. --- Summarizing Style Guide: **Executive Summary**: Compose a succinct executive summary that encapsulates the key points of the text. **Summary**: • Summarize a major point or idea from the text. • Summarize another important point or concept. • Continue summarizing key aspects of the text. • Highlight additional significant information. • Conclude the summary with any remaining essential insights.",
  };
  requestData.messages.push(prompt1);
  await axios
    .post(import.meta.env.VITE_SUMMARIZING_ASST, requestData.messages, {
      headersCors,
    })
    .then((response) => {
      console.log("Summary Assistant is Triggered!!!")
      output.push(extractCodeAndText(response.data.content));
    })
    .catch((error) => {
      console.error(error);
    });
  setLoading(false);
  return output;
}

export { handleSummaryAssistant };
