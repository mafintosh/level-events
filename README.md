# level-events

Get an event everytime something is written / read / deleted using levelup. In includes streams support as well.

```
npm install level-events
```

## Usage

``` js
var events = require('level-events')

events(db) // db is a levelup instance
  .on('read', function(key, value) {
    console.log('[read]', key, value)
  })
  .on('write', function(key, value) {
    console.log('[write]', key, value)
  })
  .on('delete', function(key) {
    console.log('[delete]', key)
  })

db.put('hello', 'world', function() {
  db.createReadStream().resume()
})
```

Running the above example will print something like

```
[write] hello world
[read] hello world
```

## License

MIT