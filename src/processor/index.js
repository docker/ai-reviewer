/**
 * Main processor module for the Comment Processing System
 * Orchestrates the entire comment processing workflow
 */

import { printSectionHeader, saveToJson } from '../utils.js';
import config from '../config.js';
import { categorizeComments } from './categorizer.js';
import { clusterComments } from './clusterer.js';
import { identifyFeatures } from './featureId.js';
import { generateResponses } from './responder.js';

/**
 * Process comments through the entire workflow
 * @param {Array} comments - Array of comment objects
 * @returns {Promise<object>} - Processing results
 */
async function processComments(comments) {
  printSectionHeader('Processing Comments');
  console.log(`Starting processing workflow for ${comments.length} comments...`);
  
  // Step 1: Categorize comments
  printSectionHeader('Step 1: Categorization');
  const categorizedComments = await categorizeComments(comments);
  
  // Step 2: Cluster comments
  printSectionHeader('Step 2: Clustering');
  const clusteringResult = await clusterComments(categorizedComments);
  const { comments: clusteredComments, clusterNames } = clusteringResult;
  
  // Step 3: Identify features
  printSectionHeader('Step 3: Feature Identification');
  const features = await identifyFeatures(clusteredComments);
  
  // Step 4: Generate responses
  printSectionHeader('Step 4: Response Generation');
  const processedComments = await generateResponses(clusteredComments, features);
  
  // Remove embeddings from comments to clean up the JSON output
  const cleanedComments = removeEmbeddings(processedComments);
  
  // Prepare results
  const results = {
    metadata: {
      totalComments: comments.length,
      processedAt: new Date().toISOString(),
      categories: countByCategory(cleanedComments),
      clusters: countByClusters(cleanedComments),
      clusterNames: clusterNames
    },
    comments: cleanedComments,
    features: features.allFeatures
  };
  
  // Save results
  await saveToJson(config.paths.resultsFile, results);
  console.log(`Processing complete. Results saved to ${config.paths.resultsFile}`);
  
  return results;
}

/**
 * Count comments by category
 * @param {Array} comments - Array of comment objects
 * @returns {object} - Count by category
 */
function countByCategory(comments) {
  const counts = {
    positive: 0,
    negative: 0,
    neutral: 0,
    unknown: 0
  };
  
  comments.forEach(comment => {
    const category = comment.category || 'unknown';
    counts[category] = (counts[category] || 0) + 1;
  });
  
  return counts;
}

/**
 * Count comments by cluster
 * @param {Array} comments - Array of comment objects
 * @returns {object} - Count by cluster
 */
function countByClusters(comments) {
  const counts = {};
  
  comments.forEach(comment => {
    const clusterId = comment.clusterId;
    if (clusterId) {
      counts[clusterId] = (counts[clusterId] || 0) + 1;
    }
  });
  
  return counts;
}

/**
 * Remove embeddings from comments to clean up the JSON output
 * @param {Array} comments - Array of comment objects with embeddings
 * @returns {Array} - Array of comment objects without embeddings
 */
function removeEmbeddings(comments) {
  return comments.map(comment => {
    // Create a shallow copy of the comment
    const cleanComment = { ...comment };
    
    // Remove the embedding property if it exists
    if ('embedding' in cleanComment) {
      delete cleanComment.embedding;
    }
    
    return cleanComment;
  });
}

export {
  processComments
};
