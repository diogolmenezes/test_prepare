TestPrepare = function (options) {
    this.config = require('../config/prepare-config');

    if (!options)
        throw new TypeError(`You have to set options. ${this.config.see_at}`);

    if (!options.mongo_host)
        throw new TypeError(`You have to set mongo_host. ${this.config.see_at}`);

    if (!options.fixtures_path)
        throw new TypeError(`You have to set fixtures_path. ${this.config.see_at}`);

    this.mongoose = require('mongoose');
    this.mongoose.Promise = Promise;
    this.fs = require('fs');
    this.test_database = `my_test_prepare_database_${new Date().getTime()}`;
    this.mongo_host = options.mongo_host;
    this.mongo_user = options.mongo_user || null;
    this.mongo_password = options.mongo_password || null;
    this.mongo_uri = `${this.mongo_host}/${this.test_database}`;
    this.fixtures_path = options.fixtures_path;
    this.verbose = options.verbose || false;

    if (this.verbose)
        this._showStatus();
};

// Logs test prepare info
TestPrepare.prototype._showStatus = function () {
    console.log('');
    console.log('');
    console.log('==========================================');
    console.log('Test Prepare info');
    console.log('==========================================');
    console.log('test_database:', this.test_database);
    console.log('mongo_host:', this.mongo_host);
    console.log('mongo_user:', this.mongo_user);
    console.log('mongo_password:', this.mongo_password);
    console.log('mongo_uri:', this.mongo_uri);
    console.log('fixtures_path:', this.fixtures_path);
    console.log('verbose:', this.verbose);
    console.log('==========================================');
    console.log('');
    console.log('');
};

// Connects on database with config options 
TestPrepare.prototype._connect = function () {
    var base = this;
    return new Promise((resolve, reject) => {
        if (base.mongoose.connection.readyState == 0) {
            base.mongo = base.mongoose.connect(base.mongo_uri, { user: base.mongo_user, pass: base.mongo_password }, function (err) {
                if (err)
                    reject(err);
                else {
                    base._log(`Mongo is connected on (${base.mongo_uri})!`);
                    resolve(base.mongo);
                }
            });
        }
        else {
            // if already connected, use connection and his name.
            base.mongo = base.mongoose;
            base.test_database = base.mongo.connection.name;
            resolve(base.mongo);
        }
    });
};

/* Imports json fixture files
    fixture_name.json
    {
        model: 'model',
        fixtures: [
            {
                obj
            },
            { ... }
        ]
    }
*/
TestPrepare.prototype._importFixtures = function (fixtures) {
    var base = this;
    var promises = [];

    // if dont have fixtures, then resolve
    if (!fixtures || fixtures.length == 0)
        return Promise.resolve();

    // import all fixtures
    for (var fixture of fixtures)
        promises.push(base._importFixture(fixture, null))

    return Promise.all(promises);
};

// Imports one fixture, and apply middleware if is defined.
TestPrepare.prototype._importFixture = function (fixture, middleware) {
    var base = this;
    var path = `${base.fixtures_path}/${fixture}.json`;

    return new Promise((resolve, reject) => {
        base.fs.readFile(path, 'utf8', function (err, data) {
            if (!err) {
                item = JSON.parse(data);

                if (middleware)
                    item = middleware(item);

                base.mongo.model(item.model).insertMany(item.fixtures, function (err, result) {
                    if (!err)
                        base._log(`Fixture [${fixture}] was loaded.`);

                    // sets fixture property with fixture imported data
                    base[`fixture_${fixture}`] = result;

                    resolve(fixture);
                });
            }
            else
                reject(err);
        });
    });
};

// Drop test database
TestPrepare.prototype._clear = function () {
    var base = this;
    return new Promise((resolve, reject) => {
        if (base._isTestPrepareDatabase()) {
            base.mongo.connection.dropDatabase(function () {
                base._log(`The database [${base.test_database}] is now clear.`);
                resolve();
            });
        }
        else
            resolve();
    });
};

// Starts connections, clean database and import fixtures
TestPrepare.prototype.start = function (fixtures) {

    this._log('The test will be prepared now.');

    return new Promise((resolve, reject) => {
        this._connect()
            .then(() => this._clear())
            .then(() => this._importFixtures(fixtures))
            .then(() => resolve());
    })
};

// Clear Database
TestPrepare.prototype.end = function () {
    return this._clear();
};

TestPrepare.prototype._isTestPrepareDatabase = function () {
    var isTestPrepareDatabase = this.mongo.connection.name == this.test_database;
    var isSafeTestDatabaseName = this.test_database.indexOf('test_prepare_database') != -1;

    // is test_database does not have a save name, show a warning!
    if (isTestPrepareDatabase && !isSafeTestDatabaseName)
        this._log(`WARNING! Your test_database name [${this.test_database}] does not have a safe name. You should use default test-prepare name or complete your custom name with test_prepare_database prefix. This action protects your system of acidental database drops.`);

    return isTestPrepareDatabase;
};

// Logs if in verbose mode
TestPrepare.prototype._log = function (text) {
    if (this.verbose && text)
        console.log(`Test Prepare => ${text}`);
};

module.exports = function (config) {
    return new TestPrepare(config);
};