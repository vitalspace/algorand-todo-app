import algosdk from 'algosdk';
import { PeraWalletConnect } from '@perawallet/connect';

// Configuración para TestNet
const algodToken = '';
const algodServer = 'https://testnet-api.algonode.cloud';
const algodPort = 443;

export const algodClient = new algosdk.Algodv2(algodToken, algodServer, algodPort);

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
}

// Función para conectar wallet
export async function connectWallet(): Promise<string[]> {
  try {
    const accounts = await peraWallet.connect();
    return accounts;
  } catch (error) {
    console.error('Error connecting wallet:', error);
    throw error;
  }
}

// Función para desconectar wallet
export function disconnectWallet(): void {
  peraWallet.disconnect();
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
    const accountInfo = await algodClient.accountInformation(account).do();
    const todos: Todo[] = [];
    
    // Obtener las últimas 100 transacciones
    const txns = await algodClient.searchForTransactions()
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
              timestamp: todoData.timestamp || 0
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