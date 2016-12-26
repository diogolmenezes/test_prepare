TestPrepare = function (options) {
    this.config = require('../config/prepare-config');

    if (!options)
        throw new TypeError(`You have to set options. ${this.config.see_at}`);

    if (!options.mongo_host)
        throw new TypeError(`You have to set mongo_host. ${this.config.see_at}`);

    if (!options.fixtures_path)
        throw new TypeError(`You have to set fixtures_path. ${this.config.see_at}`);

    this.mongoose = require('mongoose');
    this.fs = require('fs');
    this.test_database = `my_test_prepare_database_${new Date().getTime()}`;
    this.mongo_host = options.mongo_host;
    this.mongo_user = options.mongo_user || null;
    this.mongo_password = options.mongo_password || null;
    this.mongo_uri = `${this.mongo_host}/${this.test_database}`;
    this.fixtures_path = options.fixtures_path;
    this.verbose = options.verbose || false;

    if(this.verbose)
        this._log();
};

// logs test prepare info
TestPrepare.prototype._log = function() {
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
    return new Promise((resolve, reject) => {
        var base = this;
        if (this.mongoose.connection.readyState == 0) {
            this.mongo = this.mongoose.connect(this.mongo_uri, { user: this.mongo_user, pass: this.mongo_password }, function (err) {
                if (err)
                    reject(err);
                else
                {
                    if(base.verbose)
                        console.log(`Mongo is connected on (${base.mongo_uri})!`);
                    
                    resolve(this.mongo);
                }
            });
        }
        else
        {
            this.mongo = this.mongoose;
            resolve(this.mongo);
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
TestPrepare.prototype._importFixtures = function (fixtures, callback) {
    var base     = this;
    var promises = [];

    for (var fixture of fixtures)
        promises.push(this._importFixture(fixture, null))

    return Promise.all(promises);    
};

// Imports one fixture, and apply middleware if is defined.
TestPrepare.prototype._importFixture = function (fixture, middleware) {
    return new Promise((resolve, reject) => {
        var base = this;
        var path = `${this.fixtures_path}/${fixture}.json`;
        this.fs.readFile(path, 'utf8', function (err, data) {
            if (!err) {
                item = JSON.parse(data);

                if (middleware)
                    item = middleware(item);

                base.mongo.model(item.model).insertMany(item.fixtures, function (err, result) {
                    if (!err && base.verbose)
                        console.log(`Fixture [${fixture}] was loaded.`);

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
    return new Promise((resolve, reject) => {
        var isTestPrepareDatabase = this.mongo.connection.name.indexOf('test_prepare') != -1;
        if (isTestPrepareDatabase)
            this.mongo.connection.dropDatabase(resolve);
        else
            resolve();
    });    
};

// Starts connections, clean database and import fixtures
TestPrepare.prototype.start = function (fixtures, done) {
    return new Promise((resolve, reject) => {
        this._connect()
            .then(() => this._clear)
            .then(() => this._importFixtures(fixtures))
            .then(() => resolve());
    })
};

// Clear Database
TestPrepare.prototype.end = function () {
    return this._clear();
};

module.exports = function (config) {
    return new TestPrepare(config);
};