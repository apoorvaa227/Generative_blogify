
class CustomAPIError extends Error {
    public statusCode: number;
  
    constructor(message: string, statusCode: number) {
      super(message);
      this.statusCode = statusCode;
  
      // Maintains proper stack trace for where our error was thrown (only available on V8)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
  
      this.name = this.constructor.name;
    }
  }
  
  export default CustomAPIError;
  