/**
 * Comment generator for the Comment Processing System
 * Generates synthetic user comments
 */

import OpenAI from 'openai';
import config from './config.js';
import { saveToJson, getFormattedDateTime, printSectionHeader } from './utils.js';

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: config.openai.baseURL,
  apiKey: config.openai.apiKey,
});

console.log("OpenAI client initialized with base URL:", config.openai.baseURL);

/**
 * Generate synthetic user comments about Jarvis
 * @returns {Promise<Array>} - Array of generated comments
 */
async function generateComments() {
  printSectionHeader('Generating Synthetic Comments');
  
  const { numComments, commentTypes, topics } = config.generator;
  const comments = [];
  
  console.log(`Generating ${numComments} synthetic comments about Jarvis...`);
  
  for (let i = 0; i < numComments; i++) {
    // Randomly select comment type and topic
    const type = commentTypes[Math.floor(Math.random() * commentTypes.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    
    try {
      const comment = await generateSingleComment(type, topic);
      comments.push({
        id: `comment-${i + 1}`,
        text: comment,
        timestamp: getFormattedDateTime(),
        metadata: {
          generatedType: type,
          generatedTopic: topic
        }
      });
      
      console.log(`Generated comment ${i + 1}/${numComments} (${type} about ${topic})`);
    } catch (error) {
      console.error(`Error generating comment ${i + 1}:`, error);
    }
  }
  
  // Save generated comments to file
  await saveToJson(config.paths.commentsFile, { comments });
  console.log(`All comments generated and saved to ${config.paths.commentsFile}`);
  
  return comments;
}

/**
 * Generate a single comment
 * @param {string} type - Type of comment (positive, negative, neutral)
 * @param {string} topic - Topic of the comment
 * @returns {Promise<string>} - Generated comment text
 */
async function generateSingleComment(type, topic) {
  const prompt = createPromptForCommentGeneration(type, topic);
  
  const response = await client.chat.completions.create({
    model: config.openai.model,
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant that generates realistic user comments about an AI assistant called Jarvis."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    ...config.openai.commentGeneration
  });
  
  return response.choices[0].message.content.trim();
}

/**
 * Create a prompt for comment generation
 * @param {string} type - Type of comment (positive, negative, neutral)
 * @param {string} topic - Topic of the comment
 * @returns {string} - Prompt for OpenAI
 */
function createPromptForCommentGeneration(type, topic) {
  let sentiment = '';
  
  switch (type) {
    case 'positive':
      sentiment = 'positive and appreciative';
      break;
    case 'negative':
      sentiment = 'negative and critical';
      break;
    case 'neutral':
      sentiment = 'neutral and balanced';
      break;
    default:
      sentiment = 'general';
  }
  
  return `Generate a realistic ${sentiment} user comment about an AI assistant called Jarvis, focusing on its ${topic}.
  
The comment should sound natural, as if written by a real user who has been using Jarvis.
Keep the comment concise (1-3 sentences) and focused on the specific topic.
Do not include ratings (like "5/5 stars") or formatting.
Just return the comment text without any additional context or explanation.`;
}

export {
  generateComments
};
