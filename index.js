/**
 * Main entry point for the Comment Processing System
 */

import { generateComments } from './src/generator.js';
import { processComments } from './src/processor/index.js';
import { loadFromJson, printSectionHeader } from './src/utils.js';
import config from './src/config.js';
import { promises as fs } from 'fs';
import path from 'path';
import readline from 'readline';

/**
 * Main function to run the entire workflow
 */
async function main() {
  printSectionHeader('Comment Processing System');
  console.log('Starting the comment processing workflow...');
  
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(config.paths.commentsFile);
    await fs.mkdir(dataDir, { recursive: true });
    
    // Step 1: Generate synthetic comments or use existing ones
    let comments;
    try {
      // Try to load existing comments
      const data = await loadFromJson(config.paths.commentsFile);
      comments = data.comments;
      console.log(`Loaded ${comments.length} existing comments from ${config.paths.commentsFile}`);
      
      // Ask if user wants to regenerate comments
      if (config.generator.allowRegenerateComments) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });

        const answer = await new Promise(resolve => {
          rl.question('Do you want to regenerate comments? (y/n): ', resolve);
        });

        rl.close();

        if (answer.toLowerCase() === 'y') {
          comments = await generateComments();
        }
      }
    } catch (error) {
      // Generate new comments if file doesn't exist or is invalid
      console.log('No existing comments found or error loading comments. Generating new comments...');
      comments = await generateComments();
    }
    
    // Step 2: Process the comments
    const results = await processComments(comments);
    
    // Step 3: Display summary
    displaySummary(results);
    
    console.log('\nComment processing workflow completed successfully!');
    console.log(`Full results saved to ${config.paths.resultsFile}`);
    
  } catch (error) {
    console.error('Error in main workflow:', error);
    process.exit(1);
  }
}

/**
 * Display a summary of the processing results
 * @param {object} results - Processing results
 */
function displaySummary(results) {
  printSectionHeader('Processing Summary');
  
  // Display category counts
  console.log('Comment Categories:');
  const { categories } = results.metadata;
  Object.entries(categories).forEach(([category, count]) => {
    if (count > 0) {
      console.log(`- ${category}: ${count} comments`);
    }
  });
  
  // Display cluster counts and names
  console.log('\nComment Clusters:');
  const { clusters, clusterNames } = results.metadata;
  console.log(`- Total clusters: ${Object.keys(clusters).length}`);
  
  // Display cluster names if available
  if (clusterNames && Object.keys(clusterNames).length > 0) {
    console.log('\nCluster Names:');
    Object.entries(clusterNames).forEach(([clusterId, name]) => {
      const count = clusters[clusterId] || 0;
      console.log(`- Cluster ${clusterId} (${count} comments): "${name}"`);
    });
  }
  
  // Display features
  console.log('\nIdentified Features:');
  results.features.forEach((feature, index) => {
    console.log(`- ${feature.name} (${feature.type}, ${feature.priority} priority)`);
    console.log(`  ${feature.description}`);
    if (index < results.features.length - 1) {
      console.log('');
    }
  });
  
  // Display sample comments and responses
  console.log('\nSample Comments and Responses:');
  const sampleSize = Math.min(3, results.comments.length);
  for (let i = 0; i < sampleSize; i++) {
    const comment = results.comments[i];
    console.log(`\nComment ${i + 1} (${comment.category}):`);
    console.log(`"${comment.text}"`);
    console.log('\nResponse:');
    console.log(`"${comment.response}"`);
    console.log('---');
  }
}

// Run the main function
main().catch(console.error);

export {
  main
};
