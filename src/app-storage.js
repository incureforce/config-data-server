const fs = require('fs');
const path = require('path');

const ENV = require('./app-env');

const APPS_DIR = 'apps';

const core = {
    persist: storagePersist,
    restore: storageRestore,

    config: {},
};

module.exports = core;

const appsPath = path.join(ENV.data, APPS_DIR);
const fullPath = path.join(ENV.data, "app-config.json");

fs.readFile(fullPath, (err, data) => {
    if (err) throw err;

    const config = core.config;

    Object.assign(config, JSON.parse(data));

    fs.mkdirSync(appsPath, { recursive: true });

    const apps = config.apps;

    for (const app of Object.keys(apps)) {
        storageRestore(apps[app], app);
    }
});

function storagePersist(app, name) {
    const fullPath = path.join(appsPath, name + ".json");

    fs.writeFile(fullPath, JSON.stringify(app), (err) => {
        if (err) throw err;
    });
}

function storageRestore(app, name) {
    const fullPath = path.join(appsPath, name + ".json");

    if (!fs.existsSync(fullPath)) {
        return;
    }

    fs.readFile(fullPath, (err, data) => {
        if (err) throw err;

        Object.assign(app, JSON.parse(data));
    });
}