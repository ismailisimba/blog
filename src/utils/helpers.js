// src/utils/helpers.js

export function truncateText(text, length = 155) {
  if (!text) return '';
  // Remove markdown and trim
  const cleanText = text.replace(/!\[.*?\]\(.*?\)|\[(.*?)\]\(.*?\)|#+\s*|`{1,3}|-|\*/g, '$1').trim();
  if (cleanText.length <= length) {
    return cleanText;
  }
  // Trim to the last full word before the limit
  const trimmed = cleanText.substring(0, length);
  return trimmed.substring(0, trimmed.lastIndexOf(' ')) + '...';
}
