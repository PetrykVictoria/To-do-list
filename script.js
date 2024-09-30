document.addEventListener('DOMContentLoaded', function () {
    const todoList = document.getElementById('todo-list');
    const newTodoInput = document.getElementById('new-todo');
    const addTodoButton = document.getElementById('add-todo');
    const channel = new BroadcastChannel('todo_channel');

    // ³��������� �������� ������
    newTodoInput.addEventListener('input', function () {
        const currentText = newTodoInput.value;
        channel.postMessage({ type: 'input', text: currentText });
    });

    channel.addEventListener('message', function (event) {
        if (event.data.type === 'input') {
            newTodoInput.value = event.data.text; // ������������ ���� �����
        } else if (event.data.type === 'add') {
            addTodoElement(event.data.text); // ��������� ������
            newTodoInput.value = ''; // �������� ���� ����� � ������� �������
        } else if (event.data.type === 'delete') {
            removeTodoElement(event.data.text); // ��������� ������
        } else if (event.data.type === 'toggle') {
            toggleTodoElement(event.data.text, event.data.completed); // ����������� ������� ������
        } else if (event.data.type === 'reorder') {
            reorderTodos(event.data.todos); // ���������� ������
        } else if (event.data.type === 'dragging') {
            highlightDragging(event.data.text); // ϳ���������� �������������� ��������
        } else if (event.data.type === 'dragend') {
            removeHighlighting(); // ��������� �����������
        } else if (event.data.type === 'hover') {
            highlightHover(event.data.text); // ϳ���������� �� ��������
        } else if (event.data.type === 'unhover') {
            removeHover(event.data.text); // ��������� ����������� � ����������
        } else if (event.data.type === 'checkbox') {
            toggleTodoElement(event.data.text, event.data.completed); // ������������ ����� ��������
        }
    });

    function loadTodos(todos = JSON.parse(localStorage.getItem('todos')) || []) {
        todoList.innerHTML = ''; // �������� ������
        todos.forEach(todo => {
            addTodoElement(todo.text, todo.completed);
        });
    }

    function saveTodos() {
        const todos = [];
        todoList.querySelectorAll('li').forEach(li => {
            todos.push({
                text: li.querySelector('.todo-text').textContent,
                completed: li.classList.contains('completed')
            });
        });
        localStorage.setItem('todos', JSON.stringify(todos));
        channel.postMessage({ type: 'update', todos }); // ������������ ������
    }

    function addTodoElement(text, completed = false) {
        const li = document.createElement('li');
        li.setAttribute('data-text', text);
        li.innerHTML = `
            <input type="checkbox" class="todo-checkbox" ${completed ? 'checked' : ''}>
            <span class="todo-text">${text}</span>
            <button class="delete-btn">Delete</button>
        `;
        if (completed) {
            li.classList.add('completed');
        }
        todoList.appendChild(li);

        li.querySelector('.delete-btn').addEventListener('click', function () {
            removeTodoElement(text); // ��������� ������
        });

        li.querySelector('.todo-checkbox').addEventListener('change', function () {
            const isChecked = li.querySelector('.todo-checkbox').checked;
            li.classList.toggle('completed', isChecked);
            saveTodos();
            channel.postMessage({ type: 'checkbox', text, completed: isChecked }); // ������������ �������
        });

        // ������ ��������� ��� �������������
        li.draggable = true;

        li.addEventListener('dragstart', function () {
            li.classList.add('dragging');
            channel.postMessage({ type: 'dragging', text }); // ������������ �������������
        });

        li.addEventListener('dragend', function () {
            li.classList.remove('dragging');
            channel.postMessage({ type: 'dragend' }); // ������������ ��������� �������������
        });

        li.addEventListener('dragover', function (event) {
            event.preventDefault();
            const draggingElement = document.querySelector('.dragging');
            if (draggingElement && draggingElement !== li) {
                const bounding = li.getBoundingClientRect();
                const offset = bounding.y + bounding.height / 2;
                if (event.clientY - offset > 0) {
                    li.style['border-bottom'] = '2px solid #8e24aa';
                    li.style['border-top'] = '';
                } else {
                    li.style['border-top'] = '2px solid #8e24aa';
                    li.style['border-bottom'] = '';
                }
            }
        });

        li.addEventListener('dragleave', function () {
            li.style['border-top'] = '';
            li.style['border-bottom'] = '';
        });

        li.addEventListener('drop', function (event) {
            event.preventDefault();
            const draggingElement = document.querySelector('.dragging');
            if (draggingElement && draggingElement !== li) {
                const bounding = li.getBoundingClientRect();
                const offset = bounding.y + bounding.height / 2;
                if (event.clientY - offset > 0) {
                    todoList.insertBefore(draggingElement, li.nextSibling);
                } else {
                    todoList.insertBefore(draggingElement, li);
                }
                li.style['border-top'] = '';
                li.style['border-bottom'] = '';
                saveTodos();

                // ��������� ������� � ��� ��������
                const todos = Array.from(todoList.children).map(li => li.getAttribute('data-text'));
                channel.postMessage({ type: 'reorder', todos });
            }
        });

        // ��������� ��������� ��� ���������
        li.addEventListener('mouseover', function () {
            channel.postMessage({ type: 'hover', text }); // ������������ �����������
        });

        li.addEventListener('mouseout', function () {
            channel.postMessage({ type: 'unhover', text }); // ������������ ��������� �����������
        });
    }

    function removeTodoElement(text) {
        const todoElement = document.querySelector(`[data-text="${text}"]`);
        if (todoElement) {
            todoElement.remove(); // ��������� � DOM
            saveTodos(); // ��������� ���
            channel.postMessage({ type: 'delete', text }); // ������������ ���������
        }
    }

    function toggleTodoElement(text, completed) {
        const todoElement = document.querySelector(`[data-text="${text}"]`);
        if (todoElement) {
            const checkbox = todoElement.querySelector('.todo-checkbox');
            checkbox.checked = completed;
            if (completed) {
                todoElement.classList.add('completed');
            } else {
                todoElement.classList.remove('completed');
            }
        }
    }

    function reorderTodos(todos) {
        todoList.innerHTML = ''; // �������� ������
        todos.forEach(text => addTodoElement(text)); // ��������� ����� � ������ �������
    }

    function highlightDragging(text) {
        const todoElement = document.querySelector(`[data-text="${text}"]`);
        if (todoElement) {
            todoElement.classList.add('dragging');
        }
    }

    function removeHighlighting() {
        const draggingElement = document.querySelector('.dragging');
        if (draggingElement) {
            draggingElement.classList.remove('dragging');
        }
    }

    function highlightHover(text) {
        const todoElement = document.querySelector(`[data-text="${text}"]`);
        if (todoElement) {
            todoElement.classList.add('hovered');
        }
    }

    function removeHover(text) {
        const todoElement = document.querySelector(`[data-text="${text}"]`);
        if (todoElement) {
            todoElement.classList.remove('hovered');
        }
    }

    addTodoButton.addEventListener('click', function () {
        const todoText = newTodoInput.value.trim(); // ��������� ������
        if (todoText === '') return; // �������� �� ������ ��������
        addTodoElement(todoText); // ������ ���� ������
        saveTodos(); // �������� ����
        channel.postMessage({ type: 'add', text: todoText }); // ������������
        newTodoInput.value = ''; // �������� ���� ����� � ������� �������
    });

    loadTodos(); // ������������ ����������� ������
});
