import { io, Socket } from 'socket.io-client';
import { token } from "$lib/auth";
import { get, writable } from 'svelte/store';


let socket: Socket | null = null;
export const onlineFriends = writable<Record<number, boolean>>({});

let currentToken: string | null = null;

token.subscribe((value) => {
    if (value === currentToken) return;
    currentToken = value;
    disconnectSocket();
    if (value) {
        connectSocket();
    }
});

function connectSocket() {
    if (socket) return socket;
    socket = io('http://localhost:3000', {auth: (cb) => cb({ token: get(token) })});
    socket.on('connect', () => {
        console.log('connecté', socket?.id);
        socket?.emit('getOnlineFriends', (friends) => {
            console.log(friends);
            const res = Object.fromEntries(friends.map((f) => [f.userId, f.onlineStatus]));
            onlineFriends.set(res);
        });
    });
    socket.on('presence', ({userId, onlineStatus}) =>{
        console.log('presence', userId, onlineStatus);
        onlineFriends.update((o) => ({...o, [userId]: onlineStatus}));
    });
    socket.on('newMessage', (msg: ChatMessage) => {
        messageHandlers.forEach((handler) => handler(msg));
    });
    socket.on('connect_error', (e) => console.log('erreur', e.message));
    socket.on('disconnect', (reason) => console.log('déconnecté', reason));
    socket.onAny((event, ...args) => console.log('EVENT', event, args));
    return socket;
}

export interface ChatMessage {
    id: string;
    content: string;
    createdAt: string;
    conversationId?: number;
    sender: { id: number; username: string; avatarUrl: string | null };
}

export type SendResponse =
    | { ok: true; message: ChatMessage }
    | { ok: false; error: string };

export function sendMessage(conversationId: number, content: string) {
    return new Promise<SendResponse>((resolve) => {
        if (!socket) {
            resolve({ ok: false, error: 'NOT_CONNECTED' });
            return;
        }
        socket.emit('sendMessage', { conversationId, content }, resolve);
    });
}

const messageHandlers = new Set<(m: ChatMessage) => void>();

export function onNewMessage(handler: (m: ChatMessage) => void) {
    messageHandlers.add(handler);
    return () => messageHandlers.delete(handler);
}

function disconnectSocket() {
    socket?.disconnect();
    onlineFriends.set({})
    socket = null;
}

token.subscribe((value) => {
  if (value) {
    disconnectSocket();
    connectSocket();
  } else {
    disconnectSocket();
  }
});
