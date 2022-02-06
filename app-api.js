const fs = require('fs');
const crypto = require('crypto');

const JWT = require('./app-jwt');
const Utils = require('./app-utils');

const { ErrorModel } = require("./Models/ErrorModel");

const config = require('./app-config.json');

const apps = config.apps;

exports.apps = apps;

for (const app of Object.keys(apps)) {
    storageRestore(apps[app], app);
}

function storagePersist(app, name) {
    fs.writeFile("./data/" + name + ".json", JSON.stringify(app), (err) => {
        if (err) throw err;
    });
}

function storageRestore(app, name) {
    fs.readFile("./data/" + name + ".json", (err, data) => {
        if (err) throw err;

        Object.assign(app, JSON.parse(data));
    });
}

const core = {};

module.exports = core;

core["secret"] = function secret(ctx) {
    const content = ctx.content;

    const search = new URLSearchParams(content.toString());

    const secret = search.get('secret');

    const hash = crypto.createHash('sha256')
        .update(secret)
        .digest('hex');

    return {
        secret: hash,
    };
};

core["token"] = function token(ctx) {
    const auth = ctx.auth;
    const content = ctx.content;

    const search = new URLSearchParams(content.toString());

    const username = search.get('username');
    const password = search.get('password');

    if (username in config.users) {
        const user = config.users[username];
        const secret = crypto.createHash('sha256')
            .update(password)
            .digest('hex');

        if (user.secret != secret) {
            throw new ErrorModel("E_USER_LOGIN");
        }

        const token = JWT.encodeToken(username, auth.host);

        return {
            token: token
        };
    }

    throw new ErrorModel("E_USER_LOGIN");
};

function perfTracker() {
    const start = performance.now();
    return (res) => {
        const until = performance.now();

        return Object.assign({
            elapsed: until - start
        }, res);
    };
}

core["data"] = function data(ctx) {
    const auth = ctx.auth;
    const content = ctx.content;
    const [data, ...segments] = ctx.segments;
    const perf = perfTracker();

    const host = auth.host;
    const storage = apps[host];
    const storageLeaf = Utils.walk(storage, segments);

    if (ctx.method == 'GET') {
        if (!storageLeaf.next) { // yes no negation
            throw new ErrorModel("E_PATH_NOT_EMPTY", 404, "NOT FOUND");
        }

        return storageLeaf.next;
    }

    const user = config.users[auth.token.user];

    if (auth.success == false || user.projects.indexOf(host) < 0) {
        throw new ErrorModel("E_JWT_TOKEN_INVALID", 401, 'Unauthorized');
    }

    if (ctx.method == 'PUT') {
        if (!storageLeaf.from) {
            throw new ErrorModel("E_PATH_NOT_FOUND", 404, "NOT FOUND");
        }

        const from = storageLeaf.from;

        from[storageLeaf.path] = JSON.parse(content);

        storagePersist(storage, host);

        return perf({
            ok: true,
        });
    }

    if (ctx.method == 'POST') {
        if (!storageLeaf.from) {
            throw new ErrorModel("E_PATH_NOT_FOUND", 404, "NOT FOUND");
        }

        if (storageLeaf.next) { // yes no negation
            throw new ErrorModel("E_PATH_NOT_EMPTY", 404, "NOT FOUND");
        }

        const from = storageLeaf.from;

        from[storageLeaf.path] = JSON.parse(content);

        storagePersist(storage, host);

        return perf({
            ok: true,
        });
    }

    if (ctx.method == 'PATCH') {
        if (!storageLeaf.from) {
            throw new ErrorModel("E_PATH_NOT_FOUND", 404, "NOT FOUND");
        }

        if (!storageLeaf.next) {
            throw new ErrorModel("E_PATH_NOT_FOUND", 404, "NOT FOUND");
        }

        Utils.merge(storageLeaf, JSON.parse(content));

        storagePersist(storage, host);

        return perf({
            ok: true,
        });
    }

    if (ctx.method == 'DELETE') {
        if (!storageLeaf.from) {
            throw new ErrorModel("E_PATH_NOT_FOUND", 404, "NOT FOUND");
        }

        delete storageLeaf.from[storageLeaf.path];

        storagePersist(storage, host);

        return perf({
            ok: true,
        });
    }

    throw new ErrorModel("E_METHOD_NOT_SUPPORTED", 404, "NOT FOUND");
};
