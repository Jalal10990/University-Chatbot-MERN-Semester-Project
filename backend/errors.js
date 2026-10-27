// An error we create on purpose. It carries the HTTP status and a machine-readable code.
class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}

module.exports = { AppError };