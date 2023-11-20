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
        if (newText.trim() === '') {
          // Input is empty, reset the old text
          task.text = localStorage.getItem(`task-${id}`) || '';
        } else {
          task.text = newText.trim();
          localStorage.setItem(`task-${id}`, newText.trim());
        }
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
      const storedText = localStorage.getItem(`task-${task.id}`);
      if (storedText) {
        task.text = storedText;
      }
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
      <div class="flex flex-col items-center mb-2">
        <h1 class="text-4xl font-bold mb-4 mt-6 text-gray-800">TODO APP</h1>
        <div class="w-full max-w-md bg-white rounded-lg shadow-xl p-6 mb-4">
          <div class="flex">
            <input id="taskInput" type="text" placeholder="Enter a task" class="border border-gray-300 px-4 py-2 rounded-lg w-full mr-2 focus:outline-none" />
            <button id="addButton" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg focus:outline-none">Add</button>
          </div>
          <input id="searchInput" type="text" placeholder="Search for a task" class="border border-gray-300 px-4 py-2 rounded-lg w-full mt-4 focus:outline-none" />
        </div>
        <ul id="taskList" class="w-full max-w-md bg-white px-2 rounded-lg shadow-xl"></ul>
      </div>
    `;

    this.searchInput = document.getElementById('searchInput');
    this.searchInput.addEventListener('input', () => {
      const searchTerm = this.searchInput.value.trim();
      if (searchTerm) {
        this.searchTasks(searchTerm);
      } else {
        const warningElem = this.container.querySelector('.warning');
        this.render();
        if (warningElem) {
          this.container.removeChild(warningElem);
        }
      }
    });

    this.taskInput = document.getElementById('taskInput');
    this.taskListElem = document.getElementById('taskList');

    this.addBtn = document.getElementById('addButton');
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
        <div class="flex items-center mb-4 mt-2 justify-between">
          <input type="text" class="task-text ${
            task.done ? 'done' : ''
          } bg-white mr-2 focus:outline-none focus:ring 
          focus:border-blue-500 rounded-lg px-4 py-2 w-full" data-task-id="${
            task.id
          }" 
          value="${task.text}" readonly />
          <div class="flex space-x-2">
          <button class="delete-button bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg focus:outline-none" data-task-id="${
            task.id
          }"><i class="bx bx-trash""></i></button>
            <button class="done-button ${
              task.done ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'
            } text-white px-4 py-2 rounded-lg focus:outline-none" 
            data-task-id="${task.id}">${
        task.done
          ? '<i class="bx bx-check-double"></i>'
          : '<i class="bx bx-check"></i>'
      }</button>
          </div>
        </div>
      `;
      this.taskListElem.prepend(taskItem);
    });

    const searchElem = document.createElement('div');
    this.container.appendChild(searchElem);

    // Add previous and next buttons
    Math.ceil(this.taskList.tasks.length / this.pageSize);
    const paginationElem = document.createElement('div');
    paginationElem.classList.add('pagination');
    paginationElem.innerHTML = `
      <div class="flex items-center justify-center mt-4">
        <button class="prev-btn ${
          this.currentPage === 1
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-medium px-4 py-2 rounded-lg mr-4 ${
      this.currentPage === 1 ? 'pointer-events-none' : ''
    }"><i class="bx bx-chevrons-left"></i></button>
        <button class="next-btn ${
          endIndex >= this.taskList.tasks.length
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white font-medium px-4 py-2 rounded-lg ${
      endIndex >= this.taskList.tasks.length ? 'pointer-events-none' : ''
    }"><i class="bx bx-chevrons-right"></i></button>
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

  searchTasks(searchTerm) {
    const filteredTasks = this.taskList.tasks.filter((task) =>
      task.text.toLowerCase().includes(searchTerm.toLowerCase())
    );

    this.taskListElem.innerHTML = '';
    filteredTasks.forEach((task) => {
      const taskItem = document.createElement('li');
      taskItem.classList.add('task-item');
      taskItem.draggable = true;

      taskItem.innerHTML = `
        <div class="flex items-center mb-4 mt-2 justify-between">
          <input type="text" class="task-text ${
            task.done ? 'done' : ''
          } bg-white mr-2 focus:outline-none focus:ring focus:border-blue-500 rounded-lg px-4 py-2 w-full" data-task-id="${
        task.id
      }" value="${task.text}" readonly />
          <div class="flex space-x-2">
          <button class="delete-button bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg focus:outline-none" data-task-id="${
            task.id
          }"><i class="bx bx-trash""></i></button>
            <button class="done-button ${
              task.done ? 'bg-gray-500' : 'bg-green-500 hover:bg-green-600'
            } text-white px-4 py-2 rounded-lg focus:outline-none" 
            data-task-id="${task.id}">${
        task.done
          ? '<i class="bx bx-check-double"></i>'
          : '<i class="bx bx-check"></i>'
      }</button>  
          </div>
        </div>
      `;
      this.taskListElem.prepend(taskItem);
    });

    const warningElem = this.container.querySelector('.warning');
    if (filteredTasks.length === 0) {
      if (!warningElem) {
        const warningElem = document.createElement('div');
        warningElem.classList.add('warning');
        warningElem.textContent = 'Task not found.';
        this.container.appendChild(warningElem);
      }
    } else {
      if (warningElem) {
        warningElem.remove();
      }
    }
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
