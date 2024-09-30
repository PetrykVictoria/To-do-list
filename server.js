const socket = new WebSocket('ws://localhost:8080'); // Підключення до WebSocket сервера

socket.addEventListener('message', function (event) {
    const { action, data } = JSON.parse(event.data);
    if (action === 'update') {
        loadTodos(data);
    }
});

function saveTodos() {
    const todos = [];
    todoList.querySelectorAll('li').forEach(li => {
        todos.push({
            text: li.querySelector('.todo-text').textContent,
            completed: li.classList.contains('completed')
        });
    });
    socket.send(JSON.stringify({ action: 'update', data: todos })); // Надсилаємо список todos на сервер
}

addTodoButton.addEventListener('click', function () {
    const todoText = newTodoInput.value;
    if (todoText === '') return;
    addTodoElement(todoText);
    newTodoInput.value = '';
    socket.send(JSON.stringify({ action: 'add', data: todoText })); // Надсилаємо новий todo на сервер
});

li.querySelector('.delete-btn').addEventListener('click', function () {
    li.remove();
    saveTodos();
    socket.send(JSON.stringify({ action: 'delete', data: li.querySelector('.todo-text').textContent })); // Надсилаємо повідомлення про видалення
});

li.querySelector('.todo-checkbox').addEventListener('change', function () {
    li.classList.toggle('completed');
    saveTodos();
    socket.send(JSON.stringify({ action: 'toggle', data: { text: li.querySelector('.todo-text').textContent, completed: li.classList.contains('completed') } })); // Надсилаємо повідомлення про переключення
});

// Додайте цю частину до drop обробника
li.addEventListener('drop', function (event) {
    event.preventDefault();
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
        socket.send(JSON.stringify({ action: 'reorder', data: { text: draggingElement.querySelector('.todo-text').textContent, newIndex: Array.from(todoList.children).indexOf(li) } })); // Надсилаємо повідомлення про зміщення
    }
});
