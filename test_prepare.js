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

// Conecta no banco de dados com os dados passados no construtor
// da classe
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
};

/* Importa os arquivos json com os dados, o modelo deve ser
    meu_cenario.json
    {
        model: 'modelo',
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
            // libera o callback depois do import da ultima fixture
            if (fixture == fixtures[fixtures.length - 1])
                callback();
        });
    }
};

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
            else
                console.log(`Erro ao importar fixture [${fixture}] =>`, err);

            console.log('FIXTURE IMPORT ERR =>', err);
            console.log('FIXTURE IMPORT RESULT =>', result);
            // define uma propriedade do prepare com o conteudo da fixture
            base[`fixture_${fixture}`] = result;

            callback(fixture);
        });
    });
};

// Remove o banco de teste
TestPrepare.prototype._clear = function (done) {
    var isTestPrepareDatabase = this.mongo.connection.name.indexOf('test_prepare') != -1;
    if (isTestPrepareDatabase)
        this.mongo.connection.dropDatabase(done);
    else
        done();
};

// Inicia uma conexão, limpa o banco e importa os dados de teste
TestPrepare.prototype.start = function (fixtures, done) {
    var base = this;
    this._connect();
    this._clear(function () {
        base._importFixtures(fixtures, function () {
            done();
        });
    });
};

// Termina o teste limpando o banco de dados
TestPrepare.prototype.end = function () {
    this._clear();
};

module.exports = function (config) {
    return new TestPrepare(config);
};