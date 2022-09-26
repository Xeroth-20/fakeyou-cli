import ConfigStore from 'configstore';

const pkg = require('./../../package.json');
const store = new ConfigStore(pkg.name, {
    version: pkg.version,
    voices: null,
    categories: null
});

export default store;
