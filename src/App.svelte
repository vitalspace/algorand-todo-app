<script lang="ts">
  import WalletConnect from './lib/WalletConnect.svelte';
  import TodoList from './lib/TodoList.svelte';

  let isConnected = $state(false);
  let account = $state('');

  function handleConnect(event: CustomEvent) {
    isConnected = true;
    account = event.detail.account;
  }

  function handleDisconnect() {
    isConnected = false;
    account = '';
  }
</script>

<main>
  <div class="header">
    <h1>📝 Algorand Todo App</h1>
    <p class="subtitle">Gestiona tus tareas en la blockchain de Algorand</p>
  </div>

  <div class="app-container">
    <WalletConnect 
      bind:isConnected 
      bind:account 
      onconnect={handleConnect}
      ondisconnect={handleDisconnect}
    />

    {#if isConnected && account}
      <TodoList {account} />
    {:else}
      <div class="welcome-message">
        <div class="welcome-content">
          <h2>¡Bienvenido a Algorand Todo!</h2>
          <p>Conecta tu wallet para comenzar a gestionar tus tareas en la blockchain.</p>
          <div class="features">
            <div class="feature">
              <span class="icon">🔗</span>
              <span>Conecta con Pera Wallet</span>
            </div>
            <div class="feature">
              <span class="icon">📋</span>
              <span>Crea tareas inmutables</span>
            </div>
            <div class="feature">
              <span class="icon">⛓️</span>
              <span>Almacenadas en Algorand</span>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  <footer class="footer">
    <p>Construido con ❤️ en Svelte y Algorand TestNet</p>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  :global(#app) {
    max-width: none;
    margin: 0;
    padding: 0;
    text-align: left;
  }

  main {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .header {
    text-align: center;
    padding: 2rem 1rem;
    color: white;
  }

  .header h1 {
    font-size: 2.5rem;
    margin: 0 0 0.5rem 0;
    font-weight: 700;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  .subtitle {
    font-size: 1.1rem;
    margin: 0;
    opacity: 0.9;
    font-weight: 300;
  }

  .app-container {
    flex: 1;
    background: #f8fafc;
    margin: 0 1rem;
    border-radius: 16px 16px 0 0;
    padding: 2rem;
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.1);
  }

  .welcome-message {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }

  .welcome-content {
    text-align: center;
    max-width: 500px;
    padding: 2rem;
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  }

  .welcome-content h2 {
    color: #2d3748;
    margin: 0 0 1rem 0;
    font-size: 1.8rem;
  }

  .welcome-content p {
    color: #718096;
    margin: 0 0 2rem 0;
    line-height: 1.6;
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .feature {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: #f7fafc;
    border-radius: 8px;
    color: #4a5568;
    font-weight: 500;
  }

  .icon {
    font-size: 1.2rem;
  }

  .footer {
    text-align: center;
    padding: 1rem;
    color: white;
    opacity: 0.8;
    font-size: 0.9rem;
  }

  @media (max-width: 768px) {
    .app-container {
      margin: 0;
      border-radius: 16px 16px 0 0;
      padding: 1rem;
    }

    .header h1 {
      font-size: 2rem;
    }

    .features {
      gap: 0.75rem;
    }

    .feature {
      padding: 0.5rem;
    }
  }
</style>