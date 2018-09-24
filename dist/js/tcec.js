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
var playSound = 1;

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

   if (!prevPgnData)
   {
      updateEngineInfo('#whiteenginetable', '#white-engine-info', data.WhiteEngineOptions);
      updateEngineInfo('#blackenginetable', '#black-engine-info', data.BlackEngineOptions);
   }
   else
   {
      if (data.WhiteEngineOptions != prevPgnData.WhiteEngineOptions)
      {
         updateEngineInfo('#whiteenginetable', '#white-engine-info', data.WhiteEngineOptions);
      }
      if (data.BlackEngineOptions != prevPgnData.BlackEngineOptions)
      {
         updateEngineInfo('#blackenginetable', '#black-engine-info', data.BlackEngineOptions);
      }
   }
   setPgn(data);
}

function updatePgn(resettime)
{
   if (resettime != undefined)
   {
      timeDiffRead = 0;
   }

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

    $('.white-to-move').show();
  } else {
    whiteTimeRemaining = Math.ceil(currentTime / 1000) * 1000;
    blackTimeRemaining = Math.ceil(previousTime / 1000) * 1000;

    setTimeRemaining('white', whiteTimeRemaining);

    blackMoveStarted = moment();

    updateClock('black');

    blackClockInterval = setInterval(function() { updateClock('black') }, 1000);

    $('.black-to-move').show();
  }
}

function stopClock(color) {
  if (color == 'white') {
    clearInterval(whiteClockInterval);
    $('.white-to-move').hide();    
  } else {
    clearInterval(blackClockInterval);
    $('.black-to-move').hide();
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

var newMovesCount = 0;

function setPgn(pgn)
{
   var currentPlyCount = 0;

   if (!viewingActiveMove)
   {
      $('#newmove').removeClass('d-none');
      newMovesCount = newMovesCount + 1;
      $('#newmove').attr('data-count', newMovesCount);
   }
   else
   {
      $('#newmove').addClass('d-none');
      newMovesCount = 0;
      $('#newmove').attr('data-count', 0);
   }

   if (pgn.gameChanged)
   {
      console.log ("Came to setpgn need to reread dataa");
      prevPgnData = 0;
      stopClock('black');
      stopClock('white');
      whiteClockInterval = '';
      blackClockInterval = '';
      clearInterval(whiteClockInterval);
      clearInterval(blackClockInterval);
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
    $('#newmove').addClass('d-none');
    newMovesCount = 0;
    $('#newmove').attr('data-count', 0);
  }
   if (viewingActiveMove && activePly != currentPlyCount) {
      activePly = currentPlyCount;
      if (playSound)
      {
         $('#move_sound')[0].play();
      }
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
      if (Math.abs(adjudication.Draw) < 8 && pgn.Moves.length > 34) {
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
   var clip = new ClipboardJS('.btn', {
      text: function(trigger) {
         return currentPosition;
      }
   });
/*
   clip.on('success', function(e) {
      $('.copied').show();
      $('.copied').fadeOut(1000);
   });
*/
   return false;
}

function setInfoFromCurrentHeaders()
{
  var header = loadedPgn.Headers.White;
  var name = header;
  if (header.indexOf(' ') > 0) {
    name = header.substring(0, header.indexOf(' '))
  }
  $('.white-engine-name').html(name);
  $('.white-engine-name-full').html(header);
  var imgsrc = 'img/engines/' + name + '.jpg';
  $('#white-engine').attr('src', imgsrc);
  $('#white-engine').attr('alt', header);
  $('#white-engine-chessprogramming').attr('href', 'https://www.chessprogramming.org/' + name);
  header = loadedPgn.Headers.Black;
  name = header;
  if (header.indexOf(' ') > 0) {
    name = header.substring(0, header.indexOf(' '))
  }
  $('.black-engine-name').html(name);
  $('.black-engine-name-full').html(header);
  var imgsrc = 'img/engines/' + name + '.jpg';
  $('#black-engine').attr('src', imgsrc);
  $('#black-engine').attr('alt', header);
  $('#black-engine-chessprogramming').attr('href', 'https://www.chessprogramming.org/' + name);
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
    speed = Math.round(speed / 1000) + ' Knps';
  } else {
    speed = Math.round(speed / 1000000) + ' Mnps';
  }

  nodes = selectedMove.n;
  if (nodes < 1000000) {
    nodes = Math.round(nodes / 1000) + ' K';
  } else {
    nodes = Math.round(nodes / 1000000) + ' M';
  }

  var depth = selectedMove.d + '/' + selectedMove.sd;
  var tbHits = 0;
  if (selectedMove.tb) {
    if (selectedMove.tb < 1000)
    {
      tbHits = selectedMove.tb;
    } 
    else if (selectedMove.tb < 1000000) {
      tbHits = Math.round(selectedMove.tb / 1000) + ' K';
    } else {
      tbHits = Math.round(selectedMove.tb * 1 / 1000000) + ' M';
    }
  }

  var evalRet = '';
  if (!isNaN(selectedMove.wv))  
  {
     evalRet = parseFloat(selectedMove.wv).toFixed(2);
  }
  else
  {
     evalRet = selectedMove.wv;
  }

  return {
    'side': side,
    'eval': evalRet,
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
      $('.white-time-remaining').html(whiteEval.timeleft);
      $('.black-time-remaining').html(blackEval.timeleft);
   }

   $('.white-engine-eval').html(whiteEval.eval);
   $('.white-engine-speed').html(whiteEval.speed);
   $('.white-engine-nodes').html(whiteEval.nodes);
   $('.white-engine-depth').html(whiteEval.depth);
   $('.white-engine-tbhits').html(whiteEval.tbhits);
   updateEnginePv('white', whiteToPlay, whiteEval.pv);

   $('.black-engine-eval').html(blackEval.eval);
   $('.black-engine-speed').html(blackEval.speed);
   $('.black-engine-nodes').html(blackEval.nodes);
   $('.black-engine-depth').html(blackEval.depth);
   $('.black-engine-tbhits').html(blackEval.tbhits);
   updateEnginePv('black', whiteToPlay, blackEval.pv);
}

var whitePv = [];
var blackPv = [];
var livePvs = [];
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

  viewingActiveMove = false;

  $('.active-move').removeClass('active-move');
  $(this).addClass('active-move');

  boardEl.find('.' + squareClass).removeClass('highlight-white');
  boardEl.find('.square-' + moveFrom).addClass('highlight-white');
  boardEl.find('.square-' + moveTo).addClass('highlight-white');
  squareToHighlight = moveTo;

  board.position(clickedFen, false);
  currentPosition = clickedFen;
  activePly = clickedPly;
  e.preventDefault();

  if (clickedPly == loadedPlies)
  {
    viewingActiveMove = true;
    $('#newmove').addClass('d-none');
    newMovesCount = 0;
    $('#newmove').attr('data-count', 0);
   }

   handlePlyChange(false);

   return false;
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

  return false;
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

  return false;
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

  return false;
});

function onLastMove()
{
  activePly = loadedPlies;
  viewingActiveMove = true;
  handlePlyChange();
}

$(document).on('click', '#board-to-last', function(e) {
  onLastMove();
  e.preventDefault();

  return false;
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

  return false;
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
    liveKey = $(this).attr('live-pv-key');
    activePv = livePvs[liveKey];
    // pvBoard.orientation('white');
  }

  setPvFromKey(moveKey);

  e.preventDefault(); 

  return false;
});

function setPvFromKey(moveKey)
{
  if (activePv.length < 1) {
    activePvKey = 0;
    //return;
  }

  activePvKey = moveKey;

  console.log ("movekey is " + moveKey);
  console.log ("movekey length is " + activePv.length);

  moveFrom = activePv[moveKey].from;
  moveTo = activePv[moveKey].to;
  fen = activePv[moveKey].fen;
  console.log ("moveKey inside pv is :" + activePvKey + ":moveFrom:" + moveFrom);

  $('.active-pv-move').removeClass('active-pv-move');
  $(this).addClass('active-pv-move');

  $('#pv-board-fen').html(fen);

  pvBoardEl.find('.' + squareClass).removeClass('highlight-white');
  pvBoardEl.find('.square-' + moveFrom).addClass('highlight-white');
  pvBoardEl.find('.square-' + moveTo).addClass('highlight-white');
  pvSquareToHighlight = moveTo;

  pvBoard.position(fen, false);
}

$('#pv-board-fen').click(function(e) {
  Clipboard.copy($(this).html());
  return false;
});

$('#pv-board-black').click(function(e) {
  activePv = blackPv;
  setPvFromKey(0);
  e.preventDefault();

  return false;
});

$('#pv-board-white').click(function(e) {
  activePv = whitePv;
  setPvFromKey(0);
  e.preventDefault();

  return false;
});

$('#pv-board-to-first').click(function(e) {
  setPvFromKey(0);
  e.preventDefault();

  return false;
});

$('#pv-board-previous').click(function(e) {
  if (activePvKey > 0) {
    console.log ("Setting to :" + (activePvKey - 1));
    setPvFromKey(activePvKey - 1);
  }
  e.preventDefault();

  return false;
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

  return false;
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
    console.log ("Setting next to :" + (activePvKey + 1));  
    if (activePvKey == 0)
    {
      setPvFromKey(0);
      activePvKey = activePvKey + 1;
    }
    else
    {
      setPvFromKey(activePvKey + 1);
    }  
  }
  e.preventDefault();

  return false;
});

$('#pv-board-to-last').click(function(e) {
  setPvFromKey(activePv.length - 1);
  e.preventDefault();

  return false;
});

$('#pv-board-reverse').click(function(e) {
  pvBoard.flip();
  e.preventDefault();

  return false;
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

var gameArrayClass = ['#39FF14', 'red', 'whitesmoke'];

function setDarkMode(value)
{
   darkMode = value;
   if (!darkMode)
   {
      gameArrayClass = ['darkgreen', 'red', 'black'];
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
         engine.Result = '&frac12'
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

function cellformatter(value, row, index, field) {
   if (!value.hasOwnProperty("Score")) // true
   {
      return {classes: 'black'};
   } 
   return {classes: 'monofont'};
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
       classes: 'table table-striped table-no-bordered',
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
   var prevDate = 0;
   var momentDate = 0;
   var diff = 0;
   var gameDiff = 0;
   var timezoneDiff = moment().utcOffset() * 60 * 1000 - 3600 * 1000;

   _.each(data, function(engine, key) 
   {
      if (engine.Start)
      {
         momentDate = moment(engine.Start, 'HH:mm:ss on YYYY.MM.DD');
         if (prevDate)
         {
            diff = diff + momentDate.diff(prevDate);
            gameDiff = diff/(engine.Game-1);
         }
         momentDate.add(timezoneDiff);
         engine.Start = momentDate.format('HH:mm:ss on YYYY.MM.DD');
         prevDate = momentDate;
      }
      else
      {
         if (gameDiff)
         {
            prevDate.add(gameDiff + timezoneDiff);
            engine.Start = "Estd: " + prevDate.format('HH:mm:ss on YYYY.MM.DD');
         }
      }
      if (typeof engine.Moves != 'undefined')
      {
         gamesDone = engine.Game;
         engine.Game = '<a title="TBD" style="cursor:pointer; color: red;"onclick="openCross(' + engine.Game + ')">' + engine.Game + '</a>';
      }
   });

   $('#schedule').bootstrapTable('load', data);
   var options = $('#schedule').bootstrapTable('getOptions');
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

   var onDragMove = function(newLocation, oldLocation, source,
                             piece, position, orientation) {
     var pvLen = activePvKey;
     var fen = ChessBoard.objToFen(position);
     var moveFrom = oldLocation;
     var moveTo = newLocation;
     if (newLocation == oldLocation)
     {
        return;
     }
     console.log ("setting pvlen:" + pvLen); 
     activePv[pvLen] = {};
     activePv[pvLen].fen = ChessBoard.objToFen(position);
     activePv[pvLen].from = oldLocation;
     activePv[pvLen].to = newLocation;
     $('.active-pv-move').removeClass('active-pv-move');
     $(this).addClass('active-pv-move');
     pvBoardEl.find('.' + squareClass).removeClass('highlight-white');
     pvBoardEl.find('.square-' + moveFrom).addClass('highlight-white');
     pvBoardEl.find('.square-' + moveTo).addClass('highlight-white');
     pvSquareToHighlight = moveTo;
     activePvKey = pvLen + 1;
     $('#pv-board-fen').html(fen);
   };

   var pvBoard =  ChessBoard('pv-board', {
      pieceTheme: window[ptheme + "_piece_theme"],
      position: 'start',
      onMoveEnd: onMoveEnd,
      moveSpeed: 1,
      appearSpeed: 1,
      draggable: true,
      onDrop: onDragMove,   
      boardTheme: window[btheme + "_board_theme"]
   });
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

function setTwitchBackgroundInit(backg)
{
   var setValue = 0;
   if (backg == 1)
   {
      $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat');
      setValue = 1;
   }
   else if (backg == 2)
   {
      $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat?darkpopout');
      setValue = 2;
   }
   else
   {
      var darkMode = localStorage.getItem('tcec-dark-mode');
      if (darkMode == 20)
      {
         $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat?darkpopout');
         setValue = 2;
      }
      else
      {
         $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat');
         setValue = 1;
      }
   }
   localStorage.setItem('tcec-twitch-back-mode', setValue);
}

function setTwitchBackground(backg)
{
   var setValue = 0;
   var darkMode = localStorage.getItem('tcec-twitch-back-mode');
   console.log ("darkMode is " + darkMode);
   if (darkMode != undefined)
   {
      if (darkMode == 1)
      {
         $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat');
         setValue = 1;
      }
      else if (darkMode == 2)
      {
         $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat?darkpopout');
         setValue = 2;
      }
      else if (darkMode == 0)
      {
         if (backg == 1)
         {
            $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat');
         }
         else
         {
            $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat?darkpopout');
         }
      }
   }
   else
   {
      if (backg == 1)
      {
         $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat');
      }
      else
      {
         $('#chatright').attr('src', 'https://www.twitch.tv/embed/TCEC_Chess_TV/chat?darkpopout');
      }
   }
   localStorage.setItem('tcec-twitch-back-mode', setValue);
   $('input[value='+setValue+']').prop('checked', true);
}

function setDark()
{
   $('.toggleDark').find('i').removeClass('fa-moon');
   $('.toggleDark').find('i').addClass('fa-sun');
   $('body').addClass('dark');
   setTwitchBackground(2);
   $('#info-frame').attr('src', 'info.html?body=dark');
   $('#crosstable').addClass('table-dark');
   $('#schedule').addClass('table-dark');
   $('#standtable').addClass('table-dark');
   $('#infotable').addClass('table-dark');
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
   setTwitchBackground(1);
   $('#info-frame').attr('src', 'info.html?body=light');
   $('#standtable').removeClass('table-dark');
   $('#infotable').removeClass('table-dark');
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
          classes: 'table table-striped table-no-bordered',
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
   livePvs = [];
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

     if (datum.pv.length > 0 && datum.pv.trim() != "no info") {
      var chess = new Chess(activeFen);

      var currentFen = activeFen;

      datum.pv = datum.pv.replace("...", ". .. ");
      _.each(datum.pv.split(' '), function(move) {
          if (isNaN(move.charAt(0)) && move != '..') {
            moveResponse = chess.move(move);

            if (!moveResponse || typeof moveResponse == 'undefined') {
                 //console.log("undefine move" + move);
            } else {
              newPv = {
                'from': moveResponse.from,
                'to': moveResponse.to,
                'm': moveResponse.san,
                'fen': currentFen
              };

              currentFen = chess.fen();
              currentLastMove = move.slice(-2);

              pvs = _.union(pvs, [newPv]);
            }
          }
      });
     }

     if (pvs.length > 0) {
      livePvs = _.union(livePvs, [pvs]);
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
    var moveContainer = [];
    if (livePvs.length > 0) {
      _.each(livePvs, function(livePv, pvKey) {
        var moveCount = 0;
        _.each(engineDatum.pv.split(' '), function(move) {
          if (isNaN(move.charAt(0)) && move != '..') {
            pvLocation = livePvs[pvKey][moveCount];
            if (pvLocation) {
               moveContainer = _.union(moveContainer, ["<a href='#' class='set-pv-board' live-pv-key='" + pvKey + "' move-key='" + moveCount + "' color='live'>" + pvLocation.m + '</a>']);
               }
            else
            {
               console.log ("pvlocation not defined");
            }
            moveCount++;
          } else {
            moveContainer = _.union(moveContainer, [move]);
          }
        });
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
       points: engineDetails.Score
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
           score2 = '';
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
       },
       {
         field: 'points',
         title: 'Points'
        ,sortable: true
        ,width: '7%'
       }
     ];
     _.each(standtableData.Order, function(engine, key) {
       engineDetails = _.get(standtableData.Table, engine);
       columns = _.union(columns, [{field: engineDetails.Abbreviation, title: engineDetails.Abbreviation, 
                                    formatter: formatter, cellStyle: cellformatter}]);
     });

     $('#standtable').bootstrapTable({
       columns: columns,
       classes: 'table table-striped table-no-bordered',
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

function checkTwitch(checkbox)
{
   if (checkbox.checked)
   {
      $('iframe#twitchvid').hide();
      localStorage.setItem('tcec-twitch-video', 1);
   }
   else
   {
      $('iframe#twitchvid').attr('src', 'https://player.twitch.tv/?TCEC_Chess_TV');
      $('iframe#twitchvid').show();
      localStorage.setItem('tcec-twitch-video', 0);
   }
}

function setTwitch()
{
   var getVideoCheck = localStorage.getItem('tcec-twitch-video');        
   if (getVideoCheck == undefined || getVideoCheck == 0)
   {
      $('iframe#twitchvid').attr('src', 'https://player.twitch.tv/?TCEC_Chess_TV');
      $('iframe#twitchvid').show();
      $('#twitchcheck').prop('checked', false);
   }
   else
   {
      $('iframe#twitchvid').hide();
      $('#twitchcheck').prop('checked', true);
   }
}

function checkSound(checkbox)
{
   if (checkbox.checked)
   {
      localStorage.setItem('tcec-sound-video', 1);
      playSound = 0;
   }
   else
   {
      localStorage.setItem('tcec-sound-video', 0);
      playSound = 1;
   }
}

function setSound()
{
   var getSound = localStorage.getItem('tcec-sound-video');        
   if (getSound == undefined || getSound == 0)
   {
      playSound = 1;
   }
   else
   {
      playSound = 0;
   }
}

function goMoveFromChart(chartx, evt)
{
   var activePoints = chartx.getElementAtEvent(evt);
   var firstPoint = activePoints[0];
   var plyNum = chartx.data.datasets[firstPoint._datasetIndex].data[firstPoint._index].ply;
   if (plyNum != undefined)
   {
      $('a[ply=' + plyNum + ']').click();
   }
}

document.getElementById("eval-graph").onclick = function(evt)
{
   goMoveFromChart(evalChart, evt);
};

document.getElementById("time-graph").onclick = function(evt)
{
   goMoveFromChart(timeChart, evt);
};

document.getElementById("speed-graph").onclick = function(evt)
{
   goMoveFromChart(speedChart, evt);
};

document.getElementById("tbhits-graph").onclick = function(evt)
{
   goMoveFromChart(tbHitsChart, evt);
};

document.getElementById("depth-graph").onclick = function(evt)
{
   goMoveFromChart(depthChart, evt);
};

function addToolTip(divx, divimg)
{
   var htmlx = '<table class="table table-dark table-striped table-dark">' + $(divx).html() + '</table>';
   $(divimg).tooltipster('content', htmlx);
}

var columnsEng = [
{
   field: 'Name'
},
{
   field: 'Value'
}
];

function updateEngineInfo(divx, divimg, data) 
{
   $(divx).bootstrapTable('load', data);
   addToolTip(divx, divimg);
}

function addToolTipInit(divx, divimg, direction)
{
   $(divimg).tooltipster({
      contentAsHTML: true,
      interactive: true,
      side: [direction],
      theme: 'tooltipster-shadow',
      trigger: 'hover',
      delay: [500, 200],
      contentCloning: true,
      delayTouch: [10, 2000],
      trigger: 'custom',
         triggerOpen: {
            mouseenter: true,
            click: true,
            touchstart: true,
            tap: true
         },
         triggerClose: {
            mouseleave: true,
            click: true,
            touchleave: true,
            tap: true,
            originClick: true
         }
   });
}

function initToolTip()
{
   $('#whiteenginetable').bootstrapTable({
      columns: columnsEng,
      showHeader: false
   });
   $('#blackenginetable').bootstrapTable({
      columns: columnsEng,
      showHeader: false
   });
   addToolTipInit('#whiteenginetable', '#white-engine-info', 'right');
   addToolTipInit('#blackenginetable', '#black-engine-info', 'left');
}

function stopEvProp(e) {
    e.cancelBubble = !0;
    if (e.stopPropagation) {
        e.stopPropagation()
    }
    if (e.preventDefault) {
        e.preventDefault()
    }
    return !1
}

function firstButton()
{
  activePly = 1;
  handlePlyChange();
};

function backButton()
{
  if (activePly > 1) {
    activePly--;
  }
  handlePlyChange();

  return false;
};

function forwardButton()
{
  if (activePly < loadedPlies) {
    activePly++;
  } else {
    viewingActiveMove = true;
  }
  handlePlyChange();

  return false;
}

function endButton()
{
  onLastMove();
}

function tcecHandleKey(e) 
{
    var keycode, oldPly, oldVar, colRow, colRowList;
    console.log ("keycode");
    if (!e) 
    {
        e = window.event
    }
    keycode = e.keyCode;
    if (e.altKey || e.ctrlKey || e.metaKey) {
        return !0
    }

    switch (keycode)
    {  
        case 37:
        case 74:
            backButton();
            break;
        case 38:
        case 72:
            firstButton();
            break;
        case 39:
        case 75:
            forwardButton();
            break;
        case 40:
        case 76:
            endButton();
            break;
        default:
            return !0
    }
    return stopEvProp(e)
}

function simpleAddEvent(obj, evt, cbk) 
{
   if (obj.addEventListener) 
   {
      obj.addEventListener(evt, cbk, !1)
   } 
   else if (obj.attachEvent) 
   {
      obj.attachEvent("on" + evt, cbk)
   }
}
simpleAddEvent(document, "keydown", tcecHandleKey);
