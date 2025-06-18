<script lang="ts">
  import { getTodos, createTodo, toggleTodo, type Todo } from './algorand';
  import { onMount } from 'svelte';


  const { account } = $props();
  

  let todos: Todo[] = $state([]);
  let newTodoText = $state('');
  let isLoading = $state(false);
  let isAddingTodo = $state(false);

  onMount(() => {
    if (account) {
      loadTodos();
    }
  });

  async function loadTodos() {
    if (!account) return;
    
    try {
      isLoading = true;
      todos = await getTodos(account);
    } catch (error) {
      console.error('Error loading todos:', error);
      alert('Error al cargar las tareas');
    } finally {
      isLoading = false;
    }
  }

  async function addTodo() {
    if (!newTodoText.trim() || !account) return;

    try {
      isAddingTodo = true;
      await createTodo(account, newTodoText.trim());
      newTodoText = '';
      await loadTodos(); // Recargar la lista
    } catch (error) {
      console.error('Error adding todo:', error);
      alert('Error al agregar la tarea. Asegúrate de tener ALGO suficiente para las fees.');
    } finally {
      isAddingTodo = false;
    }
  }

  async function handleToggleTodo(todo: Todo) {
    try {
      await toggleTodo(account, todo.text, todo.completed);
      await loadTodos(); // Recargar la lista
    } catch (error) {
      console.error('Error toggling todo:', error);
      alert('Error al actualizar la tarea');
    }
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleString();
  }

  // Recargar todos cuando cambie la cuenta
  $effect(() => {
    if (account) {
      loadTodos();
    }
  });
</script>

<div class="todo-container">
  <div class="add-todo">
    <div class="input-group">
      <input
        bind:value={newTodoText}
        placeholder="Escribe una nueva tarea..."
        onkeydown={(e) => e.key === 'Enter' && addTodo()}
        disabled={isAddingTodo}
        class="todo-input"
      />
      <button 
        onclick={addTodo}
        disabled={!newTodoText.trim() || isAddingTodo}
        class="add-btn"
      >
        {isAddingTodo ? 'Agregando...' : 'Agregar'}
      </button>
    </div>
  </div>

  <div class="todos-section">
    <div class="section-header">
      <h2>Mis Tareas en Algorand</h2>
      <button onclick={loadTodos} disabled={isLoading} class="refresh-btn">
        {isLoading ? '🔄' : '↻'} Actualizar
      </button>
    </div>

    {#if isLoading}
      <div class="loading">
        <div class="spinner"></div>
        <p>Cargando tareas desde la blockchain...</p>
      </div>
    {:else if todos.length === 0}
      <div class="empty-state">
        <p>No tienes tareas aún. ¡Agrega tu primera tarea!</p>
      </div>
    {:else}
      <div class="todos-list">
        {#each todos as todo (todo.id)}
          <div class="todo-item {todo.completed ? 'completed' : ''}">
            <div class="todo-content">
              <button 
                class="toggle-btn"
                onclick={() => handleToggleTodo(todo)}
              >
                {todo.completed ? '✅' : '⭕'}
              </button>
              <div class="todo-text">
                <span class="text">{todo.text}</span>
                <span class="timestamp">{formatDate(todo.timestamp)}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .todo-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .add-todo {
    margin-bottom: 2rem;
  }

  .input-group {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .todo-input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
    background: white;
  }

  .todo-input:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  .add-btn {
    padding: 12px 24px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
  }

  .add-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
  }

  .add-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .section-header h2 {
    margin: 0;
    color: #2d3748;
    font-size: 1.5rem;
  }

  .refresh-btn {
    padding: 8px 16px;
    background: #f7fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.9rem;
  }

  .refresh-btn:hover:not(:disabled) {
    background: #edf2f7;
    border-color: #cbd5e0;
  }

  .loading {
    text-align: center;
    padding: 3rem 1rem;
    color: #718096;
  }

  .spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #e2e8f0;
    border-top: 4px solid #667eea;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: #718096;
    background: #f7fafc;
    border-radius: 8px;
    border: 2px dashed #e2e8f0;
  }

  .todos-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .todo-item {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .todo-item:hover {
    border-color: #cbd5e0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .todo-item.completed {
    opacity: 0.7;
    background: #f7fafc;
  }

  .todo-content {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .toggle-btn {
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    padding: 0;
    line-height: 1;
    transition: transform 0.2s ease;
  }

  .toggle-btn:hover {
    transform: scale(1.1);
  }

  .todo-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .text {
    font-size: 1rem;
    color: #2d3748;
    line-height: 1.4;
  }

  .completed .text {
    text-decoration: line-through;
    color: #718096;
  }

  .timestamp {
    font-size: 0.75rem;
    color: #a0aec0;
  }

  @media (max-width: 640px) {
    .input-group {
      flex-direction: column;
    }
    
    .section-header {
      flex-direction: column;
      gap: 1rem;
      align-items: stretch;
    }
    
    .section-header h2 {
      text-align: center;
    }
  }
</style>