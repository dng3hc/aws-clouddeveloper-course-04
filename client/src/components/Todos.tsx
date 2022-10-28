import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Grid,
  Header,
  Icon,
  Input,
  Image,
  Loader,
  Label,
  Modal
} from 'semantic-ui-react'

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}

interface TodosState {
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  showModal: boolean
  currentPost: number
}

export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    showModal: false,
    currentPost: 0, 
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      const dueDate = this.calculateDueDate()
      const newTodo = await createTodo(this.props.auth.getIdToken(), {
        name: this.state.newTodoName,
        dueDate
      })
      this.setState({
        todos: [...this.state.todos, newTodo],
        newTodoName: ''
      })
    } catch {
      alert('Todo creation failed')
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      await deleteTodo(this.props.auth.getIdToken(), todoId)
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId)
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: !todo.done,
        upvote: todo.upvote,
        downvote: todo.downvote
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onUpvote = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: todo.done,
        upvote: todo.upvote,
        downvote: todo.downvote
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { upvote: { $set: todo.upvote + 1 } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }
  onDownvote = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        dueDate: todo.dueDate,
        done: todo.done,
        upvote: todo.upvote,
        downvote: todo.downvote
      })
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { downvote: { $set: todo.downvote + 1 } }
        })
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken())
      this.setState({
        todos,
        loadingTodos: false
      })
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`)
    }
  }

  render() {
    return (
      <div>
        <Header as="h1" style={{color: '#fff'}}>POSTs</Header>

        {this.renderCreateTodoInput()}

        {this.renderTodos()}
      </div>
    )
  }

  renderCreateTodoInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'grey',
              labelPosition: 'left',
              icon: 'add',
              content: 'Upload new post',
              onClick: this.onTodoCreate
            }}
            fluid
            actionPosition="left"
            placeholder="Post title"
            onChange={this.handleNameChange}
          />
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTodos() {
    if (this.state.loadingTodos) {
      return this.renderLoading()
    }

    return this.renderTodosList()
  }

  renderLoading() {
    return (
      <Grid.Row>
        <Loader indeterminate active inline="centered">
          Loading TODOs
        </Loader>
      </Grid.Row>
    )
  }

  renderTodosList() {
    return (
      <Grid padded>
        {this.state.todos.map((todo, pos) => {
          return (
            <Grid.Row key={todo.todoId}>
              <Grid.Column width={1} verticalAlign="middle">
                <Checkbox
                  onChange={() => this.onTodoCheck(pos)}
                  checked={todo.done}
                />
              </Grid.Column>
              <Grid.Column width={10} verticalAlign="middle" style={{color: '#fff'}} >
                {todo.name}
              </Grid.Column>
              <Grid.Column width={3} floated="right" style={{color: '#fff'}}>
                {todo.dueDate}
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="blue"
                  onClick={() => this.onEditButtonClick(todo.todoId)}
                >
                  <Icon name="pencil" />
                </Button>
              </Grid.Column>
              <Grid.Column width={1} floated="right">
                <Button
                  icon
                  color="red"
                  onClick={() => this.onTodoDelete(todo.todoId)}
                >
                  <Icon name="delete" />
                </Button>
              </Grid.Column>
              <Grid.Column width={16} floated="right" >
                {todo.attachmentUrl && (
                  <Image src={todo.attachmentUrl} size="large" wrapped/>
                )}
                <span style={{marginLeft: '15vw'}}>
                  <Button as='div' labelPosition='right'>
                    <Button
                      icon
                      color="grey"
                      onClick={() => this.onUpvote(pos)}
                    >
                      <Icon name="arrow up" />
                    </Button>
                    <Label as='a' basic pointing='left'>
                      {todo.upvote ? todo.upvote : "0"}
                    </Label>
                  </Button>
                  <Button as='div' labelPosition='right'>
                    <Button
                      icon
                      color="grey"
                      onClick={() => this.onDownvote(pos)}
                    >
                      <Icon name="arrow down" />
                    </Button>
                    <Label as='a' basic pointing='left'>
                      {todo.downvote ? todo.downvote : "0"}
                    </Label>
                  </Button>
                </span>
                <Modal
                  onClose={() => this.setState({ showModal: false })}
                  onOpen={() => this.setState({ showModal: true })}
                  open={this.state.showModal && this.state.currentPost === pos}
                  trigger={<Button onClick={() => {
                    this.setState({ currentPost: pos })
                    console.log(this.state.currentPost)
                  }}>View Post</Button>}
                >
                  <Modal.Header>{this.state.todos[pos].name}</Modal.Header>
                  <Modal.Content image>
                    <Image src={this.state.todos[pos].attachmentUrl} size="large" wrapped />
                  </Modal.Content>
                  <Modal.Actions>
                    <Button onClick={() => this.setState({ showModal: false })}>Cancel</Button>
                  </Modal.Actions>
                </Modal>
              </Grid.Column>
              <Grid.Column width={16}>
                <Divider />
              </Grid.Column>
            </Grid.Row>
          )
        })}
      </Grid>
    )
  }

  calculateDueDate(): string {
    const date = new Date()
    date.setDate(date.getDate() + 7)

    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}
