/**
 * Comment clusterer for the Comment Processing System
 * Clusters similar comments together based on their content
 */

import OpenAI from 'openai';
import config from '../config.js';
import { cosineSimilarity } from '../utils.js';

// Initialize OpenAI client
const client = new OpenAI({
  baseURL: config.openai.baseURL,
  apiKey: config.openai.apiKey,
});

/**
 * Cluster comments based on their content similarity
 * @param {Array} comments - Array of comment objects
 * @returns {Promise<object>} - Object with clustered comments and cluster names
 */
async function clusterComments(comments) {
  console.log(`Clustering ${comments.length} comments...`);
  
  // Generate embeddings for all comments
  const commentsWithEmbeddings = await generateEmbeddings(comments);
  
  // Perform clustering
  const clusteredComments = performClustering(commentsWithEmbeddings);
  
  // Count comments per cluster and group comments by cluster
  const clusterCounts = {};
  const commentsByCluster = {};
  
  clusteredComments.forEach(comment => {
    const clusterId = comment.clusterId;
    // Update counts
    clusterCounts[clusterId] = (clusterCounts[clusterId] || 0) + 1;
    
    // Group comments by cluster
    if (!commentsByCluster[clusterId]) {
      commentsByCluster[clusterId] = [];
    }
    commentsByCluster[clusterId].push(comment);
  });
  
  // Log clustering results
  console.log(`Clustering complete. Found ${Object.keys(clusterCounts).length} clusters:`);
  Object.entries(clusterCounts).forEach(([clusterId, count]) => {
    console.log(`- Cluster ${clusterId}: ${count} comments`);
  });
  
  // Generate names for each cluster
  const clusterNames = await generateClusterNames(commentsByCluster);
  
  // Log cluster names
  console.log('Generated cluster names:');
  Object.entries(clusterNames).forEach(([clusterId, name]) => {
    console.log(`- Cluster ${clusterId}: "${name}"`);
  });
  
  return {
    comments: clusteredComments,
    clusterNames
  };
}

/**
 * Generate embeddings for comments
 * @param {Array} comments - Array of comment objects
 * @returns {Promise<Array>} - Array of comments with embeddings added
 */
async function generateEmbeddings(comments) {
  console.log(`Generating embeddings for ${comments.length} comments...`);
  
  const commentsWithEmbeddings = [];
  
  for (let i = 0; i < comments.length; i++) {
    const comment = comments[i];
    
    try {
      const embedding = await getEmbedding(comment.text);
      commentsWithEmbeddings.push({
        ...comment,
        embedding
      });
      
      console.log(`Generated embedding for comment ${i + 1}/${comments.length}`);
    } catch (error) {
      console.error(`Error generating embedding for comment ${comment.id}:`, error);
      // Add comment without embedding
      commentsWithEmbeddings.push(comment);
    }
  }
  
  return commentsWithEmbeddings;
}

/**
 * Get embedding for a text
 * @param {string} text - Text to embed
 * @returns {Promise<Array>} - Embedding vector
 */
async function getEmbedding(text) {
  const response = await client.embeddings.create({
    model: config.openai.embedding.model,
    input: text,
    encoding_format: "float"
  });
  
  return response.data[0].embedding;
}

/**
 * Perform clustering on comments with embeddings
 * @param {Array} commentsWithEmbeddings - Array of comment objects with embeddings
 * @returns {Array} - Array of comments with cluster IDs added
 */
function performClustering(commentsWithEmbeddings) {
  const { similarityThreshold } = config.processor.clustering;
  const clusters = [];
  const clusteredComments = [];
  
  // Filter out comments without embeddings
  const validComments = commentsWithEmbeddings.filter(comment => comment.embedding);
  
  // For each comment
  for (const comment of validComments) {
    let assignedToExistingCluster = false;
    
    // Check if it belongs to any existing cluster
    for (let i = 0; i < clusters.length; i++) {
      const clusterId = i + 1;
      const clusterComments = clusteredComments.filter(c => c.clusterId === clusterId);
      
      // Check similarity with each comment in the cluster
      for (const clusterComment of clusterComments) {
        const similarity = cosineSimilarity(comment.embedding, clusterComment.embedding);
        
        if (similarity >= similarityThreshold) {
          // Add to existing cluster
          clusteredComments.push({
            ...comment,
            clusterId,
            similarityScore: similarity
          });
          assignedToExistingCluster = true;
          break;
        }
      }
      
      if (assignedToExistingCluster) {
        break;
      }
    }
    
    if (!assignedToExistingCluster) {
      // Create a new cluster
      const newClusterId = clusters.length + 1;
      clusters.push(newClusterId);
      clusteredComments.push({
        ...comment,
        clusterId: newClusterId,
        similarityScore: 1.0  // Perfect similarity with itself
      });
    }
  }
  
  // Add comments without embeddings to their own clusters
  const commentsWithoutEmbeddings = commentsWithEmbeddings.filter(comment => !comment.embedding);
  for (const comment of commentsWithoutEmbeddings) {
    const newClusterId = clusters.length + 1;
    clusters.push(newClusterId);
    clusteredComments.push({
      ...comment,
      clusterId: newClusterId,
      clusteringError: "No embedding available"
    });
  }
  
  return clusteredComments;
}

/**
 * Generate descriptive names for each cluster based on the comments
 * @param {object} commentsByCluster - Object with comments grouped by cluster ID
 * @returns {Promise<object>} - Object with cluster IDs as keys and names as values
 */
async function generateClusterNames(commentsByCluster) {
  console.log('Generating descriptive names for clusters...');
  
  const clusterNames = {};
  
  for (const [clusterId, comments] of Object.entries(commentsByCluster)) {
    try {
      // Extract a sample of comments for naming (to avoid token limits)
      const sampleSize = Math.min(5, comments.length);
      const sampleComments = comments
        .slice(0, sampleSize)
        .map(comment => comment.text)
        .join('\n\n');
      
      // Generate a name for this cluster
      const name = await generateNameForCluster(sampleComments);
      clusterNames[clusterId] = name;
      
      console.log(`Generated name for cluster ${clusterId}: "${name}"`);
    } catch (error) {
      console.error(`Error generating name for cluster ${clusterId}:`, error);
      clusterNames[clusterId] = `Cluster ${clusterId}`;
    }
  }
  
  return clusterNames;
}

/**
 * Generate a descriptive name for a cluster based on sample comments
 * @param {string} commentsText - Text of sample comments from the cluster
 * @returns {Promise<string>} - Descriptive name for the cluster
 */
async function generateNameForCluster(commentsText) {
  const response = await client.chat.completions.create({
    model: config.openai.model,
    messages: [
      {
        role: "system",
        content: `You are an expert at identifying common themes in text. Your task is to analyze a set of user comments about an AI assistant called Jarvis and identify the main topic or theme they discuss.

Generate a short, descriptive name (3-5 words) that captures the common theme or topic in these comments. Focus on the subject matter rather than sentiment.

For example:
- "Response Speed and Performance"
- "User Interface Design"
- "Accuracy of Information"
- "Feature Request: Data Visualization"
- "Pricing and Value Concerns"

Respond with ONLY the theme name, nothing else.`
      },
      {
        role: "user",
        content: `Here are some user comments about Jarvis. Identify the common theme and provide a short, descriptive name:

${commentsText}`
      }
    ],
    temperature: 0.3,
    max_tokens: 20
  });
  
  const name = response.choices[0].message.content.trim();
  
  // Remove any quotes that might be in the response
  return name.replace(/["']/g, '');
}

export {
  clusterComments
};
