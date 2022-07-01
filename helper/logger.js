const { createLogger, format, transports } = require('winston');
const fs = require('fs');
const moment = require('moment');
const expressWinston = require('express-winston');
expressWinston.requestWhitelist.push('body');

const filename = () => {
    if (!fs.existsSync(`./logs`)) {
        fs.mkdirSync(`./logs`)
    }
    if (!fs.existsSync(`./logs/${moment().format('YYYY')}`)) {
        fs.mkdirSync(`./logs/${moment().format('YYYY')}`)
    }
    if (!fs.existsSync(`./logs/${moment().format('YYYY')}/${moment().format('MM')}`)) {
        fs.mkdirSync(`./logs/${moment().format('YYYY')}/${moment().format('MM')}`)
    }

    return `./logs/${moment().format('YYYY')}/${moment().format('MM')}/${moment().format('DD')}.log`
}

const logger = {
    process: createLogger({
        format: format.combine(
            format.splat(),
            format.simple()
        ),
        transports: [
            //
            // - Write all logs with importance level of `info` or less to `combined.log`
            //
            new transports.File({ filename: filename() }),
            new transports.Console()
        ],
    }),
    response: expressWinston.logger({
        transports: [
            new transports.File({ filename: filename() })
        ],
        format: format.combine(
            format.timestamp(),
            format.printf((info) => {
                return `${moment().format()} | RES:${JSON.stringify(info.meta.req.id)}:${JSON.stringify(info.meta.req.method)} | ${JSON.stringify(info.meta.req.url)} | ${JSON.stringify(info.meta.req.headers['user-agent'])}:${JSON.stringify(info.meta.req.headers['host'])}:${JSON.stringify(info.meta.req.headers['content-type'])} | ${JSON.stringify(info.meta.res.body)}`;
            })
        ),
        responseWhitelist: [...expressWinston.responseWhitelist, 'body'],
        requestWhitelist: [...expressWinston.requestWhitelist, 'id']
    }),
    request: expressWinston.logger({
        transports: [
            new transports.File({ filename: filename() })
        ],
        format: format.combine(
            format.timestamp(),
            format.printf((info) => {
                return `${moment().format()} | REQ:${JSON.stringify(info.meta.req.id)}:${JSON.stringify(info.meta.req.method)} | ${JSON.stringify(info.meta.req.url)} | ${JSON.stringify(info.meta.req.headers['user-agent'])}:${JSON.stringify(info.meta.req.headers['host'])}:${JSON.stringify(info.meta.req.headers['content-type'])} | ${JSON.stringify(info.meta.req.body) ?? 'no request body'}`
            })
        ),
        requestWhitelist: [...expressWinston.requestWhitelist, 'id', 'body']
    })
}


module.exports = logger;