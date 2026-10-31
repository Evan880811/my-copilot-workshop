// 待辦清單使用原生 JavaScript，資料儲存在瀏覽器的 localStorage。
const STORAGE_KEY = 'my-copilot-workshop-todos';
const THEME_STORAGE_KEY = 'my-copilot-workshop-theme';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const themeToggle = document.getElementById('theme-toggle');
const filterButtons = document.querySelectorAll('.filter-button');
const colorScheme = window.matchMedia('(prefers-color-scheme: dark)');

let todos = loadTodos();
let activeFilter = 'all';
let savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
if (savedTheme !== 'light' && savedTheme !== 'dark') {
  savedTheme = null;
}
let currentTheme = savedTheme === 'light' || savedTheme === 'dark'
  ? savedTheme
  : colorScheme.matches ? 'dark' : 'light';

// 套用主題並更新切換按鈕文字。
function applyTheme(theme) {
  currentTheme = theme;
  document.documentElement.dataset.theme = theme;

  const isDark = theme === 'dark';
  themeToggle.querySelector('[aria-hidden="true"]').textContent = isDark ? '☀️' : '🌙';
  themeToggle.querySelector('span:last-child').textContent = isDark ? '淺色模式' : '深色模式';
  themeToggle.setAttribute('aria-label', `切換至${isDark ? '淺色' : '深色'}模式`);
}

// 第一次載入時採用儲存的選擇，否則跟隨作業系統設定。
applyTheme(currentTheme);

// 未手動選擇主題時，作業系統設定改變也會同步更新。
colorScheme.addEventListener('change', (event) => {
  if (!savedTheme) {
    applyTheme(event.matches ? 'dark' : 'light');
  }
});

themeToggle.addEventListener('click', () => {
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  savedTheme = nextTheme;
  applyTheme(nextTheme);
});

// 從 localStorage 載入資料，並略過格式不正確的項目。
function loadTodos() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];

    if (!Array.isArray(parsed)) {
      throw new TypeError('待辦清單資料格式不正確。');
    }

    return parsed.filter((todo) =>
      todo &&
      typeof todo.id === 'string' &&
      typeof todo.text === 'string' &&
      typeof todo.completed === 'boolean'
    );
  } catch (error) {
    console.error('讀取待辦清單失敗，將以空清單開始。', error);
    return [];
  }
}

// 將目前清單存回 localStorage。
function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 依照目前資料與篩選條件繪製清單，並統計整體未完成數量。
function render() {
  list.replaceChildren();

  const visibleTodos = todos.filter((todo) => {
    if (activeFilter === 'active') {
      return !todo.completed;
    }
    if (activeFilter === 'completed') {
      return todo.completed;
    }
    return true;
  });

  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed ? 'todo-item completed' : 'todo-item';
    item.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.className = 'todo-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `標記「${todo.text}」為完成`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    deleteButton.type = 'button';
    deleteButton.textContent = '刪除';
    deleteButton.setAttribute('aria-label', `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    list.append(item);
  });

  emptyState.hidden = visibleTodos.length > 0;
  if (activeFilter === 'active') {
    emptyState.textContent = '沒有未完成的待辦事項。';
  } else if (activeFilter === 'completed') {
    emptyState.textContent = '沒有已完成的待辦事項。';
  } else {
    emptyState.textContent = '還沒有任何待辦事項,新增一個吧!';
  }

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === activeFilter;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  const remaining = todos.filter((todo) => !todo.completed).length;
  remainingCount.textContent = `未完成:${remaining} 項`;
}

// 新增一筆待辦事項。
function addTodo(text) {
  todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    completed: false,
  });
  saveTodos();
  render();
}

// 更新指定待辦事項的完成狀態。
function toggleTodo(id) {
  todos = todos.map((todo) =>
    todo.id === id ? { ...todo, completed: !todo.completed } : todo
  );
  saveTodos();
  render();
}

// 刪除指定的待辦事項。
function deleteTodo(id) {
  todos = todos.filter((todo) => todo.id !== id);
  saveTodos();
  render();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) {
    return;
  }

  addTodo(text);
  input.value = '';
  input.focus();
});

// 透過事件委派處理勾選與刪除。
list.addEventListener('click', (event) => {
  const item = event.target.closest('.todo-item');
  if (!item) {
    return;
  }

  if (event.target.matches('.todo-checkbox')) {
    toggleTodo(item.dataset.id);
  } else if (event.target.matches('.btn-delete')) {
    deleteTodo(item.dataset.id);
  }
});

// 切換目前顯示的待辦事項範圍。
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    activeFilter = button.dataset.filter;
    render();
  });
});

render();
