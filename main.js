var libcal = require('libcal-events')
var hyperglue = require('hyperglue')
var buttons = document.querySelector('.time-travel')
var headerDate = document.querySelector('.date')
var roomsContainer = document.querySelector('.rooms-container')
var counter = 0

document.addEventListener('DOMContentLoaded', function () {
  generateAgenda()
})

document.addEventListener('click', handleClick)

function handleClick (ev) {
  if (ev.target.nodeName !== 'BUTTON') return

  ev.preventDefault()
  var target = ev.target
  var dir = target.dataset.direction

  roomsContainer.innerHTML = ''

  var interval = dir === 'back' ? -1 : dir === 'frwd' ? 1 : 0
  return generateAgenda(interval)
}

function generateAgenda (interval) {
  var IID = 814
  var CALID = 2633
  var calopts = {
    iid: IID,
    calendar: [CALID],
    base_url: 'http://libapp.muhlenberg.edu/hours-proxy',
  }
  var date_arr = dateArr(new Date())
  var newdate

  if (interval === void 0)
    interval = 0

  counter += interval
  date_arr[2] += counter
  newdate = dateArrToString(date_arr)
  headerDate.textContent = headerDisplayText(dateArrToDate(date_arr))

  calopts['start'] = calopts['end'] = newdate

  return libcal(calopts, handleEvents)
}

function headerDisplayText (date) {
  var day = date.getDate()
  var dow, month

  switch (date.getDay()) {
    case 0: dow = 'Sunday'; break
    case 1: dow = 'Monday'; break
    case 2: dow = 'Tuesday'; break
    case 3: dow = 'Wednesday'; break
    case 4: dow = 'Thursday'; break
    case 5: dow = 'Friday'; break
    case 6: dow = 'Saturday'; break
  }

  switch (date.getMonth()) {
    case 0: month = 'January'; break
    case 1: month = 'February'; break
    case 2: month = 'March'; break
    case 3: month = 'April'; break
    case 4: month = 'May'; break
    case 5: month = 'June'; break
    case 6: month = 'July'; break
    case 7: month = 'August'; break
    case 8: month = 'September'; break
    case 9: month = 'October'; break
    case 10: month = 'November'; break
    case 11: month = 'December'; break
  }

  return dow + ', ' + month + ' ' + day
}

function dateArrToString (da) {
  var d = dateArrToDate(da)

  return [
    d.getFullYear(),
    zeropad(d.getMonth() + 1),
    zeropad(d.getDate())
  ].join('-')

  function zeropad (d) {
    return String(d).length < 2 ? ('0' + d) : d
  }
}

function dateArrToDate (da) {
  return new Date(da[0], (da[1] - 1), da[2])
}

function dateArr (d) {
  return [d.getFullYear(), d.getMonth() + 1, d.getDate()]
}

function handleEvents (err, data) {
  if (typeof data === 'string') data = JSON.parse(data)
  var rooms = roomify(data)
  var roomCount = Object.keys(rooms).length

  var target = document.querySelector('.rooms-container')

  for (var room in rooms) {
    rooms[room].width = 100 / roomCount
    target.appendChild(handleRoom(room, rooms[room]))
  }
}

function roomify (d) {
  var out = {}
  for (var i = 0; i < d.length; i++) {
    var e = d[i]
    if (out[e.location])
      out[e.location].events.push(e)
    else
      out[e.location] = {events: [e]}
  }
  return out
}

function handleRoom (name, data) {
  var html = '<div class="room">'
  + '<h1 class="room-name"></h1>'
  + '<div class="events"></div>'
  + '</div>'
  var events = ''

  data.events.forEach(function (d) {
    var el = generateEventEl(d)
    events += el.outerHTML
  })

  return hyperglue(html, {
    '.room': {
      style: 'width:' + data.width + '%'
    },
    '.room-name': name,
    '.events': {
      _html: events
    }
  })
}

function generateEventEl (data) {
  var html = '<div class="event">'
  + '<h3 class="event-title"></h3>'
  + '<div class="event-meta">'
  + '<p class="event-presenter"></p>'
  + '<p class="event-time"></p>'
  + '</div>'
  + '</div>'

  return hyperglue(html, {
    '.event-presenter': data.pres,
    '.event-title': data.title,
    '.event-time': formatTime(data.start, data.end)
  })
}

function formatTime (start, end) {
  var fstart, fend
  var allDay = /^\d{4}\-\d{2}\-\d{2}$/.test(start)

  if (allDay || (!start && !end))
    fstart = 'All day'
  else if (!start && end)
    fstart = 'Ends at ' + format(end)
  else if (start && !end)
    fstart = 'Starts at ' + format(start)
  else {
    fstart = format(start)
    fend = format(end)
  }

  return fstart + (fend ? (' - ' + fend) : '')

  function format (time) {
    var replaced = time.replace('T', ' ')
    var parsed = Date.parse(replaced)

    if (Number.isNaN(parsed)) parsed = Date.parse(time)

    var t = new Date(parsed)
    if (Number.isNaN(t)) return null

    var h = t.getHours()
    var hh = h % 12
    var hr = hh === 0 ? 12 : hh
    var m = t.getMinutes()

    if (m.toString().length < 2) m = '0' + m

    var ampm = h < 12 ? 'am' : 'pm'

    return hr + ':' + m + ampm
  }
}
