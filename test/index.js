var test = require('tape')
var memdown = require('memdown')
var levelup = require('levelup')
var events = require('events')
var install = require('../')
var eventsdown = require('../eventsdown')
var testCommon = require('./common')
var testBuffer = new Buffer('this-is-test-data')

var down = function(loc) {
  return eventsdown(memdown(loc), new events.EventEmitter())
}

/*** compatibility with basic LevelDOWN API ***/

require('abstract-leveldown/abstract/open-test').args(down, test, testCommon)
require('abstract-leveldown/abstract/open-test').open(down, test, testCommon)
require('abstract-leveldown/abstract/del-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/get-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/put-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/put-get-del-test').all(down, test, testCommon, testBuffer)
require('abstract-leveldown/abstract/batch-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/close-test').close(down, test, testCommon)
require('abstract-leveldown/abstract/iterator-test').all(down, test, testCommon)
require('abstract-leveldown/abstract/ranges-test').all(down, test, testCommon)

test('put event', function(t) {
  var db = levelup('test', {db:down})
  install(db).on('write', function(key, value) {
    t.same(key, 'test')
    t.same(value, 'test-value')
    t.end()
  })
  db.put('test', 'test-value')
})

test('get event', function(t) {
  var db = levelup('test', {db:down})
  install(db).on('write', function(key, value) {
    t.same(key, 'test')
    t.same(value, 'test-value')
    t.end()
  })
  db.put('test', 'test-value', function() {
    db.get('test', function() {})
  })
})

test('del event', function(t) {
  var db = levelup('test', {db:down})
  install(db).on('delete', function(key) {
    t.same(key, 'test')
    t.end()
  })
  db.put('test', 'test-value', function() {
    db.del('test', function() {})
  })
})

test('get event from streams', function(t) {
  var db = levelup('test', {db:down})
  install(db).on('read', function(key) {
    t.same(key, 'test')
    t.end()
  })
  db.put('test', 'test-value', function() {
    db.createReadStream().resume()
  })
})

test('put event from streams', function(t) {
  var db = levelup('test', {db:down})
  install(db).on('write', function(key) {
    t.same(key, 'test')
    t.end()
  })
  var ws = db.createWriteStream()
  ws.write({key:'test', value:'test-value'})
  ws.end()
})

test('batch', function(t) {
  t.plan(3)
  var db = levelup('test', {db:down})
  install(db)
    .on('write', function(key, value) {
      t.same(key, 'test-put')
      t.same(value, 'test-value')
    })
    .on('delete', function(key) {
      t.same(key, 'test-del')
    })

  db.batch([{
    type: 'put',
    key: 'test-put',
    value: 'test-value'
  }, {
    type: 'del',
    key: 'test-del'
  }])
})