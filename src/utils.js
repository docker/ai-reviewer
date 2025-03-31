/**
 * Utility functions for the Comment Processing System
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Save data to a JSON file
 * @param {string} filePath - Path to the file
 * @param {object} data - Data to save
 * @returns {Promise<void>}
 */
async function saveToJson(filePath, data) {
  try {
    const dirPath = path.dirname(filePath);
    await fs.mkdir(dirPath, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Data successfully saved to ${filePath}`);
  } catch (error) {
    console.error(`Error saving data to ${filePath}:`, error);
    throw error;
  }
}

/**
 * Load data from a JSON file
 * @param {string} filePath - Path to the file
 * @returns {Promise<object>} - Parsed JSON data
 */
async function loadFromJson(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading data from ${filePath}:`, error);
    throw error;
  }
}

/**
 * Calculate cosine similarity between two vectors
 * @param {number[]} vecA - First vector
 * @param {number[]} vecB - Second vector
 * @returns {number} - Similarity score between 0 and 1
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same length');
  }
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) {
    return 0;
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Format the current date and time
 * @returns {string} - Formatted date and time
 */
function getFormattedDateTime() {
  const now = new Date();
  return now.toISOString();
}

/**
 * Print a section header to the console
 * @param {string} title - Section title
 */
function printSectionHeader(title) {
  const line = '='.repeat(title.length + 4);
  console.log('\n' + line);
  console.log(`= ${title} =`);
  console.log(line + '\n');
}

export {
  saveToJson,
  loadFromJson,
  cosineSimilarity,
  getFormattedDateTime,
  printSectionHeader
};
