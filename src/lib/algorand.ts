import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';

// Configuración para TestNet
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;

// Configuración para Indexer
const indexerToken = '';
const indexerServer = 'https://testnet-idx.algonode.cloud';
const indexerPort = 443;

export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);
export const indexerClient = new algosdk.Indexer(indexerToken, indexerServer, indexerPort);

// Inicializar Pera Wallet
export const peraWallet = new PeraWalletConnect({
  chainId: 416002 // TestNet chain ID
});

export interface Todo {
  id: number;
  text: string;
  completed: boolean;
  creator: string;
  timestamp: number;
  txId?: string; // Agregamos el ID de transacción para referencia
}

// Función para verificar si hay una sesión activa
export function getConnectedAccount(): string | null {
  try {
    // Check localStorage for persisted account
    const savedAccount = localStorage.getItem('peraWallet.account');
    if (savedAccount) {
      return savedAccount;
    }
    
    // Check if Pera Wallet has active accounts
    const accounts = peraWallet.connector?.accounts;
    if (accounts && accounts.length > 0) {
      return accounts[0];
    }
    
    return null;
  } catch (error) {
    console.log('No active session found');
    return null;
  }
}

// Función para conectar wallet
export async function connectWallet(): Promise<string[]> {
  try {
    // First check if already connected
    const existingAccount = getConnectedAccount();
    if (existingAccount && peraWallet.connector?.accounts?.length > 0) {
      return [existingAccount];
    }

    // If not connected, create new connection
    const accounts = await peraWallet.connect();
    
    // Save to localStorage for persistence
    if (accounts.length > 0) {
      localStorage.setItem('peraWallet.account', accounts[0]);
    }
    
    return accounts;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

// Función para reconectar automáticamente
export async function reconnectWallet(): Promise<string | null> {
  try {
    const savedAccount = localStorage.getItem('peraWallet.account');
    if (!savedAccount) {
      return null;
    }

    // Try to reconnect to existing session
    await peraWallet.reconnectSession();
    
    // Verify the connection is still valid
    const accounts = peraWallet.connector?.accounts;
    if (accounts && accounts.includes(savedAccount)) {
      return savedAccount;
    } else {
      // Session is invalid, clear storage
      localStorage.removeItem('peraWallet.account');
      return null;
    }
  } catch (error) {
    // If reconnection fails, clear storage
    localStorage.removeItem('peraWallet.account');
    return null;
  }
}

// Función para desconectar wallet
export function disconnectWallet(): void {
  peraWallet.disconnect();
  localStorage.removeItem('peraWallet.account');
}

// Función para crear una nueva tarea en la blockchain
export async function createTodo(account: string, todoText: string): Promise<string> {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    // Crear nota con los datos de la tarea
    const todoData = {
      type: 'todo',
      text: todoText,
      completed: false,
      timestamp: Date.now()
    };
    
    const note = new TextEncoder().encode(JSON.stringify(todoData));
    
    // Crear transacción de pago mínimo con nota
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: account,
      to: account, // Enviamos a nosotros mismos
      amount: 0, // Cantidad mínima
      note: note,
      suggestedParams: suggestedParams,
    });

    // Firmar transacción con Pera Wallet
    const signedTxns = await peraWallet.signTransaction([
      {
        txn: txn,
        signers: [account],
      },
    ]);

    // Enviar transacción
    const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
    
    // Esperar confirmación
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    return txId;
  } catch (error) {
    console.error('Error creating todo:', error);
    throw error;
  }
}

// Función para obtener todas las tareas de un usuario
export async function getTodos(account: string): Promise<Todo[]> {
  try {
    const todos: Todo[] = [];
    
    // Obtener las últimas 100 transacciones usando el Indexer
    const txns = await indexerClient.searchForTransactions()
      .address(account)
      .addressRole('sender')
      .limit(100)
      .do();

    let todoId = 1;
    
    for (const txn of txns.transactions) {
      if (txn.note) {
        try {
          const noteBytes = Buffer.from(txn.note, 'base64');
          const noteString = noteBytes.toString('utf-8');
          const todoData = JSON.parse(noteString);
          
          if (todoData.type === 'todo') {
            todos.push({
              id: todoId++,
              text: todoData.text,
              completed: todoData.completed || false,
              creator: account,
              timestamp: todoData.timestamp || 0,
              txId: txn.id
            });
          }
        } catch (e) {
          // Ignorar notas que no son JSON válido
          continue;
        }
      }
    }
    
    // Ordenar por timestamp descendente (más recientes primero)
    return todos.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching todos:', error);
    return [];
  }
}

// Función para obtener una tarea específica por texto
export async function getTodoByText(account: string, todoText: string): Promise<Todo | null> {
  try {
    // Obtener todas las transacciones del usuario
    const txns = await indexerClient.searchForTransactions()
      .address(account)
      .addressRole('sender')
      .limit(100)
      .do();

    // Buscar la tarea específica
    for (const txn of txns.transactions) {
      if (txn.note) {
        try {
          const noteBytes = Buffer.from(txn.note, 'base64');
          const noteString = noteBytes.toString('utf-8');
          const todoData = JSON.parse(noteString);
          
          if (todoData.type === 'todo' && todoData.text === todoText) {
            return {
              id: 1, // Se podría mejorar con un ID más específico
              text: todoData.text,
              completed: todoData.completed || false,
              creator: account,
              timestamp: todoData.timestamp || 0,
              txId: txn.id
            };
          }
        } catch (e) {
          // Ignorar notas que no son JSON válido
          continue;
        }
      }
    }
    
    return null; // No se encontró la tarea
  } catch (error) {
    console.error('Error fetching todo by text:', error);
    return null;
  }
}

// Función para obtener una tarea específica por ID de transacción
export async function getTodoByTxId(txId: string): Promise<Todo | null> {
  try {
    // Obtener la transacción específica
    const txn = await indexerClient.lookupTransactionByID(txId).do();
    
    if (txn.transaction && txn.transaction.note) {
      try {
        const noteBytes = Buffer.from(txn.transaction.note, 'base64');
        const noteString = noteBytes.toString('utf-8');
        const todoData = JSON.parse(noteString);
        
        if (todoData.type === 'todo') {
          return {
            id: 1, // Se podría mejorar con un ID más específico
            text: todoData.text,
            completed: todoData.completed || false,
            creator: txn.transaction.sender,
            timestamp: todoData.timestamp || 0,
            txId: txn.transaction.id
          };
        }
      } catch (e) {
        console.error('Error parsing transaction note:', e);
        return null;
      }
    }
    
    return null; // No es una tarea válida
  } catch (error) {
    console.error('Error fetching todo by transaction ID:', error);
    return null;
  }
}

// Función para obtener el historial completo de una tarea (incluyendo actualizaciones)
export async function getTodoHistory(account: string, todoText: string): Promise<Todo[]> {
  try {
    const todoHistory: Todo[] = [];
    
    // Obtener todas las transacciones del usuario
    const txns = await indexerClient.searchForTransactions()
      .address(account)
      .addressRole('sender')
      .limit(100)
      .do();

    let todoId = 1;
    
    // Buscar todas las transacciones relacionadas con esta tarea
    for (const txn of txns.transactions) {
      if (txn.note) {
        try {
          const noteBytes = Buffer.from(txn.note, 'base64');
          const noteString = noteBytes.toString('utf-8');
          const todoData = JSON.parse(noteString);
          
          // Incluir tanto creación como actualizaciones de la tarea
          if ((todoData.type === 'todo' || todoData.type === 'todo_update') && 
              todoData.text === todoText) {
            todoHistory.push({
              id: todoId++,
              text: todoData.text,
              completed: todoData.completed || false,
              creator: account,
              timestamp: todoData.timestamp || 0,
              txId: txn.id
            });
          }
        } catch (e) {
          // Ignorar notas que no son JSON válido
          continue;
        }
      }
    }
    
    // Ordenar por timestamp descendente (más recientes primero)
    return todoHistory.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Error fetching todo history:', error);
    return [];
  }
}

// Función para marcar tarea como completada
export async function toggleTodo(account: string, todoText: string, completed: boolean): Promise<string> {
  try {
    const suggestedParams = await algodClient.getTransactionParams().do();
    
    const todoData = {
      type: 'todo_update',
      text: todoText,
      completed: !completed,
      timestamp: Date.now()
    };
    
    const note = new TextEncoder().encode(JSON.stringify(todoData));
    
    const txn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: account,
      to: account,
      amount: 0,
      note: note,
      suggestedParams: suggestedParams,
    });

    const signedTxns = await peraWallet.signTransaction([
      {
        txn: txn,
        signers: [account],
      },
    ]);

    const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
    await algosdk.waitForConfirmation(algodClient, txId, 4);
    
    return txId;
  } catch (error) {
    console.error('Error toggling todo:', error);
    throw error;
  }
}