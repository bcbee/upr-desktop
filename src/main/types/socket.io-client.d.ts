// Minimal ambient types for socket.io-client v2 (the v2 line ships no TypeScript types).
declare module 'socket.io-client' {
  interface Socket {
    on(event: string, listener: (...args: unknown[]) => void): Socket
    emit(event: string, ...args: unknown[]): Socket
    close(): Socket
    connected: boolean
  }

  interface ConnectOpts {
    [key: string]: unknown
  }

  function io(uri: string, opts?: ConnectOpts): Socket

  export = io
}
