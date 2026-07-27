import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.SANITY_STUDIO_PROJECT_ID || 'lmgxynxp'
const dataset = process.env.SANITY_STUDIO_DATASET || 'production'

export default defineCliConfig({
  api: {
    projectId,
    dataset
  },
  studioHost: 'tourdaovn',
  deployment: {
    appId: 'woiwn9qefw8gdirvjgavvfcs'
  }
})
