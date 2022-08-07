const http = require('./http_code');
const response = {
    meta: {
        message: null,
        next: null
    },
    data: null
};

const responseError = {
    meta: {
        message: null
    },
    error: null
}

const responses = {
    success: (res, data = null, message = null) => {
        response.meta.message = message;
        response.data = data;
        res.status(http.SUCCESS).json(response);
    },
    badRequest: (res, error = null, message = null) => {
        responseError.meta.message = 'Invalid Request';
        if (typeof error === 'string') {
            responseError.error = [
                {
                    msg: message
                }
            ];
        } else {
            responseError.error = error;
        }
        res.status(http.BAD_REQUEST).json(responseError);
    },
    internalError: (res, error = null, message = null) => {
        responseError.meta.message = message;
        if (typeof error === 'string') {
            responseError.error = [
                {
                    msg: message
                }
            ];
        } else {
            responseError.error = error;
        }
        res.status(http.INTERNAL_SERVER_ERROR).json(responseError);
    },
    error: (res, httpCode, error = null, message = null) => {
        responseError.meta.message = message;
        if (typeof error === 'string') {
            responseError.error = [
                {
                    msg: message
                }
            ];
        } else {
            responseError.error = error;
        }
        res.status(httpCode).json(responseError);
    }
}

module.exports = responses;