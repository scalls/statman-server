var curl = require('curl')
var cheerio = require('cheerio')
var http = require('http')

exports.getDiceRoomInfo = function(num, callback) {

  num = parseInt(num)

  if (num < 1 || num > 6) {
    callback('number invalid', null)
  }

  var url = 'http://bindingofisaacrebirth.gamepedia.com/Dice_Room'
  curl.get(url, null, (err, res, body) => {
    const $ = cheerio.load(body)
    /* First, get the list of all of the items */
    var dice_rooms = $('li', 'div .mw-content-ltr').toArray()
    var text = $(dice_rooms[num+3]).text()
    text = text.substring(text.indexOf('-') + 2)

    /* Prepare the JSON for return */
    var res = {
      speech: text,
      displayText: text,
      source: 'bindingofisaacrebirth.gamepedia.com/',
    }
    callback(null, res)
    return
  })
}

exports.getItemInfo = function(item, callback) {

  /* Convert the item to lower case and convert all ASCII-160's to ASCII-32's */
  item = item.toLowerCase()
  while (1) {
    var new_item = item.replace(String.fromCharCode(160), ' ')
    if (new_item == item) { break }
    else { item = new_item }
  }

  /* Corner case: <3 */
  if (item == 'less than 3') { item = '<3' }
  /* Corner case: Odd Mushrooms */
  if (item == 'odd mushroom large') { item = 'odd mushroom (large)'}
  if (item == 'odd mushroom thin') { item = 'odd mushroom (thin)'}


  var url = 'http://bindingofisaacrebirth.gamepedia.com/item'
  curl.get(url, null, (err, res, body) => {
    const $ = cheerio.load(body)
    /* First, get the list of all of the items */
    var actives = $('tr', 'table[data-description="Activated Collectibles"]').toArray()
    var passives = $('tr', 'table[data-description="Passive Collectibles"]').toArray()

    /* Second search through each list to find the specified item */
    var index = -1
    var isActive = false
    var isPassive = false

    /* Loop through the active items */
    for (var i = 1; i < actives.length; i++) {
      var temp_name = $(actives[i]).text().split('\n')[1].toLowerCase().trim()
      if (item == temp_name) {
        console.log('Found active item: ' + temp_name)
        isActive = true
        index = i
        item = $(actives[index]).text().split('\n')
        break
      }
    }

    /* Loop through the passive items, if necessary */
    if (!isActive) {
      for (var i = 1; i < passives.length; i++) {
        var temp_name = $(passives[i]).text().split('\n')[1].toLowerCase().trim()
        if (item == temp_name) {
          console.log('Found passive item: ' + temp_name)
          isPassive = true
          index = i
          item = $(passives[index]).text().split('\n')
          break
        }
      }
    }

    /* Return an error if the item is not found */
    if (index == -1) {
      callback('item (' + item + ') not found', null)
      return
    }

    /* Prepare the JSON for return */
    var res = {
      speech: item[9].trim(),
      displayText: item[9].trim(),
      source: 'bindingofisaacrebirth.gamepedia.com/',
    }
    callback(null, res)
    return

    /* NOTE: after .text().split('\n') on a table item:
              -- Name = [1]
              -- ID = [3]
              -- Icon = [5]
              -- Quote = [7]
              -- Description = [9]
              -- Recharge = [11] (active items only) */
  })

}

exports.getPillInfo = function(pill, callback) {

  var url = 'http://bindingofisaacrebirth.gamepedia.com/Pills'
  curl.get(url, null, (err, res, body) => {
    const $ = cheerio.load(body)
    /* First, get the list of all of the items */
    var pills = $('tr', 'table').toArray()
    var temp_pill = null

    /* NOTE: Pills are indices 3-30, 32-42, 44-51 */
    for (var i = 3; i < 52; i++) {
      if (i == 31 || i == 43) { continue }
      temp_pill = $(pills[i]).text().split('\n')
      if (pill == temp_pill[1].toLowerCase().trim()) { break }
      else { temp_pill = null }
    }

    if (!temp_pill) {
      callback('pill not found', null)
      return
    }

    /* Corner case: Amnesia */
    if (pill == 'amnesia') {
      temp_pill[2] = temp_pill.replace('?', 'question mark')
    }

    /* Prepare the JSON for return */
    var res = {
      speech: temp_pill[2],
      displayText: temp_pill[2],
      source: 'bindingofisaacrebirth.gamepedia.com/',
    }
    callback(null, res)
    return
  })
}

exports.getTrinketInfo = function(trinket, callback) {

  /* Convert the trinket to lower case and convert all ASCII-160's to ASCII-32's */
  trinket = trinket.toLowerCase()
  while (1) {
    var new_trinket = trinket.replace(String.fromCharCode(160), ' ')
    if (new_trinket == trinket) { break }
    else { trinket = new_trinket }
  }

  var url = 'http://bindingofisaacrebirth.gamepedia.com/trinket'
  curl.get(url, null, (err, res, body) => {
    const $ = cheerio.load(body)
    /* First, get the list of all of the items */
    var trinkets = $('tr', 'table[data-description="Trinkets"]').toArray()

    /* Second search through the list to find the specified item */
    var index = -1

    /* Loop through the trinkets */
    for (var i = 1; i < trinkets.length; i++) {
      var temp_name = $(trinkets[i]).text().split('\n')[1].toLowerCase().trim()
      if (trinket == temp_name) {
        console.log('Found trinket: ' + temp_name)
        index = i
        trinket = $(trinkets[index]).text().split('\n')
        break
      }
    }

    console.log('Trinket index: ' + index)
    console.log('Comparing: ' + (index == -1))

    /* Return an error if the item is not found */
    if (index == -1) {
      console.log('No trinket found: sending error...')
      callback('trinket (' + trinket + ') not found', null)
      return
    }

    console.log('Preparing JSON to return...')

    /* Prepare the JSON for return */
    var res = {
      speech: trinket[9].trim(),
      displayText: trinket[9].trim(),
      source: 'bindingofisaacrebirth.gamepedia.com/',
    }
    callback(null, res)
    return

  })

}

exports.sendError = function(err, res) {
  console.error('Cannot process request', err)
  res.status(400).json({
    status: {
      code: 400,
      errorType: err.message
    }
  })
}
