Test-Prepare is a MondoDB test preparer. Is designed to clean and import test fixtures before a test to simulate scenarios and go back to initial stage after test.

# Installation

First install node.js and mongodb. Then

```shell
$ npm install test-prepare
```

# Setup

Import test-prepare in your test file.

```javascript
var prepare = require('test-prepare')({
    mongo_host: 'host',
    fixtures_path: '/path-to-fixtures'
});
```

## Supported setup options

- mongo_host: Host address of MongoDB, required
- mongo_user: User of MongoDB, not required
- mongo_password: Password of MongoDB, not required
- test_database: Name of temporary test database tha will be created by test-prepare, not required. Default my_test_prepare_database
- fixtures_path: Phisical path of fixtures folder, required. `Ex: ${__dirname}/../fixtures`


# Create fixture file 

Inside fixtures folder, create a fixture file that will be imported to the test database.

- model: Name od MongoDB collection
- fixtures: Array of data that will be imported

Example, people.json:

```json
{
    "model": "People",
    "fixtures": [
        {
             "name": "Jhon",
             "age": 31
        },
        {
             "name": "Michael",
             "age": 25
        }
    ]
}
```
# Prepare database before test

```javascript
before(function (done) {
    prepare.start(['fixture_file_name_without_extension', 'other_fixture_file_name_without_extension', '...'], function () {
        done();
    });
});
```

So if you want to import your fixture file people.json:

```javascript
before(function (done) {
    prepare.start(['people'], function () {
        done();
    });
});
```

And importing many fixtures:

```javascript
before(function (done) {
    prepare.start(['people', 'cars', 'telephones'], function () {
        done();
    });
});
```

# Dropping database after test

After test you can clean test data ro reset your test scenario. This uill drop test-prepare temporary database.

```javascript
after(function () {
    prepare.end();
});
```

# Change fixture data before import

If you want change fixture data before import to the database, you can use the middleware function.

prepare._importFixture('people', middleware, callback);

```javascript
prepare._importFixture('people', function(data) {
    // change fixture data  through middleware then import to the database.
    data.fixtures[0].name = 'Jhon Doe';
    return data;
},
function() {
    //.... here on callback, you make your test asserts ...
    var result = example_get_by_name('Jhon Doe');
    expect(result.length).to.be.equal(1);
    done();
});
```

# Accessing fixture data 

Whenever a fixture is imported, its data is accessible through the fixture_fixtureName property that is exposed in the test-prepare object.

```javascript
prepare.start(['people', 'cars'], function () {
    done();
});

it('my test', function(done) {
    var people = prepare.fixture_people;
    var cars   = prepare.fixture_cars;
    done();
});
```

