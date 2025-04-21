/**
 * Configuration settings for the Comment Processing System
 */

export default {
  // Model configuration
  openai: {
    baseURL: process.env.OPENAI_BASE_URL || "http://localhost:12434/engines/v1", // Base URL for Docker Model Runner
    apiKey: 'ignored',
    model: process.env.LLM_MODEL || "ai/gemma3", // Model to use for generation and processing
    commentGeneration: {
      temperature: 0.3,
      max_tokens: 250,
      n: 1,
    },
    embedding: {
      model: process.env.EMBEDDINGS_MODEL || "ai/mxbai-embed-large", // Model for generating embeddings
    },
  },
  
  // Comment generation settings
  generator: {
    numComments: 20, // Number of synthetic comments to generate
    commentTypes: ["positive", "negative", "neutral"], // Types of comments to generate
    topics: [
      "user interface",
      "response quality",
      "response speed",
      "accuracy",
      "helpfulness",
      "feature requests",
      "bugs",
      "pricing",
      "comparison to competitors",
      "general experience"
    ],
  },
  
  // Processing settings
  processor: {
    clustering: {
      similarityThreshold: 0.75, // Threshold for considering comments similar
    },
  },
  
  // Paths
  paths: {
    commentsFile: "./data/comments.json",
    resultsFile: "./data/results.json",
  }
};
