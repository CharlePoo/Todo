import React, { Component } from 'react';
import { DragDropContext, Draggable, Droppable } from 'react-beautiful-dnd';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRemove, faClose, faTrashCan, faAdd, faPen } from '@fortawesome/free-solid-svg-icons';
import regeneratorRuntime from "regenerator-runtime";
import { text } from '../../node_modules/@fortawesome/fontawesome-svg-core/index';





// a little function to help us with reordering the result
const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

const grid = 8;

const getItemStyle = (draggableStyle, isDragging) => ({
    // some basic styles to make the items look a bit nicer
    userSelect: 'none',
    padding: grid * 2,
    margin: `0 0 ${grid}px 0`,

    // change background colour if dragging
    background: isDragging ? 'lightgreen' : 'azure',

    // styles we need to apply on draggables
    ...draggableStyle
});

const getListStyle = (isDraggingOver) => ({
    background: isDraggingOver ? 'lightblue' : 'lightgrey',
    padding: grid,
    width: 250
});


class App extends Component {


    state = {
        TodoList: [],
        cleanTodoList: []
    };

    constructor(props) {
        super(props);

        fetch("/api/Todo")
            .then(res => res.json())
            .then(response => {
                this.loadTodoList(response);
            });
        //console.log("list", list);

        this.onDragEnd = this.onDragEnd.bind(this);



    }

    loadTodoList(todoList) {
        todoList.forEach(item => {

            var todo = {
                id: item.id,
                name: item.name,
                EditMode: false,
                IsNew: false,
                taskList: []
            };
            
            item.taskList.forEach(task => {
                todo.taskList.push({ id: task.id, content: task.content, Index: task.index, EditMode: false, IsNew: false });
            });

            this.state.TodoList.push(todo);
        });
        this.updateTodoState();
    }

    componentWillMount() {




    }

    componentDidMount() {



    }

    async GetTodoList() {

    }



    async onDragEnd(result) {
        // dropped outside the list
        
        if (!result.destination) {
            return;
        }

        if (result.source.droppableId == result.destination.droppableId) {
            var sourceItem = this.state.TodoList.find(x => x.id == result.source.droppableId);
            sourceItem.taskList = reorder(
                sourceItem.taskList,
                result.source.index,
                result.destination.index
            );



            this.updateSourceItemIndex(sourceItem);

            await this.updateTodoTaskList(sourceItem, sourceItem);
        }
        else {


            var sourceItem = this.state.TodoList.find(x => x.id == result.source.droppableId);
            var source = sourceItem.taskList[result.source.index];

            var destinationItem = this.state.TodoList.find(x => x.id == result.destination.droppableId);
            source.Index = result.destination.index;
            destinationItem.taskList.splice(result.destination.index, 0, source);

            destinationItem.taskList.forEach((item, index) => {
                item.Index = index;
            });

            sourceItem.taskList.splice(result.source.index, 1);

            this.updateSourceItemIndex(sourceItem);
            await this.updateTodoTaskList(sourceItem, destinationItem);
        }


        this.setState({
            items: this.state.TodoList.map(x => {
                if (x.id == sourceItem.id) x = sourceItem;
                return x;
            })
        });
    }

    async updateTodoTaskList(sourceTodo, destinationTodo) {
        var todo = { Source: sourceTodo, Destination: destinationTodo };
        console.log("todo", todo);
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(todo)
        };

        await fetch('/api/Todo/UpdateAll', requestOptions);
    }


    updateSourceItemIndex(sourceItem) {
        sourceItem.taskList.forEach((task, inx) => {
            task.Index = inx;
        });
    }

    async GetGuid() {
        var id = await (await fetch("/api/GenerateGUID")).text();
        return id;
    }

    async addTask(e, todo) {
        var _index = 0;
        if (todo.taskList.length > 0)
            _index = todo.taskList[todo.taskList.length - 1].Index + 1;
        var id = await this.GetGuid();
        
        todo.taskList.push({ id: id, content: "", Index: _index, EditMode: true, IsNew: true });
        this.updateTodoState();
        
    }

    async removeTodo(e, todo) {

        const requestOptions = {
            method: 'DELETE'
        };
        await fetch('/api/Todo/' + todo.id, requestOptions);

        this.state.TodoList.splice(this.state.TodoList.findIndex(x => x.id == todo.id), 1);
        this.updateTodoState();
    }

    async addTodo(e) {
        var id = await this.GetGuid();
        this.state.TodoList.push({
            id: id,
            name: "Todo 2",
            EditMode: true,
            IsNew: true,
            taskList: []
        });
        
        this.updateTodoState();
    }

    handleTaskChange(e, task) {
        task.content = e.target.value;
    }

    handleTodoChange(e, todo) {
        todo.name = e.target.value;
    }

    updateTodoState() {
        
        this.setState({
            items: this.state.TodoList.map(x => {
                return x;
            })
        });

        this.cloneTodoList();
    }

    cloneTodoList() {
        this.state.cleanTodoList = this.state.TodoList;
    }

    resetTodo() {
        this.state.TodoList = this.state.cleanTodoList;

    }

    async saveTask(e, todo, task) {
        if (e.charCode == 13) {
            task.EditMode = false;
            
            if (task.IsNew)
                await fetch('/api/Task/' + todo.id, this.getSaveRequestOptions(task.IsNew, task));
            else 
                await fetch('/api/Task/', this.getSaveRequestOptions(task.IsNew, task));

            task.IsNew = false;
            this.updateTodoState();
        }
    }



    editTask(e, task) {
        document.getElementById("task" + task.id).value = task.content;
        task.EditMode = true;
        task.tempContent = task.content;
        this.updateTodoState();
    }

    async removeTask(e, task, todo) {

        const requestOptions = {
            method: 'DELETE'
        };
        await fetch('/api/Task/' + task.id, requestOptions);

        todo.taskList.splice(todo.taskList.findIndex(x => x.id == task.id), 1);
        this.updateTodoState();
    }

    async saveTodo(e, todo) {
        if (e.charCode == 13) {
            todo.EditMode = false;
            await fetch('/api/Todo', this.getSaveRequestOptions(todo.IsNew, todo));

            todo.IsNew = false;
            this.updateTodoState();
        }
    }

    getSaveRequestOptions(isNew, jsonBody) {
        return {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jsonBody)
        };
    }
    

    editTodo(e, todo) {
        document.getElementById("todo" + todo.id).value = todo.name;
        todo.EditMode = true;
        todo.tempName = todo.name;
        this.updateTodoState();
    }

    cancelEditTask(e, task, todo) {
        task.content = task.tempContent;
        task.EditMode = false;

        if (task.IsNew) {
            todo.taskList.splice(todo.taskList.findIndex(x=>x.id==task.id),1);
        }

        this.updateTodoState();
    }

    cancelEditTodo(e, todo) {
        todo.name = todo.tempName;
        todo.EditMode = false;

        if (todo.IsNew) {
            this.state.TodoList.splice(this.state.TodoList.findIndex(x => x.id == todo.id),1);
        }

        this.updateTodoState();
    }



    listEditMode(task, todo) {

        return (
            <>
                <div className={task.EditMode ? "showTaskTextBox" : "hideTaskTextBox"}>
                    <input type="text" placeholder="Your task here..." id={"task" + task.id} onChange={e => task.content = e.target.value} onKeyPress={e => this.saveTask(e, todo, task)} />
                    <button title="Remove" onClick={e => this.cancelEditTask(e, task, todo)} className="closeEdit editTask" >
                        <FontAwesomeIcon icon={faClose} />
                    </button>
                </div>
                
                <div className={task.EditMode == false ? "showTaskTextBox" : "hideTaskTextBox"}>
                    {task.content}
                    <button title="Remove" onClick={e => this.removeTask(e, task, todo)} className="editTask" >
                        <FontAwesomeIcon icon={faTrashCan} />
                    </button>
                    <button title="Edit" onClick={e => this.editTask(e, task)} className="editTask" >
                        <FontAwesomeIcon icon={faPen} />
                    </button>
                </div>
            </>
        );
    }

    render() {

        return (
            <>
                <div className="floatLeft clearBoth">
                    <b className="floatLeft clearBoth">NOTE:</b> <i>Just click the Todo Title to edit.</i>
                </div>
                <div className="floatLeft clearBoth">
                    <button onClick={e => this.addTodo(e)}>
                        Add Todo <FontAwesomeIcon icon={faAdd} />
                    </button>
                </div>
                <div className="clearBoth">
                    <DragDropContext onDragEnd={this.onDragEnd}>
                        {this.state.TodoList.map((todo, todoIndex) => (

                            <Droppable droppableId={todo.id}>
                                {(provided, snapshot) => (
                                    <div>
                                        <div
                                            ref={provided.innerRef}
                                            style={getListStyle(snapshot.isDraggingOver)}
                                            className="todo"
                                            {...provided.droppableProps}
                                        >
                                            <div className={todo.EditMode ? "showTaskTextBox" : "hideTaskTextBox"}>
                                                <input type="text" placeholder="Todo name..." id={"todo" + todo.id} onChange={e => this.handleTodoChange(e, todo)} onKeyPress={e => this.saveTodo(e, todo)} />
                                                <button title="Remove" onClick={e => this.cancelEditTodo(e, todo)} className="closeEdit editTask" >
                                                    <FontAwesomeIcon icon={faClose} />
                                                </button>
                                            </div>
                                            
                                            <div className={todo.EditMode == false ? "showTaskTextBox" : "hideTaskTextBox"}>
                                                <h4 onClick={e => this.editTodo(e, todo)}>{todo.name}</h4>
                                            </div>

                                            <span className={"addTask " + (!todo.EditMode ? "showTaskTextBox" : "hideTaskTextBox")} >
                                                <button title="Add Task" onClick={e => this.addTask(e, todo)}>
                                                    <FontAwesomeIcon icon={faAdd} />
                                                </button>
                                                <button title="Delete Todo" onClick={e => this.removeTodo(e, todo)}>
                                                    <FontAwesomeIcon icon={faTrashCan} />
                                                </button>
                                            </span>



                                            <hr />
                                            {todo.taskList.map((item, index) => (

                                                <Draggable
                                                    key={item.id}
                                                    draggableId={item.id}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div>
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.dragHandleProps}
                                                                {...provided.draggableProps}
                                                                style={getItemStyle(
                                                                    provided.draggableProps.style,
                                                                    snapshot.isDragging
                                                                )}
                                                            >
                                                                {this.listEditMode(item, todo)}

                                                            </div>
                                                            {provided.placeholder}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    </div>

                                )}
                            </Droppable>

                        ))} </DragDropContext>
                </div>



            </>

        );
    }
}

export default App;
