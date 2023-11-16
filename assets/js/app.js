// Model
class Task {
  constructor(text) {
    this.id = Date.now();
    this.text = text;
    this.done = false;
  }
}

class TaskList {
  constructor() {
    this.tasks = [];
    this.loadTasks();
  }

  addTask(text) {
    const task = new Task(text);
    this.tasks.push(task);
    this.saveTasks();
  }

  deleteTask(id) {
    this.tasks = this.tasks.filter((task) => task.id !== id);
    this.saveTasks();
  }

  toggleTaskStatus(id) {
    this.tasks = this.tasks.map((task) => {
      if (task.id === id) {
        task.done = !task.done;
      }
      return task;
    });
    this.saveTasks();
  }

  editTask(id, newText) {
    this.tasks = this.tasks.map((task) => {
      if (task.id === id) {
        task.text = newText;
      }
      return task;
    });
    this.saveTasks();
  }

  saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
  }

  loadTasks() {
    const savedTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    this.tasks = savedTasks.map((taskData) => {
      const task = new Task(taskData.text);
      task.id = taskData.id;
      task.done = taskData.done;
      return task;
    });
  }
}

// View
class TaskListView {
  constructor(containerId, taskList) {
    this.container = document.getElementById(containerId);
    this.taskList = taskList;
    this.currentPage = 1;
    this.pageSize = 6; // Number of tasks to display per page

    this.container.innerHTML = `
      <h1>Todo App</h1>
      <div class='flex'>
        <input id="taskInput" type="text" placeholder="Enter a task" />
        <button id="addButton" class="btn btn-primary">Add Task</button>
      </div>
      <ul id="taskList"></ul>
    `;
    this.taskInput = document.getElementById('taskInput');
    this.addBtn = document.getElementById('addButton');
    this.taskListElem = document.getElementById('taskList');

    this.addBtn.addEventListener('click', () => {
      const taskText = this.taskInput.value.trim();
      if (taskText) {
        this.taskList.addTask(taskText);
        this.render();
        this.taskInput.value = '';
      }
    });

    this.taskInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const taskText = this.taskInput.value.trim();
        if (taskText) {
          this.taskList.addTask(taskText);
          this.render();
          this.taskInput.value = '';
        }
      }
    });

    this.taskListElem.addEventListener('click', (event) => {
      const target = event.target;
      if (target.classList.contains('delete-button')) {
        const taskId = parseInt(target.dataset.taskId);
        this.taskList.deleteTask(taskId);
        this.render();
      } else if (target.classList.contains('done-button')) {
        const taskId = parseInt(target.dataset.taskId);
        this.taskList.toggleTaskStatus(taskId);
        this.render();
      } else if (target.classList.contains('task-text')) {
        const taskId = parseInt(target.dataset.taskId);
        this.editTask(taskId, target);
      }
    });

    this.taskListElem.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        const taskId = parseInt(event.target.dataset.taskId);
        const newText = event.target.value.trim();
        this.taskList.editTask(taskId, newText);
        this.render();
      }
    });

    this.taskListElem.addEventListener('keyup', (event) => {
      if (event.key === 'Escape') {
        this.render();
      }
    });

    this.taskListElem.addEventListener('dragstart', (event) => {
      event.target.classList.add('dragging');
    });

    this.taskListElem.addEventListener('dragend', (event) => {
      event.target.classList.remove('dragging');
    });

    this.taskListElem.addEventListener('dragover', (event) => {
      event.preventDefault();
      const draggingElement = document.querySelector('.dragging');
      const targetElement = event.target.closest('.task-item');
      if (targetElement === draggingElement) {
        return;
      }
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const offset = rect.y + rect.height / 2;
        if (event.clientY - offset > 0) {
          targetElement.style['border-bottom'] = 'solid 1px #000';
          targetElement.style['border-top'] = '';
        } else {
          targetElement.style['border-bottom'] = '';
          targetElement.style['border-top'] = 'solid 1px #000';
        }
      }
    });

    this.taskListElem.addEventListener('dragleave', (event) => {
      const targetElement = event.target.closest('.task-item');
      if (targetElement) {
        targetElement.style['border-bottom'] = '';
        targetElement.style['border-top'] = '';
      }
    });

    this.taskListElem.addEventListener('drop', (event) => {
      event.preventDefault();
      const draggingElement = document.querySelector('.dragging');
      const targetElement = event.target.closest('.task-item');
      const draggingIndex = Array.from(this.taskListElem.children).indexOf(
        draggingElement
      );
      const targetIndex = Array.from(this.taskListElem.children).indexOf(
        targetElement
      );

      if (draggingIndex !== targetIndex) {
        const draggedTask = this.taskList.tasks[draggingIndex];
        this.taskList.tasks.splice(draggingIndex, 1);
        this.taskList.tasks.splice(targetIndex, 0, draggedTask);
        this.taskList.saveTasks();
      }

      this.render();
    });

    this.render();
  }

  render() {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    const tasksToDisplay = this.taskList.tasks.slice(startIndex, endIndex);

    this.taskListElem.innerHTML = '';
    tasksToDisplay.forEach((task) => {
      const taskItem = document.createElement('li');
      taskItem.classList.add('task-item');
      taskItem.draggable = true;
      taskItem.innerHTML = `
          <input type="text" class="task-text form-control ${
            task.done ? 'done' : ''
          }" data-task-id="${task.id}" value="${task.text}" readonly />
          <button class="delete-button btn btn-danger" data-task-id="${
            task.id
          }">Delete</button>
          <button class="done-button btn btn-success" data-task-id="${
            task.id
          }">${task.done ? 'Undone' : 'Done'}</button>
        `;
      this.taskListElem.appendChild(taskItem);
    });

    // Add previous and next buttons
    const totalPages = Math.ceil(this.taskList.tasks.length / this.pageSize);
    const paginationElem = document.createElement('div');
    paginationElem.classList.add('pagination');
    paginationElem.innerHTML = `
      <div class="central-div d-flex justify-content-center">
        <button class="prev-btn btn btn-primary me-2 ${
          this.currentPage === 1 ? 'disabled' : ''
        }">Previous</button>
        <button class="next-btn btn btn-primary ${
          endIndex >= this.taskList.tasks.length ? 'disabled' : ''
        }">Next</button>
      </div>
    `;

    // Remove existing pagination elements before adding the new one
    const existingPaginationElem = this.container.querySelector('.pagination');
    if (existingPaginationElem) {
      existingPaginationElem.remove();
    }

    this.container.appendChild(paginationElem);

    // Add event listeners for previous and next buttons
    const prevBtn = this.container.querySelector('.prev-btn');
    const nextBtn = this.container.querySelector('.next-btn');

    prevBtn.addEventListener('click', () => {
      this.goToPreviousPage();
    });

    nextBtn.addEventListener('click', () => {
      this.goToNextPage();
    });
  }

  goToPreviousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.render();
    }
  }

  goToNextPage() {
    const totalPages = Math.ceil(this.taskList.tasks.length / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.render();
    }
  }

  editTask(taskId, target) {
    const taskItem = target.closest('.task-item');
    const taskTextElem = taskItem.querySelector('.task-text');
    taskTextElem.readOnly = false;
    taskTextElem.focus();
    taskTextElem.setSelectionRange(0, taskTextElem.value.length);
  }
}

// Controller
const taskList = new TaskList();
new TaskListView('app', taskList);
