Test-Prepare is a MondoDB test preparer. Is designed to clean and import test fixtures before a test to simulate scenarios and go back to initial stage after test.


# Installation

First install node.js and mongodb. Then

```shell
$ npm install test-prepare --save-dev
```

# Setup

Import test-prepare in your test file.

```javascript
var prepare = require('test-prepare')({
    mongo_host: 'http://localhost:27017',
    fixtures_path: '/path-to-fixtures',
    verbose: true
});
```

## Supported setup options

- mongo_host: Host address of MongoDB, required
- mongo_user: User of MongoDB, not required
- mongo_password: Password of MongoDB, not required
- fixtures_path: Phisical path of fixtures folder, required. `Ex: ${__dirname}/../fixtures`
- verbose: Enable verbose mode. This will log test prepare info and feedbacks about connection and fixtures imports. Default is false.


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
    prepare.start(['fixture_file_name_without_extension', 'other_fixture_file_name_without_extension', '...']).then(done);
});
```

So if you want to import your fixture file people.json:

```javascript
before(function (done) {
    prepare.start(['people']).then(done);
});
```

And importing many fixtures:

```javascript
before(function (done) {
    prepare.start(['people', 'cars', 'telephones']).then(done);
});
```

# Dropping database after test

After test you can clean test data ro reset your test scenario. This uill drop test-prepare temporary database.

```javascript
after(function (done) {
    prepare.end().then(done);
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
})
.then(() => {
    //.... here on callback, you make your test asserts ...
    var result = example_get_by_name('Jhon Doe');
    expect(result.length).to.be.equal(1);
    done();
});
```

# Accessing fixture data 

Whenever a fixture is imported, its data is accessible through the fixture_fixtureName property that is exposed in the test-prepare object.

```javascript
beforeEach(function (done) {
    prepare.start(['people', 'cars']).then(done);
});

it('my test', function(done) {
    var people = prepare.fixture_people;
    var cars   = prepare.fixture_cars;
    done();
});
```

