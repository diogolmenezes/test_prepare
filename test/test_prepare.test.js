var expect = require('chai').expect;
var config = require('../config/prepare-config');

describe('Test Prepare', () => {

    describe('Without options', () => {
        it('Must set options', (done) => {
            expect(() => require('../lib/test_prepare')()).to.throw(TypeError, `You have to set options. ${config.see_at}`);
            done();
        });

        it('Must set mongo_host options', (done) => {
            expect(() => require('../lib/test_prepare')({
                fixtures_path: 'path'
            })).to.throw(TypeError, `You have to set mongo_host. ${config.see_at}`);
            done();
        });

        it('Must set fixtures_path options', (done) => {
            expect(() => require('../lib/test_prepare')({
                mongo_host: 'host'
            })).to.throw(TypeError, `You have to set fixtures_path. ${config.see_at}`);
            done();
        });
    });

    describe('With Options', () => {
        var prepare = require('../lib/test_prepare')({
            mongo_host: 'mongodb://localhost:27017',
            fixtures_path: `${__dirname}/fixtures`
        });

        it('Must define mongo_host', (done) => {
            expect(prepare.mongo_host).to.be.equal('mongodb://localhost:27017');
            done();
        });

        it('Must define fixtures_path', (done) => {
            expect(prepare.fixtures_path).to.be.equal(`${__dirname}/fixtures`);
            done();
        });

        it('Must have test_database property', (done) => {
            expect(prepare.test_database).to.contain('my_test_prepare_database_');
            done();
        });

        it('Must compose mongo_uri property', (done) => {
            expect(prepare.mongo_uri).to.contain(`${prepare.mongo_host}/${prepare.test_database}`);
            done();
        });

        it('Must connect on mongo', (done) => {
            prepare._connect()
                .then(() => {
                    expect(prepare.mongo).to.be.ok;
                    done();
                });                
        });

         it('Must drop mongo database', (done) => {
            prepare._clear()
                .then(() => {
                    expect(prepare.mongo).to.be.ok;
                    done();
                });                
        });
    });

});