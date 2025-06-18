<script lang="ts">
  import { connectWallet, disconnectWallet } from './algorand';
  import { createEventDispatcher, onMount } from 'svelte';

  const dispatch = createEventDispatcher();

  export let isConnected = false;
  export let account = '';

  let isConnecting = false;

  onMount(async () => {
    try {
      // Check if there's an existing session and reconnect
      const accounts = await connectWallet();
      if (accounts.length > 0) {
        account = accounts[0];
        isConnected = true;
        dispatch('connect', { account });
      }
    } catch (error) {
      // If reconnection fails, ensure we're in disconnected state
      isConnected = false;
      account = '';
    }
  });

  async function handleConnect() {
    if (isConnected) {
      disconnectWallet();
      isConnected = false;
      account = '';
      dispatch('disconnect');
    } else {
      try {
        isConnecting = true;
        const accounts = await connectWallet();
        if (accounts.length > 0) {
          account = accounts[0];
          isConnected = true;
          dispatch('connect', { account });
        }
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        alert('Error al conectar la wallet. Asegúrate de tener Pera Wallet instalada.');
      } finally {
        isConnecting = false;
      }
    }
  }

  function formatAccount(acc: string): string {
    if (!acc) return '';
    return `${acc.slice(0, 6)}...${acc.slice(-4)}`;
  }
</script>

<div class="wallet-connect">
  <button 
    class="connect-btn {isConnected ? 'connected' : ''}" 
    onclick={handleConnect}
    disabled={isConnecting}
  >
    {#if isConnecting}
      Conectando...
    {:else if isConnected}
      {formatAccount(account)} ✓
    {:else}
      Conectar Wallet
    {/if}
  </button>
</div>

<style>
  .wallet-connect {
    margin-bottom: 2rem;
  }

  .connect-btn {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  }

  .connect-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }

  .connect-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  .connect-btn.connected {
    background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
    box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
  }

  .connect-btn.connected:hover {
    box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  }
</style>