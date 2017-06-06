import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { Modal, Button, FormGroup, ControlLabel, FormControl, Panel } from 'react-bootstrap'
import Typeahead from 'react-bootstrap-typeahead'
import { browserHistory } from 'react-router'
import _ from 'underscore'

import { hideCreateEnvModal, getBranches, createEnvironment, getEnvironmentSpec } from '../../actions/envs'

function mapStateToProps (state) {
  const envs = state.envs.toJS()
  const defaultEnv = _.findWhere(envs.envs, {name: state.defaultEnv})
  return {
    envs,
    defaultEnv
  }
}

const dispatchProps = {
  hideCreateEnvModal,
  getBranches,
  createEnvironment,
  getEnvironmentSpec
}

@connect(mapStateToProps, dispatchProps)
export default class EnvCreateModal extends React.Component {
  static propTypes = {
    children: PropTypes.node,
    dispatch: PropTypes.func,
    envs: PropTypes.object,
    hideCreateEnvModal: PropTypes.func.isRequired,
    getBranches: PropTypes.func.isRequired,
    createEnvironment: PropTypes.func.isRequired,
    getEnvironmentSpec: PropTypes.func.isRequired
  }

  constructor (props) {
    super(props)

    this.state = {}

    this.hide = this.hide.bind(this)
    this.onNameChange = this.onNameChange.bind(this)
    this.onBranchChange = this.onBranchChange.bind(this)
    this.loadSpec = _.debounce(this.loadSpec.bind(this), 200)
    this.onSpecChange = this.onSpecChange.bind(this)
    this.createNewEnvironment = this.createNewEnvironment.bind(this)
  }

  componentWillMount () {
    this.loadData()
  }

  loadData = () => {
    this.props.getBranches()
  }

  async createNewEnvironment () {
    const { results, error } = await this.props.createEnvironment({
      name: this.state.name,
      branch: this.state.branch,
      spec: this.state.spec
    })
    if (error) {
      this.setState({error})
      return
    }
    browserHistory.push(`/${this.state.name}/releases/${results.release.name}`)
    this.hide()
  }

  hide () {
    this.setState({
      name: null,
      branch: null,
      template: null,
      error: null
    })
    this.props.hideCreateEnvModal()
  }

  onNameChange (event) {
    var name = event.target.value
    this.setState({
      name: name,
      createdResources: null,
      error: null
    })
    this.loadSpec(name, this.state.branch)
  }

  onBranchChange (branch) {
    this.setState({
      branch: branch,
      createdResources: null,
      error: null
    })
    this.loadSpec(this.state.name, branch)
  }

  async loadSpec (name, branch) {
    if (!name || !branch) {
      return
    }
    const { results, error } = await this.props.getEnvironmentSpec(name, branch)
    if (!error) {
      this.setState({spec: results.spec})
    }
  }

  onSpecChange (event) {
    this.setState({
      spec: event.target.value,
      createdResources: null,
      error: null
    })
  }

  render () {
    const { envs } = this.props
    if (!envs.showCreateModal) {
      return null
    }

    let actionButton = null
    if (!this.state.createdResources) {
      actionButton = (
        <Button
          bsStyle='primary'
          onClick={this.createNewEnvironment}
          disabled={!this.state.spec || Boolean(this.state.error)}
        >
          Create
        </Button>
      )
    }

    let specForm = null
    if (this.state.name && this.state.branch) {
      specForm = (
        <FormGroup controlId='environmentSpec'>
          <ControlLabel>Environment Spec</ControlLabel>
          <FormControl
            componentClass='textarea'
            value={this.state.spec}
            onChange={this.onSpecChange}
            style={{'height': '400px'}}
            disabled={this.state.createdResources}
          />
        </FormGroup>
      )
    }

    let output = null
    if (this.state.error) {
      var errorMessage = _.map(this.state.error.split('\n'), function (text) {
        return <div>{text}</div>
      })
      output = <Panel header='Error' bsStyle='danger'>{errorMessage}</Panel>
    }

    const branches = _.map(envs.branches, (branch) => {
      return {
        label: branch
      }
    })
    return (
      <Modal show onHide={this.hide}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Environment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormGroup controlId='environmentName'>
            <ControlLabel>Environment Name</ControlLabel>
            <FormControl
              componentClass='input'
              type='text'
              value={this.state.name}
              placeholder='my-feature-environment'
              onChange={this.onNameChange}
              disabled={this.state.createdResources}
            />
          </FormGroup>
          <FormGroup>
            <ControlLabel>Default Branch</ControlLabel>
            <Typeahead
              options={branches}
              labelKey='label'
              onInputChange={this.onBranchChange}
              disabled={this.state.createdResources}
            />
          </FormGroup>
          {specForm}
          {output}
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={this.hide}>Close</Button>
          {actionButton}
        </Modal.Footer>
      </Modal>
    )
  }
}
