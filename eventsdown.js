var util = require('util')
var abstract = require('abstract-leveldown')

var noop = function() {}

var notNumber = function(n) {
  return typeof n === 'number' ? n.toString() : n
}

var EventsIterator = function(ite, events) {
  this._iterator = ite
  this._events = events
}

EventsIterator.prototype.next = function(cb) {
  var events = this._events
  this._iterator.next(cb && function(err, key, value) {
    if (err) return cb(err)
    if (key !== undefined) events.emit('read', key, value)
    cb.apply(null, arguments)
  })
}

EventsIterator.prototype.end = function(cb) {
  this._iterator.end(cb)
}

var EventsDown = function(down, events) {
  if (!(this instanceof EventsDown)) return new EventsDown(down, events)
  this._down = down
  this._events = events
  abstract.AbstractLevelDOWN.call(this, down.location || 'no-location')
}

util.inherits(EventsDown, abstract.AbstractLevelDOWN)

EventsDown.prototype.open = function() {
  this._down.open.apply(this._down, arguments)
}

EventsDown.prototype.close = function() {
  this._down.close.apply(this._down, arguments)
}

EventsDown.prototype.setDb = function() {
  this._down.setDb.apply(this._down, arguments)
}

EventsDown.prototype.put = function(key, value, opts, cb) {
  if (typeof opts === 'function') return this.put(key, value, null, opts)
  if (!opts) opts = {}

  var events = this._events
  this._down.put(key, value, opts, cb && function(err, val) {
    if (err) return cb(err)
    events.emit('write', key, notNumber(value))
    cb(err, val)
  })
}

EventsDown.prototype.get = function(key, opts, cb) {
  if (typeof opts === 'function') return this.get(key, null, opts)
  if (!opts) opts = {}

  var events = this._events
  this._down.get(key, opts, cb && function(err, value) {
    if (err) return cb(err)
    events.emit('read', key, value)
    cb(err, value)
  })
}

EventsDown.prototype.del = function(key, opts, cb) {
  if (typeof opts === 'function') return this.del(key, null, opts)
  if (!opts) opts = {}

  var events = this._events
  this._down.del(key, opts, cb && function(err, value) {
    if (err) return cb(err, value)
    events.emit('delete', key)
    cb(err, value)
  })
}

EventsDown.prototype.batch = EventsDown.prototype._batch = function(operations, opts, cb) {
  if (arguments.length === 0) return new abstract.AbstractChainedBatch(this)

  if (typeof opts === 'function') return this.batch(operations, null, opts)
  if (!opts) opts = {}

  var events = this._events
  this._down.batch(operations, opts, cb && function(err, value) {
    if (err) return cb(err)
    for (var i = 0; i < operations.length; i++) {
      var o = operations[i]
      if (o.type === 'del') events.emit('delete', o.key)
      if (o.type === 'put') events.emit('write', o.key, notNumber(o.value))
    }
    cb(err, value)
  })
}

EventsDown.prototype.approximateSize = function(start, end, cb) {
  this._down.approximateSize.apply(this._down, arguments)
}

EventsDown.prototype.getProperty = function() {
  return this._down.getProperty.apply(this._down, arguments)
}

EventsDown.prototype.destroy = function() {
  return this._down.destroy.apply(this._down, arguments)
}

EventsDown.prototype.repair = function() {
  return this._down.repair.apply(this._down, arguments)
}

EventsDown.prototype.iterator = function(opts) {
  return new EventsIterator(this._down.iterator(opts), this._events)
}

module.exports = EventsDown