/**
 * Responder module for the Comment Processing System
 * Generates polite responses for user comments
 */

import OpenAI from 'openai';
import config from '../config.js';

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: config.openai.baseURL,
  apiKey: config.openai.apiKey,
});

/**
 * Generate responses for comments
 * @param {Array} comments - Array of comment objects
 * @param {object} features - Identified features
 * @returns {Promise<Array>} - Array of comments with responses added
 */
async function generateResponses(comments, features) {
  console.log(`Generating responses for ${comments.length} comments...`);
  
  const commentsWithResponses = [];
  
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    
    try {
      // Get cluster features
      const clusterFeatures = features.clusterFeatures[comment.clusterId] || [];
      
      // Generate response
      const response = await generateSingleResponse(comment, clusterFeatures);
      
      commentsWithResponses.push({
        ...comment,
        response
      });
      
      console.log(`Generated response for comment ${i + 1}/${comments.length}`);
    } catch (error) {
      console.error(`Error generating response for comment ${comment.id}:`, error);
      // Add comment without response
      commentsWithResponses.push({
        ...comment,
        response: "We appreciate your feedback and will take it into consideration.",
        responseError: error.message
      });
    }
  }
  
  return commentsWithResponses;
}

/**
 * Generate a response for a single comment
 * @param {object} comment - Comment object
 * @param {Array} relatedFeatures - Features related to this comment's cluster
 * @returns {Promise<string>} - Generated response
 */
async function generateSingleResponse(comment, relatedFeatures) {
  // Create a context with the comment and related features
  let featuresContext = '';
  if (relatedFeatures && relatedFeatures.length > 0) {
    featuresContext = `Based on this feedback, we've identified these potential features or improvements:\n`;
    relatedFeatures.forEach(feature => {
      featuresContext += `- ${feature.name}: ${feature.description} (${feature.type}, ${feature.priority} priority)\n`;
    });
  }
  
  const response = await client.chat.completions.create({
    model: config.openai.model,
    messages: [
      {
        role: "system",
        content: `You are a customer support representative for an AI assistant called Jarvis. Your task is to generate polite, helpful responses to user comments.

Guidelines for responses:
1. Be empathetic and acknowledge the user's feedback
2. Thank the user for their input
3. If the comment is positive, express appreciation
4. If the comment is negative, apologize for the inconvenience and assure them you're working on improvements
5. If the comment is neutral, acknowledge their observation
6. If relevant, mention that their feedback will be considered for future updates
7. Keep responses concise (2-4 sentences) and professional
8. Do not make specific promises about feature implementation or timelines
9. Sign the response as "The Jarvis Team"`
      },
      {
        role: "user",
        content: `User comment: "${comment.text}"
Comment category: ${comment.category || 'unknown'}

${featuresContext}

Generate a polite, helpful response to this user comment.`
      }
    ],
    temperature: 0.7,
    max_tokens: 200
  });
  
  return response.choices[0].message.content.trim();
}

export {
  generateResponses
};
