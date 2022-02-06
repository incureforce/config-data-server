class ErrorModel extends Error {
    constructor(message, statusCode = 400, statusMessage = 'Bad Request') {
        super(message);

        this.statusCode = statusCode;
        this.statusMessage = statusMessage;
    }

    statusCode;
    statusMessage;
}

exports.ErrorModel = ErrorModel;
