/**
 * Feature identification module for the Comment Processing System
 * Identifies potential product features based on comment content
 */

import OpenAI from 'openai';
import config from '../config.js';

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: config.openai.baseURL,
  apiKey: config.openai.apiKey,
});

/**
 * Identify features from a set of comments
 * @param {Array} comments - Array of comment objects
 * @returns {Promise<object>} - Object with identified features
 */
async function identifyFeatures(comments) {
  console.log('Identifying potential product features from comments...');
  
  // Group comments by cluster
  const commentsByCluster = {};
  comments.forEach(comment => {
    const clusterId = comment.clusterId;
    if (!commentsByCluster[clusterId]) {
      commentsByCluster[clusterId] = [];
    }
    commentsByCluster[clusterId].push(comment);
  });
  
  // Identify features for each cluster
  const clusterFeatures = {};
  const allFeatures = [];
  
  for (const [clusterId, clusterComments] of Object.entries(commentsByCluster)) {
    console.log(`Identifying features for cluster ${clusterId} (${clusterComments.length} comments)...`);
    
    try {
      // Extract comments text
      const commentsText = clusterComments.map(comment => comment.text).join('\n\n');
      
      // Identify features
      const features = await extractFeaturesFromComments(commentsText);
      
      // Store features for this cluster
      clusterFeatures[clusterId] = features;
      
      // Add to all features
      features.forEach(feature => {
        if (!allFeatures.some(f => f.name === feature.name)) {
          allFeatures.push({
            ...feature,
            clusters: [clusterId]
          });
        } else {
          // Update existing feature
          const existingFeature = allFeatures.find(f => f.name === feature.name);
          if (!existingFeature.clusters.includes(clusterId)) {
            existingFeature.clusters.push(clusterId);
          }
        }
      });
      
      console.log(`Identified ${features.length} features for cluster ${clusterId}`);
    } catch (error) {
      console.error(`Error identifying features for cluster ${clusterId}:`, error);
    }
  }
  
  console.log(`Feature identification complete. Found ${allFeatures.length} unique features.`);
  
  return {
    clusterFeatures,
    allFeatures
  };
}

/**
 * Extract features from comments
 * @param {string} commentsText - Text of comments
 * @returns {Promise<Array>} - Array of identified features
 */
async function extractFeaturesFromComments(commentsText) {
  const response = await client.chat.completions.create({
    model: config.openai.model,
    messages: [
      {
        role: "system",
        content: `You are a product analyst for an AI assistant called Jarvis. Your task is to identify potential product features or improvements based on user comments.
        
For each set of comments, identify up to 3 potential features or improvements that could address the user feedback.

For each feature, provide:
1. A short name (2-5 words)
2. A brief description (1-2 sentences)
3. The type of feature (New Feature, Improvement, Bug Fix)
4. Priority (High, Medium, Low)

Format your response as a JSON array of features, with each feature having the fields: name, description, type, and priority.`
      },
      {
        role: "user",
        content: `Here are some user comments about Jarvis. Identify potential features or improvements based on these comments:

${commentsText}`
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.5
  });
  
  try {
    const result = JSON.parse(response.choices[0].message.content);
    return result.features || [];
  } catch (error) {
    console.error('Error parsing feature identification response:', error);
    return [];
  }
}

export {
  identifyFeatures
};
