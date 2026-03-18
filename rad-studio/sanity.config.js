import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { visionTool } from '@sanity/vision';
import { schemaTypes } from './schemas';

export default defineConfig({
  name: 'rad-motors',
  title: 'RadMotors CMS',

  // ⚠️  Replace with your actual project ID and dataset
  // Run `npx sanity init` to get these values automatically
  projectId: 'jwyoiwam',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(), // lets you test GROQ queries in the studio
  ],

  schema: {
    types: schemaTypes,
  },
});
