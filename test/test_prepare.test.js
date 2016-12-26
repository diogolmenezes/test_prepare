"use strict"

var expect = require('chai').expect;
var sinon = require('sinon');
var config = require('../config/prepare-config');
var test_config = require('./util/test_config');

require('./util/people_model');

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
        let prepare = require('../lib/test_prepare')({
            mongo_host: test_config.mongo_host,
            fixtures_path: `${__dirname}/fixtures`
        });

        it('Must define mongo_host', (done) => {
            expect(prepare.mongo_host).to.be.equal(test_config.mongo_host);
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
    });

    describe('Drop workflow', () => {
        let prepare = require('../lib/test_prepare')({
            mongo_host: test_config.mongo_host,
            fixtures_path: `${__dirname}/fixtures`
        });

        before((done) => {
            prepare.start().then(done);
        });

        it('Must drop mongo database', (done) => {
            prepare._clear()
                .then(() => {
                    expect(prepare.mongo).to.be.ok;
                    done();
                });
        });

        it('Must write drop log if verbose mode', (done) => {
            var spy = sinon.spy(console, 'log');
            prepare.verbose = true;
            prepare._clear()
                .then(() => {
                    expect(spy.calledWith(`Test Prepare => The database [${prepare.test_database}] is now clear.`)).to.be.ok;
                    spy.restore();
                    prepare.verbose = false;
                    done();
                });
        });
    });

    describe('Start workflow', () => {
        let prepare = require('../lib/test_prepare')({
            mongo_host: test_config.mongo_host,
            fixtures_path: `${__dirname}/fixtures`
        });

        it('Start must call _connect', (done) => {
            var spy = sinon.spy(prepare, '_connect');
            prepare.start().then(() => {
                expect(spy.calledOnce).to.be.ok;
                spy.restore();
                done();
            });
        });

        it('Start must call _clear', (done) => {
            var spy = sinon.spy(prepare, '_clear');
            prepare.start().then(() => {
                expect(spy.calledOnce).to.be.ok;
                spy.restore();
                done();
            });
        });

        it('Start must call _importFixtures', (done) => {
            var spy = sinon.spy(prepare, '_importFixtures');
            prepare.start().then(() => {
                expect(spy.calledOnce).to.be.ok;
                spy.restore();
                done();
            });
        });

        it('Start must call _importFixtures with fixtures', (done) => {
            var spy = sinon.spy(prepare, '_importFixtures');
            prepare.start(['people']).then(() => {
                expect(spy.calledWith(['people'])).to.be.ok;
                spy.restore();
                done();
            });
        });

        it('Must write start log if verbose mode', (done) => {
            var spy = sinon.spy(console, 'log');
            prepare.verbose = true;
            prepare.start().then(() => {
                expect(spy.calledWith('Test Prepare => The test will be prepared now.')).to.be.ok;
                spy.restore();
                prepare.verbose = false;
                done();
            });
        });
    });

    describe('End workflow', () => {
        let prepare = require('../lib/test_prepare')({
            mongo_host: test_config.mongo_host,
            fixtures_path: `${__dirname}/fixtures`
        });

        before((done) => {
            prepare.start().then(done);
        });

        it('End must call _clear', (done) => {
            var spy = sinon.spy(prepare, '_clear');

            prepare.end().then(() => {
                expect(spy.calledOnce).to.be.ok;
                spy.restore();
                done();
            });
        });
    });

    describe('Log', () => {
        let prepare = require('../lib/test_prepare')({
            mongo_host: test_config.mongo_host,
            fixtures_path: `${__dirname}/fixtures`
        });

        it('Must use [Test Prepare =>] prefix', (done) => {
            var spy = sinon.spy(console, 'log');
            prepare.verbose = true;
            prepare._log('My Log');
            expect(spy.calledWith('Test Prepare => My Log')).to.be.ok;
            spy.restore();
            prepare.verbose = false;
            done();
        });

        it('Must not log if vebose is false', (done) => {
            var spy = sinon.spy(console, 'log');
            prepare.verbose = false;
            prepare._log('My Log');
            expect(spy.callCount).to.be.equal(0);
            spy.restore();
            done();
        });
    });

    describe('Fixtures', () => {
        let prepare = require('../lib/test_prepare')({
            mongo_host: test_config.mongo_host,
            fixtures_path: `${__dirname}/fixtures`
        });

        beforeEach((done) => {
            prepare.start(['people']).then(done);
        });

        afterEach((done) => {
            prepare.end().then(done);
        });

        it('Must import fixture', (done) => {
            prepare.mongo.model('People')
                .find({}, function (err, result) {
                    expect(result.length).to.be.equal(2);
                    done();
                });
        });

        it('Must import fixture with right data', (done) => {
            prepare.mongo.model('People')
                .find({}, function (err, result) {
                    expect(result[0].name).to.be.equal('Jhon Snow');
                    done();
                });
        });

        it('Must create property with fixture data when import fixture', (done) => {
            expect(prepare.fixture_people.length).to.be.equal(2);
            done();
        });

        it('Must create property with right fixture data when import fixture', (done) => {
            expect(prepare.fixture_people[0].name).to.be.equal('Jhon Snow');
            expect(prepare.fixture_people[1].name).to.be.equal('Tyrion Lannister');
            done();
        });

        it('Must write fixture import log if verbose mode', (done) => {
            var spy = sinon.spy(console, 'log');
            prepare.verbose = true;
            prepare._importFixture('people', null).then(() => {
                expect(spy.calledWith('Test Prepare => Fixture [people] was loaded.')).to.be.ok;
                spy.restore();
                prepare.verbose = false;
                done();
            });
        });
    });

});