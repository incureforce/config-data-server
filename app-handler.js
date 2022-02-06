const JWT = require('./app-jwt');
const API = require("./app-api");

const { ErrorModel } = require("./Models/ErrorModel");

const authBearerPattern = /Bearer (.+)/i

const core = {
    async handle(req, res) {
        const data = await wrap(req, res);

        const json = JSON.stringify(data);

        res.setHeader('content-type', 'application/json');
        res.write(json);
        res.end()
    }
};

module.exports = core;

const production = (process.env.NODE_ENV || 'production') != 'development';

async function wrap(req, res) {
    try {
        const ctx = await decodeRequest(req);

        const segments = ctx.segments;
        const [segment] = segments;

        for (const pattern of Object.keys(API)) {
            if (segment.match(pattern)) {
                const func = API[pattern];

                return func(ctx);
            }
        }

        throw new ErrorModel("E_ROUTE_NOT_FOUND");
    }
    catch ($err) {
        res.statusCode = $err.statusCode || 500;
        res.statusMessage = $err.statusMessage || 'Internal Server Error';

        if (production) {
            return {
                message: $err.message,
            };    
        }
        else {
            return {
                message: $err.message,
                stack: $err.stack,
            };
        }
    }
}

function waitForBody(req) {
    return new Promise((resolve, error) => {
        const buffers = [];

        req.on('data', chunk => {
            buffers.push(chunk);
        })
        req.on('end', () => {
            const buffer = Buffer.concat(buffers);

            resolve(buffer);
        })
    })
}

async function decodeRequest(req) {
    const url = req.url;

    const vars = {
        final: url.length,
        search: { start: url.indexOf('?'), count: 0 },
        segments: { start: 1, count: 0 },
    };

    if (vars.search.start > 0) {
        vars.search.count = vars.final;
        vars.final = vars.search.start;

        vars.search.start++;
    }

    vars.segments.count = vars.final;
    vars.final = 0;

    const search = url.substring(vars.search.start, vars.search.count);
    const segments = url.substring(vars.segments.start, vars.segments.count);

    const auth = {
        success: false,
        host: null,
    };

    if ('host' in req.headers) {
        const header = req.headers['host'];

        auth.host = header;
    }

    if ('authorization' in req.headers) {
        const header = req.headers['authorization'];
        const bearerToken = header.match(authBearerPattern);

        if (bearerToken) {
            auth.token = JWT.decodeToken(bearerToken[1], auth.host);
            auth.success = true;
        }
    }

    const content = await waitForBody(req);

    return {
        segments: segments.split('/'),
        content: content,
        method: req.method,
        search: new URLSearchParams(search),
        auth: auth,
    };
}


