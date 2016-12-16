# Importando a classe no arquivo de teste

var prepare = require('test_prepare')({
    mongo_host: 'host',
    fixtures_path: '/caminho'
});

# Criando um arquivo de fixture pessoas.json

{
    "model": "Pessoa",
    "fixtures": [
        {
             "nome": "diogo"
        },
        {
             "nome": "maria"
        }
    ]
}

# Iniciando uma nova instancia para teste importando a fixture

before(function (done) {
    prepare.start(['pessoas'], function () {
        done();
    });
});

# Iniciando uma nova instancia para teste importando varias fixtures

prepare.start(['pessoas', 'carro', 'telefones'], function () {
    done();
});

# Finalizando 

after(function () {
    prepare.end();
});

# Middleware para manipulação das fixtures

Caso seja necessario alterar um dado de uma fixture antes de importar, basta usar o Middleware

prepare._importFixture('pessoa', function(data) {
    // manipulando a fixture através do middleware, dessa forma o dado incluido no banco já é o novo.
    data.fixtures[0].nome = 'Diogo Menezes';
    return data;
},
function() {
    .... aqui vc faz seu teste ...
    done();
});

# Acessando dados importados das fixtures diretamente pela classe

Sempre que uma fixture é importada, seus dados ficam acessíveis através da propriedade "fixture_nomedafixture" que é exposta no prepare.

prepare.start(['pessoas'], function () {
    done();
});

it('meu teste', function(done) {
    var pessoas = prepare.fixture_pessoas;
    done();
});

