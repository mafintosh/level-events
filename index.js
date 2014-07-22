var events = require('events')
var eventsdown = require('./eventsdown')

var levents = function(db) {
  var e = new events.EventEmitter()
  db.db = eventsdown(db.db, e)
  db.on('open', function() {
    db.db = eventsdown(db.db, e)
  })
  return e
}

module.exports = levents
