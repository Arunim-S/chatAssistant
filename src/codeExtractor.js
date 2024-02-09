function extractCodeAndText(input) {
  const blocks = [];
  const codeRegex = /```([\s\S]*?)```/;
  let remainingText = input;

  // Check if input starts with a code block
  const codeMatchStart = input && input.match(codeRegex);
  if (codeMatchStart && codeMatchStart.index === 0) {
    // Extract the code block from the start of the input
    blocks.push({ type: 'code', content: codeMatchStart[1].trim() });
    remainingText = remainingText.slice(codeMatchStart[0].length);
  }

  while (true) {
    // Find the next code block
    const codeMatch = remainingText.match(codeRegex);

    // If no more code blocks are found, break the loop
    if (!codeMatch) {
      if (remainingText.trim()) {
        // If there's remaining text after all code blocks, add it to the blocks array
        blocks.push({ type: 'text', content: remainingText.trim() });
      }
      break;
    }

    // Extract the code block and add it to the blocks array
    blocks.push({ type: 'code', content: codeMatch[1].trim() });

    // Remove the extracted code block from the remaining text
    remainingText = remainingText.slice(codeMatch.index + codeMatch[0].length);
  }

  return blocks;
}


export {extractCodeAndText};
