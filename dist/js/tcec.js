boardEl = $('#board');
pvBoardEl = $('#pv-board');

var squareToHighlight = '';
var pvSquareToHighlight = '';
var crossTableInitialized = false;
var standTableInitialized = false;
var gameActive = false;

var squareClass = 'square-55d63';

var whiteToPlay = true;
var whiteTimeRemaining = 0;
var blackTimeRemaining = 0;
var whiteTimeUsed = 0;
var blackTimeUsed = 0;
var whiteMoveStarted = 0;
var blackMoveStarted = 0;
var blackClockInterval = '';
var whiteClockInterval = '';

var defaultStartTime = 0;

var viewingActiveMove = true;
var loadedPlies = 0;
var activePly = 0;

var loadedPgn = '';

var activeFen = '';
var lastMove = '';
var currentPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
var bookmove = 0;

var darkMode = 0;
var pageNum = 1;
var gamesDone = 0;
var timeDiff = 0;
var timeDiffRead = 0;
var prevPgnData = 0;

var onMoveEnd = function() {
  boardEl.find('.square-' + squareToHighlight)
    .addClass('highlight-white');
};

var onMoveEndPv = function() {
  pvBoardEl.find('.square-' + pvSquareToHighlight)
    .addClass('highlight-white');
}

function updateAll()
{
   updatePgn();
   setTimeout(function() { updateTables(); }, 5000);
}

function updatePgnData(data, read)
{
    loadedPgn = data;
    timeDiffRead = read;
    setPgn(data);
}

function updatePgn()
{
   axios.get('live.json?no-cache' + (new Date()).getTime())
   .then(function (response) 
   {
      if (timeDiffRead == 0)
      {
         var milliseconds = (new Date).getTime();
         var lastMod = new Date(response.headers["last-modified"]);
         var currTime = new Date(response.headers["date"]);
         timeDiff = currTime.getTime() - lastMod.getTime();
      }
      console.log ("Setting time diff to " + timeDiff);
      prevPgnData = 0;
      updatePgnData(response.data, 0);
   })
   .catch(function (error) {
     // handle error
      console.log(error);
   });
}

function startClock(color, currentMove, previousMove) {
  stopClock('black');
  stopClock('white');

  previousTime = previousMove.tl;
  currentTime = currentMove.tl;

  if (color == 'white') {
    whiteTimeRemaining = Math.ceil(previousTime / 1000) * 1000;
    blackTimeRemaining = Math.ceil(currentTime / 1000) * 1000;

    setTimeRemaining('black', blackTimeRemaining);

    whiteMoveStarted = moment();
    updateClock('white');

    whiteClockInterval = setInterval(function() { updateClock('white') }, 1000);
  } else {
    whiteTimeRemaining = Math.ceil(currentTime / 1000) * 1000;
    blackTimeRemaining = Math.ceil(previousTime / 1000) * 1000;

    setTimeRemaining('white', whiteTimeRemaining);

    blackMoveStarted = moment();

    updateClock('black');

    blackClockInterval = setInterval(function() { updateClock('black') }, 1000);
  }
}

function stopClock(color) {
  if (color == 'white') {
    clearInterval(whiteClockInterval);
  } else {
    clearInterval(blackClockInterval);
  }
}

function updateClock(color) {
  currentTime = moment();

  if (color == 'white') {
    var diff = currentTime.diff(whiteMoveStarted-timeDiff);
    var ms = moment.duration(diff);

    whiteTimeUsed = ms;
    tempTimeRemaning = whiteTimeRemaining - whiteTimeUsed;

    setTimeUsed(color, whiteTimeUsed);
    setTimeRemaining(color, tempTimeRemaning);
  } else {
    var diff = currentTime.diff(blackMoveStarted-timeDiff);
    var ms = moment.duration(diff);

    blackTimeUsed = ms;
    tempTimeRemaning = blackTimeRemaining - blackTimeUsed;

    setTimeUsed(color, blackTimeUsed);
    setTimeRemaining(color, tempTimeRemaning);
  }
}

function secFormatNoH(timeip)
{
    var sec_num = parseInt(timeip/1000, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return minutes+':'+seconds;
}

function secFormat(timeip)
{
    var sec_num = parseInt(timeip/1000, 10); // don't forget the second param
    var hours   = Math.floor(sec_num / 3600);
    var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
    var seconds = sec_num - (hours * 3600) - (minutes * 60);

    if (hours   < 10) {hours   = "0"+hours;}
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    return hours+':'+minutes+':'+seconds;
}

function setTimeRemaining(color, time)
{
  if (time < 0) {
    time = 0;
  }

  if (isNaN(time)) {
    time = defaultStartTime;
  }

  if (viewingActiveMove) {
    $('.' + color + '-time-remaining').html(secFormat(time));
  }
}

function setTimeUsed(color, time) {
  if (viewingActiveMove) {
    $('.' + color + '-time-used').html(secFormatNoH(time));
  }
}

var userCount = 0;
function setUsers(data) 
{
   userCount = data.count;
   try 
   {
      $('#event-overview').bootstrapTable('updateCell', {index: 0, field: 'Viewers', value: userCount});
   }
   catch(err)
   {
      console.log ("Unable to update usercount");
   }
}

function setPgn(pgn)
{
   var currentPlyCount = 0;

   console.log ("Came to setpgn");

   if (pgn.gameChanged)
   {
      console.log ("Came to setpgn need to reread dataa");
      prevPgnData = 0;
   }
   else
   {
      if (prevPgnData)
      {
         console.log ("pgn.Moves.length: " + prevPgnData.Moves.length + ", prevPgnData.lastMoveLoaded" + pgn.lastMoveLoaded);
         if (prevPgnData.Moves.length < pgn.lastMoveLoaded)
         {
            setTimeout(function() { updateAll(); }, 100);
            console.log ("Need to update pgn bcos moves are not in syn");
            return;
         }
         else if (parseFloat(prevPgnData.Headers.Round) != parseFloat(pgn.Headers.Round))
         {
            setTimeout(function() { updateAll(); }, 100);
            console.log ("Need to update pgn because header changed");
            return;
         }
      }
   }

   if (prevPgnData)
   {
      _.each(pgn.Moves, function(move, key) {
         if (typeof move.Moveno != 'undefined' && parseInt(move.Moveno) > 0)
         {
            if (!prevPgnData.Moves[key])
            {
               prevPgnData.Moves.push(pgn.Moves[key]);
            }
         }
      });
      prevPgnData.BlackEngineOptions = pgn.BlackEngineOptions;
      prevPgnData.WhiteEngineOptions = pgn.WhiteEngineOptions;
      prevPgnData.Headers = pgn.Headers;
      pgn = prevPgnData;
      loadedPgn = prevPgnData;
   }
   else
   {
      if (typeof pgn.Moves != 'undefined') 
      {
         prevPgnData = pgn;
      }
   }

   if (typeof pgn.Moves != 'undefined') 
   {
      currentPlyCount = pgn.Moves.length;
   }

  var moveFrom = '';
  var moveTo = '';
  if (typeof pgn.Moves != 'undefined' && pgn.Moves.length > 0) {
    currentPosition = pgn.Moves[pgn.Moves.length-1].fen;
    moveFrom = pgn.Moves[pgn.Moves.length-1].from;
    moveTo = pgn.Moves[pgn.Moves.length-1].to;

    currentGameActive = (pgn.Headers.Termination == 'unterminated');
    whiteToPlay = (currentPlyCount % 2 == 0);
  }

  if (!currentGameActive) {
    stopClock('white');
    stopClock('black');
  }

  if (loadedPlies == currentPlyCount && (currentGameActive == gameActive)) {
    return;
  }

  if (timeDiffRead > 0)
  {
     timeDiff = 0; 
  }

  loadedPlies = currentPlyCount;
  gameActive = currentGameActive;

  if (activePly == 0) {
    activePly = currentPlyCount;
    viewingActiveMove = true;
  }
  if (activePly == currentPlyCount) {
    viewingActiveMove = true;
  }
  if (viewingActiveMove && activePly != currentPlyCount) {
    activePly = currentPlyCount;
  }

  var whiteEval = {};
  var blackEval = {};

  eval = getEvalFromPly(pgn.Moves.length - 1);

  activeFen = pgn.Moves[pgn.Moves.length - 1].fen;
  if (viewingActiveMove) {
    currentMove = pgn.Moves[pgn.Moves.length - 1];
    lastMove = currentMove.to;
    setMoveMaterial(currentMove.material, 0);
  }

  if (!whiteToPlay) {
    whiteEval = eval;
  } else {
    blackEval = eval;
  }

  clockCurrentMove = currentMove;
  clockPreviousMove = '';

  if (pgn.Moves.length > 1) {
    eval = getEvalFromPly(pgn.Moves.length-2);

    selectedMove = pgn.Moves[pgn.Moves.length-2];
    clockPreviousMove = selectedMove;

    if (whiteToPlay) {
      whiteEval = eval;
    } else {
      blackEval = eval;
    }
  }

  if (viewingActiveMove) {
    updateMoveValues(whiteToPlay, whiteEval, blackEval);
    updateEnginePv('white', whiteToPlay, whiteEval.pv);
    updateEnginePv('black', whiteToPlay, blackEval.pv);
  }

  if (whiteToPlay) {
    startClock('white', clockCurrentMove, clockPreviousMove);
  } else {
    startClock('black', clockCurrentMove, clockPreviousMove);
  }

  if (viewingActiveMove) {
    if (pgn.Moves.length > 0) {
      boardEl.find('.' + squareClass).removeClass('highlight-white');
      boardEl.find('.square-' + moveFrom).addClass('highlight-white');
      boardEl.find('.square-' + moveTo).addClass('highlight-white');
      squareToHighlight = moveTo;
    }
    board.position(currentPosition, false);
  }

  if (typeof pgn.Headers == 'undefined') {
    return;
  }

  var title = "TCEC - Live Computer Chess Broadcast";
  if (pgn.Moves.length > 0) {
    title = pgn.Headers.White + ' vs. ' + pgn.Headers.Black + ' - ' + title;
    if (pgn.Moves.PlyCount % 2 == 0 || pgn.Headers.Termination != 'unterminated') {
      $("#favicon").attr("href", "img/favicon.ico");
    } else {
      $("#favicon").attr("href", "img/faviconb.ico");
    }
  }

  $(document).attr("title", title);

  var TC = pgn.Headers.TimeControl.split("+");
  var base = Math.round(TC[0] / 60);
  TC = base + "'+" + TC[1] + '"';
  pgn.Headers.TimeControl = TC;

  defaultStartTime = (base * 60 * 1000);

  var termination = pgn.Headers.Termination;
  if (pgn.Moves.length > 0) {
    var adjudication = pgn.Moves[pgn.Moves.length - 1].adjudication;
    if (termination == 'unterminated' && typeof adjudication != 'undefined') {
      termination = '-';
      var movesToDraw = 50;
      var movesToResignOrWin = 50;
      var movesTo50R = 50;
      if (Math.abs(adjudication.Draw) < 11 && pgn.Moves.length > 34) {
        movesToDraw = Math.abs(adjudication.Draw);
      }
      if (Math.abs(adjudication.ResignOrWin) < 9) {
        movesToResignOrWin = Math.abs(adjudication.ResignOrWin);
      }
      if (adjudication.FiftyMoves < 51) {
        movesTo50R = adjudication.FiftyMoves;
      }

      if (movesToDraw < 50 && movesToDraw <= movesTo50R && movesToDraw <= movesToResignOrWin) {
        if (movesToDraw == 1) {
          termination = movesToDraw + ' ply to draw';
        } else {
          termination = movesToDraw + ' plies to draw';
        }
      }
      if (movesTo50R < 50 && movesTo50R < movesToDraw && movesTo50R < movesToResignOrWin) {
        if(movesTo50R == 1) {
          termination = movesTo50R + ' move to 50mr'
        } else {
          termination = movesTo50R + ' moves to 50mr'
        }
      }
      if (movesToResignOrWin < 50 && movesToResignOrWin < movesToDraw && movesToResignOrWin < movesTo50R) {
        if(movesToResignOrWin == 1) {
          termination = movesToResignOrWin + ' ply to adjudication';
        } else {
          termination = movesToResignOrWin + ' plies to adjudication';
        }
      }

      pgn.Headers.Termination = termination;
    } else {
      pgn.Headers.Termination = pgn.Headers.TerminationDetails;
    }
  }

  $('#event-overview').bootstrapTable('load', [pgn.Headers]);
  $('#event-overview').bootstrapTable('updateCell', {index: 0, field: 'Viewers', value: userCount});
  $('#event-name').html(pgn.Headers.Event);

  if (viewingActiveMove) {
    setInfoFromCurrentHeaders();
  }

  updateChartData();

  $('#engine-history').html('');
  _.each(pgn.Moves, function(move, key) {
    ply = key + 1;
    if (key % 2 == 0) {
      number = (key / 2) + 1;
      var numlink = "<a class='numsmall'>" + number + ". </a>";
      $('#engine-history').append(numlink);
    }
    var linkClass = "";
    if (activePly == ply) {
      linkClass = "active-move"
    }

    if (move.book == true)
    {
       linkClass += " green";
       bookmove = ply;  
    }

    var moveNotation = move.m;
    if (moveNotation.length != 2) {
      moveNotation = move.m.charAt(0) + move.m.slice(1);
    }

    from = move.to;

    var link = "<a href='#' ply='" + ply + "' fen='" + move.fen + "' from='" + move.from + "' to='" + move.to + "' class='change-move " + linkClass + "'>" + moveNotation + "</a>";
    $('#engine-history').append(link + ' ');
  });
  $('#engine-history').append(pgn.Headers.Result);
  $("#engine-history").scrollTop($("#engine-history")[0].scrollHeight);
  console.log ("end Ply is :" + pgn.Moves.length);
}

function copyFen()
{
   Clipboard.copy(currentPosition);
   return false;
}

function setInfoFromCurrentHeaders()
{
  var header = loadedPgn.Headers.White;
  $('.white-engine-name').html(header);
  var name = header;
  if (header.indexOf(' ') > 0) {
    name = header.substring(0, header.indexOf(' '))
  }
  var imgsrc = 'img/engines/' + name + '.jpg';
  $('#white-engine').attr('src', imgsrc);
  $('#white-engine').attr('alt', header);
  header = loadedPgn.Headers.Black;
  $('.black-engine-name').html(header);
  name = header;
  if (header.indexOf(' ') > 0) {
    name = header.substring(0, header.indexOf(' '))
  }
  var imgsrc = 'img/engines/' + name + '.jpg';
  $('#black-engine').attr('src', imgsrc);
  $('#black-engine').attr('alt', header);
}

function getMoveFromPly(ply)
{
  return loadedPgn.Moves[ply];
}

function getEvalFromPly(ply)
{
  selectedMove = loadedPgn.Moves[ply];

  side = 'White';
  if (whiteToPlay) {
    side = 'Black';
  }

  if (ply < 0) 
  {
     return {
       'side': side,
       'eval': "n/a",
       'pv': {},
       'speed': "n/a",
       'nodes': "n/a",
       'mtime': "n/a",
       'depth': "n/a",
       'tbhits': "n/a",
       'timeleft': "n/a"
     };
  } 

  //arun
  if (ply < bookmove || (typeof selectedMove == 'undefined') || (typeof (selectedMove.pv) == 'undefined'))
  {
     return {
       'side': side,
       'eval': "book",
       'pv': {},
       'speed': "book",
       'nodes': "book",
       'mtime': "book",
       'depth': "book",
       'tbhits': "book",
       'timeleft': "book"
     };
  } 

  if (typeof selectedMove == 'undefined') {
    return '';
  }
  clockPreviousMove = selectedMove;
  speed = selectedMove.s;
  if (speed < 1000000) {
    speed = Math.round(speed / 1000) + 'Knps';
  } else {
    speed = Math.round(speed / 1000000) + 'Mnps';
  }

  nodes = selectedMove.n;
  if (nodes < 1000000) {
    nodes = Math.round(nodes / 1000) + 'K';
  } else {
    nodes = Math.round(nodes / 1000000) + 'M';
  }

  var depth = selectedMove.d + '/' + selectedMove.sd;
  var tbHits = 0;
  if (selectedMove.tb) {
    if (selectedMove.tb < 1000000) {
      tbHits = Math.round(selectedMove.tb / 1000) + 'K';
    } else {
      tbHits = Math.round(selectedMove.tb * 1 / 1000000) + 'M';
    }
  }

  return {
    'side': side,
    'eval': selectedMove.wv,
    'pv': selectedMove.pv.Moves,
    'speed': speed,
    'nodes': nodes,
    'mtime': secFormatNoH(selectedMove.mt),
    'depth': depth,
    'tbhits': tbHits,
    'timeleft': secFormat(selectedMove.tl),
  };
}

function updateMoveValues(whiteToPlay, whiteEval, blackEval)
{
   if (!viewingActiveMove) 
   {
      $('.white-time-used').html(whiteEval.mtime);
      $('.black-time-used').html(blackEval.mtime);
   }

   speed = whiteEval.speed;

   $('.white-engine-eval').html(whiteEval.eval);
   $('.white-engine-speed').html(whiteEval.speed);
   $('.white-engine-nodes').html(whiteEval.nodes);
   $('.white-engine-depth').html(whiteEval.depth);
   $('.white-engine-tbhits').html(whiteEval.tbhits);
   updateEnginePv('white', whiteToPlay, whiteEval.pv);
   $('.white-time-remaining').html(whiteEval.timeleft);

   $('.black-engine-eval').html(blackEval.eval);
   $('.black-engine-speed').html(blackEval.speed);
   $('.black-engine-nodes').html(blackEval.nodes);
   $('.black-engine-depth').html(blackEval.depth);
   $('.black-engine-tbhits').html(blackEval.tbhits);
   updateEnginePv('black', whiteToPlay, blackEval.pv);
   $('.black-time-remaining').html(blackEval.timeleft);
}

var whitePv = [];
var blackPv = [];
var livePv = [];
var activePv = [];

function updateEnginePv(color, whiteToPlay, moves)
{
  if (typeof moves != 'undefined') {
    currentMove = Math.floor(activePly / 2);

    if (color == 'white') {
      whitePv = moves;
    } else {
      blackPv = moves;
    }

    keyOffset = 0;
    if (color == 'black' && !whiteToPlay) {
      currentMove -= 2;
      // keyOffset = 1;
    }

    if (!whiteToPlay) {
      currentMove++;
    }
    if (!whiteToPlay && color == "black") {
      currentMove++;
    }
    $('#' + color + '-engine-pv').html('');
    _.each(moves, function(move, key) {
      effectiveKey = key + keyOffset;
      pvMove = currentMove + Math.floor(effectiveKey / 2);
      if (color == "white" && effectiveKey % 2 == 0 ) {
        $('#' + color + '-engine-pv').append(pvMove + '. ');
      }
      
      if (color == "black" && effectiveKey % 2 != 0 ) {
        $('#' + color + '-engine-pv').append(pvMove + '. ');
      }
      
      if (color == "black" && key == 0 ) {
        $('#' + color + '-engine-pv').append(pvMove + '. ');
        $('#' + color + '-engine-pv').append(' .. ');
        currentMove++;
      }

      $('#' + color + '-engine-pv').append("<a href='#' class='set-pv-board' move-key='" + key + "' color='" + color + "'>" + move.m + '</a> ');
    });
  } else {
    $('#' + color + '-engine-pv').html('');
  }
}

$(document).on('click', '.change-move', function(e) {
  clickedPly = $(this).attr('ply');
  clickedFen = $(this).attr('fen');
  moveFrom = $(this).attr('from');
  moveTo = $(this).attr('to');

  $('.active-move').removeClass('active-move');
  $(this).addClass('active-move');

  viewingActiveMove = false;

  boardEl.find('.' + squareClass).removeClass('highlight-white');
  boardEl.find('.square-' + moveFrom).addClass('highlight-white');
  boardEl.find('.square-' + moveTo).addClass('highlight-white');
  squareToHighlight = moveTo;

  board.position(clickedFen, false);
  currentPosition = clickedFen;
  activePly = clickedPly;
  e.preventDefault();
  handlePlyChange(false);

  if (clickedPly == loadedPlies)
  {
     viewingActiveMove = true;
  }  

});

$(document).on('click', '#board-to-first', function(e) {
  activePly = 1;
  handlePlyChange();
  e.preventDefault();
});

$(document).on('click', '#board-previous', function(e) {
  if (activePly > 1) {
    activePly--;
  }
  handlePlyChange();
  e.preventDefault();
});

var isAutoplay = false;

$(document).on('click', '#board-autoplay', function(e) {
  e.preventDefault();
  if (isAutoplay) {
    isAutoplay = false;
    $('#board-autoplay i').removeClass('fa-pause');
    $('#board-autoplay i').addClass('fa-play');
  } else {
    isAutoplay = true;
    $('#board-autoplay i').removeClass('fa-play')
    $('#board-autoplay i').addClass('fa-pause');
    boardAutoplay();
  }
});

function boardAutoplay()
{
  if (isAutoplay && activePly >= 1 && activePly < loadedPlies) {
    activePly++;
    handlePlyChange();
    setTimeout(function() { boardAutoplay(); }, 750);
  } else {
    isAutoplay = false;
    $('#board-autoplay i').removeClass('fa-pause');
    $('#board-autoplay i').addClass('fa-play');
  }
}

$(document).on('click', '#board-next', function(e) {
  if (activePly < loadedPlies) {
    activePly++;
  } else {
    viewingActiveMove = true;
  }
  handlePlyChange();
  e.preventDefault();
});

$(document).on('click', '#board-to-last', function(e) {
  activePly = loadedPlies;
  viewingActiveMove = true;
  handlePlyChange();
  e.preventDefault();
});

$(document).on('click', '#board-reverse', function(e) {
  board.flip();

  newOrientation = board.orientation();

  if (board.orientation() == 'black') {
    oldOrientation = 'white';
  } else {
    oldOrientation = 'black';
  }

  $('.board-bottom-engine-eval.' + oldOrientation + '-engine-name').removeClass(oldOrientation + '-engine-name').addClass(newOrientation + '-engine-name');
  $('.board-bottom-engine-eval.' + oldOrientation + '-time-remaining').removeClass(oldOrientation + '-time-remaining').addClass(newOrientation + '-time-remaining');
  $('.board-bottom-engine-eval.' + oldOrientation + '-time-used').removeClass(oldOrientation + '-time-used').addClass(newOrientation + '-time-used');
  $('.board-bottom-engine-eval.' + oldOrientation + '-engine-eval').removeClass(oldOrientation + '-engine-eval').addClass(newOrientation + '-engine-eval');

  $('.board-top-engine-eval.' + newOrientation + '-engine-name').removeClass(newOrientation + '-engine-name').addClass(oldOrientation + '-engine-name');
  $('.board-top-engine-eval.' + newOrientation + '-time-remaining').removeClass(newOrientation + '-time-remaining').addClass(oldOrientation + '-time-remaining');
  $('.board-top-engine-eval.' + newOrientation + '-time-used').removeClass(newOrientation + '-time-used').addClass(oldOrientation + '-time-used');
  $('.board-top-engine-eval.' + newOrientation + '-engine-eval').removeClass(newOrientation + '-engine-eval').addClass(oldOrientation + '-engine-eval');

  setInfoFromCurrentHeaders();
  handlePlyChange(false);

  e.preventDefault();
});

function handlePlyChange(handleclick) 
{
   if (typeof handleclick == 'undefined')
   {
      handleclick = true;
   }

   whiteToPlay = (activePly % 2 == 0);

   whiteEval = blackEval = '';

   /* Ben: since index starts at 0, active ply should be -1 and -2 to be correct */
   if (whiteToPlay) {
      whiteEval = getEvalFromPly(activePly - 2);
      blackEval = getEvalFromPly(activePly - 1);
   } else {
      blackEval = getEvalFromPly(activePly - 2);
      whiteEval = getEvalFromPly(activePly - 1);
   }

   /* Arun: we should get move from ply - 1 as index starts at 0 */
   currentMove = getMoveFromPly(activePly - 1);

   /* Arun: why do we need to keep swappging the pieces captured */
   if (typeof currentMove != 'undefined') {
    setMoveMaterial(currentMove.material, 0);
   }
   updateMoveValues(whiteToPlay, whiteEval, blackEval);

   if (handleclick)
   {
      $('a[ply=' + activePly + ']').click();
   }
}

var activePvKey = 0;
var activePvColor = '';

$(document).on('click', '.set-pv-board', function(e) {
  $('#v-pills-pv-tab').click();
  moveKey = $(this).attr('move-key') * 1;
  pvColor = $(this).attr('color');

  activePvColor = pvColor;

  if (pvColor == 'white') {
    activePv = whitePv;
    // pvBoard.orientation('white');
  } else if (pvColor == 'black') {
    activePv = blackPv;
    // pvBoard.orientation('black');
  } else {
    activePv = livePv;
    // pvBoard.orientation('white');
  }

  setPvFromKey(moveKey);

  e.preventDefault(); 
});

function setPvFromKey(moveKey)
{
  if (activePv.length < 1) {
    activePvKey = 0;
    return;
  }

  activePvKey = moveKey;

  moveFrom = activePv[moveKey].from;
  moveTo = activePv[moveKey].to;
  fen = activePv[moveKey].fen;

  // $('#pv-board-text').html('');
  // lastMoveNumber = 0;
  // _.each(activePv, function(pv, key) {
  //   currentMoveNumber = pv.fen.substring(pv.fen.lastIndexOf(' '), pv.fen.length);

  //   if (lastMoveNumber == 0 || lastMoveNumber == currentMoveNumber) {
  //     if (lastMoveNumber == 0 && activePvColor == 'black') {
  //       currentMoveNumber--;
  //     }
  //     $('#pv-board-text').append(currentMoveNumber + '. ');
  //   }

  //   lastMoveNumber = currentMoveNumber;
  //   if (key == moveKey) {
  //     $('#pv-board-text').append('<strong>' + pv.m + '</strong> ');
  //   } else {
  //     $('#pv-board-text').append(pv.m + ' ');
  //   }
  // });

  $('.active-pv-move').removeClass('active-pv-move');
  $(this).addClass('active-pv-move');

  viewingActiveMove = false;

  pvBoardEl.find('.' + squareClass).removeClass('highlight-white');
  pvBoardEl.find('.square-' + moveFrom).addClass('highlight-white');
  pvBoardEl.find('.square-' + moveTo).addClass('highlight-white');
  pvSquareToHighlight = moveTo;

  pvBoard.position(fen, false);
}

$('#pv-board-black').click(function(e) {
  activePv = blackPv;
  setPvFromKey(0);
  e.preventDefault();
});

$('#pv-board-white').click(function(e) {
  activePv = whitePv;
  setPvFromKey(0);
  e.preventDefault();
});

$('#pv-board-to-first').click(function(e) {
  setPvFromKey(0);
  e.preventDefault();
});

$('#pv-board-previous').click(function(e) {
  if (activePvKey > 0) {
    setPvFromKey(activePvKey - 1);
  }
  e.preventDefault();
});

var isPvAutoplay = false;

$('#pv-board-autoplay').click(function(e) {
  if (isPvAutoplay) {
    isPvAutoplay = false;
    $('#pv-board-autoplay i').removeClass('fa-pause');
    $('#pv-board-autoplay i').addClass('fa-play');
  } else {
    isPvAutoplay = true;
    $('#pv-board-autoplay i').removeClass('fa-play')
    $('#pv-board-autoplay i').addClass('fa-pause');
    pvBoardAutoplay();
  }
  e.preventDefault();
});

function pvBoardAutoplay()
{
  if (isPvAutoplay && activePvKey >= 0 && activePvKey < activePv.length) {
    setPvFromKey(activePvKey + 1);
    setTimeout(function() { pvBoardAutoplay(); }, 750);
  } else {
    isPvAutoplay = false;
    $('#pv-board-autoplay i').removeClass('fa-pause');
    $('#pv-board-autoplay i').addClass('fa-play');
  }
}

$('#pv-board-next').click(function(e) {
  if (activePvKey < activePv.length) {
    setPvFromKey(activePvKey + 1);
  }
  e.preventDefault();
});

$('#pv-board-to-last').click(function(e) {
  setPvFromKey(activePv.length - 1);
  e.preventDefault();
});

$('#pv-board-reverse').click(function(e) {
  pvBoard.flip();
  e.preventDefault();
});

function setMoveMaterial(material, whiteToPlay)
{
  _.forOwn(material, function(value, key) {
    setPieces(key, value, whiteToPlay);
  })
}

function setPieces(piece, value, whiteToPlay) {
  var target = 'black-material';
  var color = 'b';
  if ((whiteToPlay && value < 0) || (!whiteToPlay && value > 0)) {
    target = 'white-material';
    color = 'w';
  }
  
  value = Math.abs(value);

  $('#white-material span.' + piece).html('');
  $('#black-material span.' + piece).html('');

  for (i = 0; i < value; i++) {
    imgPath = 'img/chesspieces/wikipedia/' + color + piece.toUpperCase() + '.png';
    $('#' + target + ' span.' + piece).append('<img src="' + imgPath + '" class="engine-material" />');
  }
}

function getLinkArch(gameNumber) 
{
   var retLink;

   retLink = "http://tcec.chessdom.com/archive.php";

   return (retLink);
}

function openCross(gamen)
{
   var link = "http://tcec.chessdom.com/archive.php?se=13&di=P&ga=" + gamen;
   window.open(link,'_blank');
}

function schedformatter(value, row, index, field) 
{
   var retStr = value;
   _.each(row, function(valuer, keyr)
   {
      if (keyr.match(/Moves/))
      {
         retStr = '<a title="TBD" style="cursor:pointer; color: red;"onclick="openCross(' + value + ')">' + value + '</a>';
      }
   });
      
   return retStr;
}

var gameArrayClass = ['#39FF14', 'red', 'whitesmoke'];

function setDarkMode(value)
{
   darkMode = value;
   if (!darkMode)
   {
      gameArrayClass = ['black', 'red', '#39FF14'];
   }
   else
   {
      gameArrayClass = ['#39FF14', 'red', 'whitesmoke'];
   }
}

function formatter(value, row, index, field) {
   if (!value.hasOwnProperty("Score")) // true
   {
      return value;
   } 

   var retStr = '';
   var valuex = _.get(value, 'Score');
   var countGames = 0;

   _.each(valuex, function(engine, key) 
   {
      var gameX = parseInt(countGames/2);
      var gameXColor = parseInt(gameX%3);

      if (engine.Result == "0.5")
      {
         engine.Result = "=";
      }
      if (retStr == '')
      {
         retStr = '<a title="TBD" style="cursor:pointer; color: ' + gameArrayClass[gameXColor] + ';"onclick="openCross(' + engine.Game + ')">' + engine.Result + '</a>';
      }
      else
      {
         retStr += ' ' + '<a title="TBD" style="cursor:pointer; color: ' + gameArrayClass[gameXColor] + ';"onclick="openCross(' + engine.Game + ')">' + engine.Result + '</a>';
      }
      countGames = countGames + 1;
   });
  return retStr;
}

function updateCrosstableData(data) 
{
   var crosstableData = data;

   var abbreviations = [];
   var standings = [];

   _.each(crosstableData.Table, function(engine, key) {
     abbreviations = _.union(abbreviations, [{abbr: engine.Abbreviation, name: key}]);
   });

   _.each(crosstableData.Order, function(engine, key) {
     engineDetails = _.get(crosstableData.Table, engine);

     wins = (engineDetails.WinsAsBlack + engineDetails.WinsAsWhite);
     elo = Math.round(engineDetails.Elo);
     eloDiff = engineDetails.Rating + elo;

     var entry = {
       rank: engineDetails.Rank,
       name: engine,
       games: engineDetails.Games,
       points: engineDetails.Score,
       wins: wins + '[' + engineDetails.WinsAsWhite + '/' + engineDetails.WinsAsBlack + ']',
       crashes: engineDetails.Strikes,
       sb: Math.round(engineDetails.Neustadtl* 100) / 100,
       elo: engineDetails.Rating,
       elo_diff: elo + ' [' + eloDiff + ']'
     };

     standings = _.union(standings, [entry]);
   });

   if (!crossTableInitialized) {

     columns = [
       {
         field: 'rank',
         title: 'Rank'
        ,sortable: true
        ,width: '4%'
       },
       {
         field: 'name',
         title: 'Engine'
        ,sortable: true
        ,width: '24%'
       },
       {
         field: 'games',
         title: '# Games'
        ,sortable: true
        ,width: '5%'
       },
       {
         field: 'points',
         title: 'Points'
        ,sortable: true
        ,width: '7%'
       },
       {
         field: 'wins',
         title: 'Wins [W/B]'
        ,width: '10%'
       },
       {
         field: 'crashes',
         title: 'Crashes'
        ,sortable: true
        ,width: '7%'
       },
       {
         field: 'sb',
         title: 'SB'
        ,sortable: true
        ,width: '7%'
       },
       {
         field: 'elo',
         title: 'Elo'
        ,sortable: true
        ,width: '5%'
       },
       {
         field: 'elo_diff',
         title: 'Diff [Live]'
        ,width: '7%'
       }
     ];

     $('#crosstable').bootstrapTable({
       columns: columns
     });
     crossTableInitialized = true;
   }
   $('#crosstable').bootstrapTable('load', standings);
}

function updateCrosstable() 
{
   axios.get('crosstable.json')
   .then(function (response)
   {
      updateCrosstableData(response.data);
   })
   .catch(function (error) 
   {
      // handle error
      console.log(error);
   });
}

function updateScheduleData(data) 
{
   $('#schedule').bootstrapTable('load', data);
   var options = $('#schedule').bootstrapTable('getOptions');
   _.each(data, function(engine, key) 
   {
      if (typeof engine.Moves != 'undefined')
      {
         gamesDone = engine.Game;
      }
   });
   pageNum = parseInt(gamesDone/options.pageSize) + 1;
   $('#schedule').bootstrapTable('selectPage', pageNum);
}

function updateSchedule() 
{
    axios.get('schedule.json')
    .then(function (response) {
      updateScheduleData(response.data);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    });
}

function pad(pad, str) {
  if (typeof str === 'undefined') 
    return pad;
  return (pad + str).slice(-pad.length);
}

window.Clipboard = (function(window, document, navigator) {
    var textArea,
        input,
        copy;

    function isOS() {
        return navigator.userAgent.match(/ipad|iphone/i);
    }

    function createTextArea(text) {
        textArea = document.createElement('textArea');
        textArea.id = "aruntext";
        input = $('#aruntext');
        input.val(text);
        textArea.value = text;
        document.body.appendChild(textArea);
    }

    function selectText() {
        var range,
            selection;

        if (isOS()) {
            var el = input.get(0);
            var editable = el.contentEditable;
            var readOnly = el.readOnly;
            el.contentEditable = true;
            el.readOnly = true;
            var range = document.createRange();
            range.selectNodeContents(el);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            el.setSelectionRange(0, 999999);
            el.contentEditable = editable;
            el.readOnly = readOnly;
        } else {
            textArea.select();
        }
    }

    function copyToClipboard() {
        document.execCommand('copy');
        document.body.removeChild(textArea);
    }

    copy = function(text) {
        createTextArea(text);
        selectText();
        copyToClipboard();
        //$input.blur();
    };

    return {
        copy: copy
    };
})(window, document, navigator);

var btheme = "chess24";
var ptheme = "chess24";

function setBoardInit()
{
   var boardTheme = localStorage.getItem('tcec-board-theme');
   var pieceTheme = localStorage.getItem('tcec-piece-theme');

   if (boardTheme != undefined)
   {
      btheme = boardTheme;
      ptheme = pieceTheme;
   }

   var board =  ChessBoard('board', {
         pieceTheme: window[ptheme + "_piece_theme"],
         position: 'start',
         onMoveEnd: onMoveEnd,
         moveSpeed: 1,
         appearSpeed: 1,
         boardTheme: window[btheme + "_board_theme"]
   });

   $('input[value='+ptheme+']').prop('checked', true);
   $('input[value='+btheme+'b]').prop('checked', true);

   var pvBoard =  ChessBoard('pv-board', {
      pieceTheme: window[ptheme + "_piece_theme"],
      position: 'start',
      onMoveEnd: onMoveEnd,
      moveSpeed: 1,
      appearSpeed: 1,
      boardTheme: window[btheme + "_board_theme"]
   });
   pvBoard.position(fen, false);
   localStorage.setItem('tcec-board-theme', btheme);
   localStorage.setItem('tcec-piece-theme', ptheme);

   return {board,pvBoard};

}

function setBoard()
{
   var fen = board.fen();
   board =  ChessBoard('board', {
      pieceTheme: window[ptheme + "_piece_theme"],
      position: 'start',
      onMoveEnd: onMoveEnd,
      moveSpeed: 1,
      appearSpeed: 1,
      boardTheme: window[btheme + "_board_theme"]
   });
   board.position(fen, false);
   localStorage.setItem('tcec-board-theme', btheme);
   localStorage.setItem('tcec-piece-theme', ptheme);
   $('input[value='+ptheme+']').prop('checked', true);
   $('input[value='+btheme+'b]').prop('checked', true);

   var fen = pvBoard.fen();
   pvBoard =  ChessBoard('pv-board', {
      pieceTheme: window[ptheme + "_piece_theme"],
      position: 'start',
      onMoveEnd: onMoveEnd,
      moveSpeed: 1,
      appearSpeed: 1,
      boardTheme: window[btheme + "_board_theme"]
   });
   pvBoard.position(fen, false);
   localStorage.setItem('tcec-board-theme', btheme);
   localStorage.setItem('tcec-piece-theme', ptheme);
}

function updateTables()
{
  updateSchedule();
  updateCrosstable();
  updateStandtable();
}

function setDark()
{
  $('.toggleDark').find('i').removeClass('fa-moon');
  $('.toggleDark').find('i').addClass('fa-sun');
  $('body').addClass('dark');
  $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat?darkpopout');
  $('#crosstable').addClass('table-dark');
  $('#schedule').addClass('table-dark');
  $('#standtable').addClass('table-dark');
  setDarkMode(1);
}

function setLight()
{
  $('body').removeClass('dark');
  $('.toggleDark').find('i').addClass('fa-moon');
  $('.toggleDark').find('i').removeClass('fa-sun');
  $('input.toggleDark').prop('checked', false);
  $('#crosstable').removeClass('table-dark');
  $('#schedule').removeClass('table-dark');
  $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat');
  $('#standtable').removeClass('table-dark');
  setDarkMode(0);
}

function setDefaultThemes()
{
   var darkMode = localStorage.getItem('tcec-dark-mode');

   if (darkMode == 20) 
   {
      setDark();
   } 
   else 
   {
      setLight();
   }
}

function drawBoards()
{
   var boardTheme = localStorage.getItem('tcec-board-theme');
   var pieceTheme = localStorage.getItem('tcec-piece-theme');

   if (boardTheme != undefined)
   {
      btheme = boardTheme;
      ptheme = pieceTheme;
   } 
   setBoard();
}

function setBoardDefault(boardTheme)
{
   if (boardTheme != undefined)
   {
      btheme = boardTheme;
   }
   setBoard();
}

function setPieceDefault(pTheme)
{
   if (pTheme != undefined)
   {
      ptheme = pTheme;
   }
   setBoard();
}

function updateLiveEvalInit()
{
      $('#live-eval').bootstrapTable({
          columns: [
          {
              field: 'engine',
              title: 'Eng',
              width: '30'
          },
          {
              field: 'eval',
              title: 'Eval',
              width: '20'
          },
          {
              field: 'pv',
              title: 'PV',
              width: '290'
          },
          {
              field: 'depth',
              title: 'Depth',
              width: '20'
          },
          {
              field: 'speed',
              title: 'Speed',
              width: '20'
          },
          {
              field: 'nodes',
              title: 'Nodes',
              width: '20'
          },
          {
              field: 'tbhits',
              title: 'TB',
              width: '20'
          }
        ]
      });
}

function updateLiveEvalData(data) 
{
   var engineData = [];
   _.each(data, function(datum) {
     var score = 0;
     var tbhits = datum.tbhits;
     if (!isNaN(datum.eval))
     {
        score = parseFloat(datum.eval);
     }
     else
     {
        score = datum.eval;
     }

     if (datum.pv.search(/.*\.\.\..*/i) == 0)
     {
      if (!isNaN(score))
      {
        score = parseFloat(score) * -1;
        if (score === 0) {
          score = 0;
        }
      }
     }

     pvs = [];

     console.log(datum.pv);

     if (datum.pv.length > 0 && datum.pv.trim() != "no info") {
      var chess = new Chess(activeFen);

      var currentLastMove = '';
      var currentFen = activeFen;

      datum.pv = datum.pv.replace("...", ". .. ");
      _.each(datum.pv.split(' '), function(move) {
          if (isNaN(move.charAt(0)) && move != '..') {

            chess.move(move);

            console.log(chess.history());

            history = chess.history({ 'verbose': true });

            console.log(history);

            currentLastMove = {'from':'', 'to':''}; //history[history.length - 1];

            newPv = {
              'from': currentLastMove.from,
              'to': currentLastMove.to,
              'm': move,
              'fen': currentFen
            };

            currentFen = chess.fen();
            currentLastMove = move.slice(-2);

            pvs = _.union(pvs, [newPv]);
          }
      });
     }

     if (pvs.length > 0) {
      livePv = pvs;
     }

     if (score > 0) {
      score = '+' + score;
     }

     datum.eval = score;
     tbhits= tbhits.toFixed(0);
     tbhits = tbhits + "k";

     if (datum.pv.length > 0 && datum.pv != "no info") {
      engineData = _.union(engineData, [datum]);
    }
  });

  $('#live-eval-cont').html('');
  _.each(engineData, function(engineDatum) {
    $('#live-eval-cont').append('<h5>' + engineDatum.engine + ' PV ' + engineDatum.eval + '</h5><small>[Depth: ' + engineDatum.depth + ' Speed: ' + engineDatum.speed + ' ' + engineDatum.nodes + ' nodes]</small>');
    var moveCount = 0;
    var moveContainer = [];
    if (livePv.length > 0) {
      _.each(engineDatum.pv.split(' '), function(move) {
        if (isNaN(move.charAt(0)) && move != '..') {
          pvLocation = livePv[moveCount];
          // moveContainer = _.union(moveContainer, ["<a href='#' class='set-pv-board' move-key='" + moveCount + "' color='live'>" + pvLocation.m + '</a>']);
          moveContainer = _.union(moveContainer, [pvLocation.m]);
          moveCount++;
        } else {
          moveContainer = _.union(moveContainer, [move]);
        }
      });
    }
    $('#live-eval-cont').append('<div class="engine-pv alert alert-dark">' + moveContainer.join(' ') + '</div>');
  });


   // $('#live-eval').bootstrapTable('load', engineData);
   // handle success
}

function updateLiveEval() {
   axios.get('data.json')
   .then(function (response) 
   {
      updateLiveEvalData(response.data);
   })
   .catch(function (error) {
      // handle error
      console.log(error);
   });
}

var liveEngineEval = [];

function updateLiveChartData(data) 
{
   if (typeof data.moves != 'undefined') 
   {
      liveEngineEval = data.moves;
      updateChartData();
   } else {
      liveEngineEval = [];
   }
}

function updateLiveChart() 
{
   axios.get('liveeval.json')
   .then(function (response) {
      updateLiveChartData(response.data);
   })
   .catch(function (error) {
      // handle error
      console.log(error);
   });
}

function updateStandtableData(data) 
{
   var standtableData = data;

   var abbreviations = [];
   var standings = [];

   _.each(standtableData.Table, function(engine, key) {
     abbreviations = _.union(abbreviations, [{abbr: engine.Abbreviation, name: key}]);
   });

   _.each(standtableData.Order, function(engine, key) {
     engineDetails = _.get(standtableData.Table, engine);

     wins = (engineDetails.WinsAsBlack + engineDetails.WinsAsWhite);
     elo = Math.round(engineDetails.Elo);
     eloDiff = engineDetails.Rating + elo;

     var entry = {
       rank: engineDetails.Rank,
       name: engine,
     };

     _.each(abbreviations, function (abbreviation) {
       var score2 = '';
       engineName = abbreviation.name;
       engineAbbreviation = abbreviation.abbr;

       engineCount = standtableData.Order.length;
       if (engineCount < 1) {
         engineCount = 1;
       }

       rounds = Math.floor(engineDetails.Games / engineCount) + 1;

       if (engineDetails.Abbreviation == engineAbbreviation) {
         for (i = 0; i < rounds; i++) {
           score2 += '.';
         }
       } else {
         resultDetails = _.get(engineDetails, 'Results');
         matchDetails = _.get(resultDetails, engineName);
         score2 = 
            {
               Score: matchDetails.Scores,
               Text: matchDetails.Text
            }
       }
       _.set(entry, engineAbbreviation, score2);
     });

     standings = _.union(standings, [entry]);
   });

   if (!standTableInitialized) {

     columns = [
       {
         field: 'rank',
         title: 'Rank'
        ,sortable: true
        ,width: '4%'
       },
       {
         field: 'name',
         title: 'Engine'
        ,sortable: true
        ,width: '14%'
       }
     ];
     _.each(standtableData.Order, function(engine, key) {
       engineDetails = _.get(standtableData.Table, engine);
       columns = _.union(columns, [{field: engineDetails.Abbreviation, title: engineDetails.Abbreviation, 
                                    formatter: formatter}]);
     });

     $('#standtable').bootstrapTable({
       columns: columns
     });
     standTableInitialized = true;
   }
   $('#standtable').bootstrapTable('load', standings);
}

function updateStandtable() 
{
   axios.get('crosstable.json')
   .then(function (response)
   {
      updateStandtableData(response.data);
   })
   .catch(function (error) 
   {
      // handle error
      console.log(error);
   });
}

function setLastMoveTime(data)
{
   console.log ("Setting last move time:" + data);
}
