TestPrepare = function (config) {
    this.mongoose = require('mongoose');
    this.fs = require('fs');
    this.test_database = 'my_test_prepare_database';
    this.mongo_host = config.mongo_host;
    this.mongo_user = config.mongo_user || null;
    this.mongo_password = config.mongo_password || null;
    this.mongo_uri = `${this.mongo_host}/${this.test_database}`;
    this.fixtures_path = config.fixtures_path || `${__dirname}/../fixtures`;
};

// Connects on database with config options 
TestPrepare.prototype._connect = function () {
    var base = this;
    if (this.mongoose.connection.readyState == 0) {
        this.mongo = this.mongoose.connect(this.mongo_uri, { user: this.mongo_user, pass: this.mongo_password }, function (err) {
            if (err)
                console.log('Mongo Error =>', err);
            else
                console.log(`Mongo is connected on (${base.mongo_uri})!`);
        });
    }
    else
        this.mongo = this.mongoose;
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
    var base = this;
    for (var fixture of fixtures) {
        this._importFixture(fixture, null, function (fixture) {
            // release callback after import all fixtures
            if (fixture == fixtures[fixtures.length - 1])
                callback();
        });
    }
};

// Imports one fixture, and apply middleware if is defined.
TestPrepare.prototype._importFixture = function (fixture, middleware, callback) {
    var base = this;
    var path = `${this.fixtures_path}/${fixture}.json`;
    this.fs.readFile(path, 'utf8', function (err, data) {
        item = JSON.parse(data);

        if (middleware)
            item = middleware(item);

        base.mongo.model(item.model).insertMany(item.fixtures, function (err, result) {
            if (!err)
                console.log(`Fixture [${fixture}] foi importada.`);
           
            // sets fixture property with fixture imported data
            base[`fixture_${fixture}`] = result;

            callback(fixture);
        });
    });
};

// Drop test database
TestPrepare.prototype._clear = function (done) {
    var isTestPrepareDatabase = this.mongo.connection.name.indexOf('test_prepare') != -1;
    if (isTestPrepareDatabase)
        this.mongo.connection.dropDatabase(done);
    else
        done();
};

// Starts connections, clean database and import fixtures
TestPrepare.prototype.start = function (fixtures, done) {
    var base = this;
    this._connect();
    this._clear(function () {
        base._importFixtures(fixtures, function () {
            done();
        });
    });
};

// Clear Database
TestPrepare.prototype.end = function () {
    this._clear();
};

module.exports = function (config) {
    return new TestPrepare(config);
};