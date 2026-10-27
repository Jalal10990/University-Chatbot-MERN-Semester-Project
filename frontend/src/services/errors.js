export class ChatApiError extends Error {
  constructor(message) {
    super(message);
    this.name = "ChatApiError";
  }
}