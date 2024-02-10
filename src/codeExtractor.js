function extractCodeAndText(input) {
  const blocks = [];
  const codeRegex = /```([\s\S]*?)```/;
  let remainingText = input;

  const codeMatchStart = input && input.match(codeRegex);
  if (codeMatchStart && codeMatchStart.index === 0) {
    blocks.push({ type: 'code', content: codeMatchStart[1].trim() });
    remainingText = remainingText.slice(codeMatchStart[0].length);
  }

  while (true) {
    const codeMatch = remainingText.match(codeRegex);

    if (!codeMatch) {
      if (remainingText.trim()) {
        blocks.push({ type: 'text', content: remainingText.trim() });
      }
      break;
    }

    blocks.push({ type: 'code', content: codeMatch[1].trim() });

    remainingText = remainingText.slice(codeMatch.index + codeMatch[0].length);
  }

  return blocks;
}


export {extractCodeAndText};
