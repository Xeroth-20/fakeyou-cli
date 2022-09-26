import store from "./../util/store";

function getVersion(): string {
    const pkg = require('./../../package.json');
    let version: string = store.get('version');

    // Check current stored version
    if (version !== pkg.version) {
        version = pkg.version;
        store.set('version', version);
    }

    return version;
}

export default {
    getVersion
};
