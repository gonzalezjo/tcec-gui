boardEl = $('#board');

var squareToHighlight = '';
var crossTableInitialized = false;
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

var currentPosition = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
var bookmove = 0;

var onMoveEnd = function() {
  boardEl.find('.square-' + squareToHighlight)
    .addClass('highlight-white');
};

function updatePgn()
{
  axios.get('live.json?no-cache' + (new Date()).getTime())
  .then(function (response) {
    loadedPgn = response.data;
    setPgn(response.data);
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
    var diff = currentTime.diff(whiteMoveStarted);
    var ms = moment.duration(diff);

    whiteTimeUsed = ms;
    tempTimeRemaning = whiteTimeRemaining - whiteTimeUsed;

    setTimeUsed(color, whiteTimeUsed);
    setTimeRemaining(color, tempTimeRemaning);
  } else {
    var diff = currentTime.diff(blackMoveStarted);
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

function setPgn(pgn)
{
  var previousPosition = Cookies.get('last-position');
  if (typeof previousPosition == 'undefined') {
    previousPosition = '';
  }
  if (previousPosition.length > 0) {
    currentPosition = previousPosition;
  }

  var currentPlyCount = 0;
  if (typeof pgn.Moves != 'undefined') {
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

  if (currentPosition != previousPosition) {
    Cookies.set('last-position', currentPosition);
  }

  if (loadedPlies == currentPlyCount && (currentGameActive == gameActive)) {
    return;
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

  if (viewingActiveMove) {
    currentMove = pgn.Moves[pgn.Moves.length - 1];
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
    // console.log ("currentPosition:" + currentPosition); 
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
      if (Math.abs(adjudication.Draw) < 11) {
        movesToDraw = Math.abs(adjudication.Draw);
      }
      if (Math.abs(adjudication.ResignOrWin) < 9) {
        movesToResignOrWin = Math.abs(adjudication.ResignOrWin);
      }
      if (adjudication.FiftyMoves < 51) {
        movesTo50R = adjudication.FiftyMoves;
      }

      if (movesToDraw < 50 && movesToDraw <= movesTo50R && movesToDraw <= movesToResignOrWin) {
        termination = movesToDraw + ' ply to draw';
      }
      if (movesTo50R < 50 && movesTo50R < movesToDraw && movesTo50R < movesToResignOrWin) {
        termination = movesTo50R + ' ply to 50r';
      }
      if (movesToResignOrWin < 50 && movesToResignOrWin < movesToDraw && movesToResignOrWin < movesTo50R) {
        termination = movesToResignOrWin + ' ply to adjudication';
      }

      pgn.Headers.Termination = termination;
    } else {
      pgn.Headers.Termination = pgn.Headers.TerminationDetails;
    }
  }

  $('#event-overview').bootstrapTable('load', [pgn.Headers]);
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
  var imgsrc = 'img/engines/' + header.substring(0, header.indexOf(' ')) + '.jpg';
  $('#white-engine').attr('src', imgsrc);
  header = loadedPgn.Headers.Black;
  $('.black-engine-name').html(header);
  var imgsrc = 'img/engines/' + header.substring(0, header.indexOf(' ')) + '.jpg';
  $('#black-engine').attr('src', imgsrc);
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
       'mtime': "n/a",
       'depth': "n/a",
       'tbhits': "n/a",
       'timeleft': "n/a"
     };
  } 

  // console.log ("ply: " + ply);
  // console.log ("bookmove:" + bookmove);

  //arun
  if (ply < bookmove || (typeof selectedMove == 'undefined') || (typeof (selectedMove.pv) == 'undefined'))
  {
     return {
       'side': side,
       'eval': "book",
       'pv': {},
       'speed': "book",
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
    'mtime': secFormatNoH(selectedMove.mt),
    'depth': depth,
    'tbhits': tbHits,
    'timeleft': secFormat(selectedMove.tl),
  };
}

function updateMoveValues(whiteToPlay, whiteEval, blackEval)
{
   // console.log ("updateMoveValues: whiteval: " + whiteEval.mtime + ", blackEval:" + blackEval.length); 
   if (!viewingActiveMove) 
   {
      $('.white-time-used').html(whiteEval.mtime);
      $('.black-time-used').html(blackEval.mtime);
   }

   $('.white-engine-eval').html(whiteEval.eval);
   $('.white-engine-speed').html(whiteEval.speed);
   $('.white-engine-depth').html(whiteEval.depth);
   $('.white-engine-tbhits').html(whiteEval.tbhits);
   updateEnginePv('white', whiteToPlay, whiteEval.pv);
   $('.white-time-remaining').html(whiteEval.timeleft);

   $('.black-engine-eval').html(blackEval.eval);
   $('.black-engine-speed').html(blackEval.speed);
   $('.black-engine-depth').html(blackEval.depth);
   $('.black-engine-tbhits').html(blackEval.tbhits);
   updateEnginePv('black', whiteToPlay, blackEval.pv);
   $('.black-time-remaining').html(blackEval.timeleft);
}

function updateEnginePv(color, whiteToPlay, moves)
{
  if (typeof moves != 'undefined') {
    currentMove = Math.floor(activePly / 2);

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

      $('#' + color + '-engine-pv').append(move.m + ' ');
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

   // console.log('do stuff activePly:' + activePly);

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

function setMoveMaterial(material, whiteToPlay)
{
  _.forOwn(material, function(value, key) {
    setPieces(key, value, whiteToPlay);
  })
}

function setPieces(piece, value, whiteToPlay) {
  var target = 'white-material';
  var color = 'b';
  if ((whiteToPlay && value > 0) || (!whiteToPlay && value < 0)) {
    target = 'black-material';
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
         // console.log ("row is " + valuer);
         retStr = '<a title="TBD" style="cursor:pointer; color: #00bebe;"onclick="openCross(' + value + ')">' + value + '</a>';
      }
   });
      
   return retStr;
}

function formatter(value, row, index, field) {
   if (!value.hasOwnProperty("Score")) // true
   {
      return value;
   } 

   var retStr = '';
   var valuex = _.get(value, 'Score');
   _.each(valuex, function(engine, key) 
   {
      if (engine.Result == "0.5")
      {
         engine.Result = "=";
      }
      if (retStr == '')
      {
         retStr = '<a title="TBD" style="cursor:pointer; color: #00bebe;"onclick="openCross(' + engine.Game + ')">' + engine.Result + '</a>';
      }
      else
      {
         retStr += ' ' + '<a title="TBD" style="cursor:pointer; color: #00bebe;"onclick="openCross(' + engine.Game + ')">' + engine.Result + '</a>';
      }
   });
  return retStr;
}

function updateCrosstable() 
{
   axios.get('crosstable.json')
   .then(function (response)
   {
      var crosstableData = response.data;

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
          sb: Math.round(engineDetails.Performance * 100) / 100,
          elo: engineDetails.Rating,
          elo_diff: elo + ' [' + eloDiff + ']'
        };

        _.each(abbreviations, function (abbreviation) {
          var score2 = '';
          engineName = abbreviation.name;
          engineAbbreviation = abbreviation.abbr;

          engineCount = crosstableData.Order.length;
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

      if (!crossTableInitialized) {

        columns = [
          {
            field: 'rank',
            title: 'Rank'
           ,sortable: true
          },
          {
            field: 'name',
            title: 'Engine'
           ,sortable: true
          },
          {
            field: 'games',
            title: '# Games'
           ,sortable: true
          },
          {
            field: 'points',
            title: 'points'
           ,sortable: true
          },
          {
            field: 'wins',
            title: 'Wins [W/B]'
          },
          {
            field: 'crashes',
            title: 'Crashes'
           ,sortable: true
          },
          {
            field: 'sb',
            title: 'SB'
           ,sortable: true
          },
          {
            field: 'elo',
            title: 'Elo'
           ,sortable: true
          },
          {
            field: 'elo_diff',
            title: 'Diff [Live]'
          }
        ];
        _.each(crosstableData.Order, function(engine, key) {
          engineDetails = _.get(crosstableData.Table, engine);
          columns = _.union(columns, [{field: engineDetails.Abbreviation, title: engineDetails.Abbreviation, 
                                       formatter: formatter}]);
        });

        $('#crosstable').bootstrapTable({
          columns: columns
        });
        crossTableInitialized = true;
      }
      $('#crosstable').bootstrapTable('load', standings);
   })
   .catch(function (error) 
   {
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
