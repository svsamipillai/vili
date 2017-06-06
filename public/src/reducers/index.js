import { reducer as uiReducer } from 'redux-ui'
import { routerReducer } from 'react-router-redux'

import app from './app'
import envs from './envs'
import releases from './releases'
import deployments from './deployments'
import replicaSets from './replicaSets'
import jobs from './jobs'
import jobRuns from './jobRuns'
import configmaps from './configmaps'
import pods from './pods'
import nodes from './nodes'

function hardcodedValueReducer (state = null, action) {
  return state
}

const reducers = {
  ui: uiReducer,
  routing: routerReducer,
  user: hardcodedValueReducer,
  defaultEnv: hardcodedValueReducer,
  app,
  envs,
  releases,
  deployments,
  replicaSets,
  jobs,
  jobRuns,
  configmaps,
  pods,
  nodes
}

export default reducers
