/**
 * Comment categorizer for the Comment Processing System
 * Categorizes comments as positive, negative, or neutral
 */

import OpenAI from 'openai';
import config from '../config.js';

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: config.openai.baseURL,
  apiKey: config.openai.apiKey,
});

/**
 * Categorize a comment as positive, negative, or neutral
 * @param {object} comment - Comment object
 * @returns {Promise<object>} - Comment with category added
 */
async function categorizeComment(comment) {
  try {
    const category = await determineSentiment(comment.text);
    
    return {
      ...comment,
      category
    };
  } catch (error) {
    console.error(`Error categorizing comment ${comment.id}:`, error);
    // Default to neutral if categorization fails
    return {
      ...comment,
      category: 'neutral',
      categoryError: error.message
    };
  }
}

/**
 * Determine the sentiment of a comment
 * @param {string} text - Comment text
 * @returns {Promise<string>} - Sentiment category (positive, negative, neutral)
 */
async function determineSentiment(text) {
  const response = await client.chat.completions.create({
    model: config.openai.model,
    messages: [
      {
        role: "system",
        content: `You are a sentiment analysis system. Analyze the sentiment of user comments about an AI assistant called Jarvis.
        Classify each comment as exactly one of: "positive", "negative", or "neutral".
        Respond with only the category word, nothing else.`
      },
      {
        role: "user",
        content: text
      }
    ],
    temperature: 0.1,
    max_tokens: 10
  });
  
  const result = response.choices[0].message.content.trim().toLowerCase();
  
  // Ensure the result is one of the valid categories
  if (['positive', 'negative', 'neutral'].includes(result)) {
    return result;
  } else {
    // Default to neutral if the result is not a valid category
    console.warn(`Invalid category result: "${result}". Defaulting to "neutral".`);
    return 'neutral';
  }
}

/**
 * Categorize multiple comments
 * @param {Array} comments - Array of comment objects
 * @returns {Promise<Array>} - Array of comments with categories added
 */
async function categorizeComments(comments) {
  console.log(`Categorizing ${comments.length} comments...`);
  
  const categorizedComments = [];
  
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    const categorizedComment = await categorizeComment(comment);
    categorizedComments.push(categorizedComment);
    
    console.log(`Categorized comment ${i + 1}/${comments.length} as "${categorizedComment.category}"`);
  }
  
  return categorizedComments;
}

export {
  categorizeComments
};
