var evalChart;

var evalChartData = {
  labels: [],
  datasets: [{
    label: 'Live [LC0]',
    lineTension: 0,
    borderColor: '#007bff',
    backgroundColor: '#007bff',
    
    fill: false,
    data: [
    ]
  }
  ]
};


$(function() {
	evalChart = Chart.Line($('#eval-graph'), {
	  data: evalChartData,
	  options: {
	    responsive: true,
	    bezierCurve: false,
	    hoverMode: 'index',
	    stacked: false,
	    legend: {
	      display: true,
         labels: {
            boxWidth: 1
         },
	    },
	    title: {
	      display: false
	    },
        tooltips: {
	      callbacks: {
	            label: function(tooltipItem, data) {
	            	eval = [];
	            	if (typeof data.datasets[0].data[tooltipItem.index] != 'undefined') {
	            		eval = _.union(eval, ['Live Eval: ' + data.datasets[0].data[tooltipItem.index].eval]);
	            	}
	                return eval;
	            }
	      } // end callbacks:
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'e-y-axis-1',
	      }],
	      xAxes: [{
	      	ticks: {
		        autoSkip: true,
		        maxTicksLimit: 25
		    }
	      }]
	    }
	  }
	});
});

function updateChartData()
{
	evalChart.data.labels = [];
	evalChart.data.datasets[0].data = [];
	
	labels = [];

	liveEval = [];

   var plyNum = 0;

	// _.each(loadedPgn.Moves, function(move, key) {
	// 	if (!move.book) {
	// 		moveNumber = Math.round(key / 2) + 1;

	// 		if (key % 2 != 0) {
 //            plyNum = key + 1;
	// 			moveNumber--;
	// 		}
 //         else
 //         {
 //            plyNum = key + 1;
 //         }

	// 		depth = move.d;
	// 		if (move.sd > depth) {
 //            //arun
	// 			//depth = move.sd;
	// 		}

 //         //arun: cap moves at 6.5
 //         move.cwv = move.wv;
 //         if (!isNaN(move.wv)) 
 //         {
 //            if (move.wv > 6.5) 
 //            {
 //               move.cwv = 6.5;
 //            } 
 //            else if (move.wv < -6.5) 
 //            {
 //               move.cwv = -6.5;
 //            }
 //         } 
 //         else 
 //         {
 //            if (move.wv.substring(0,1) == '-') 
 //            {
 //               move.cwv = -6.5;
 //            } 
 //            else 
 //            {
 //               move.cwv = 6.5;
 //            }
 //         }
 //         eval = [
	// 			{
	// 				'x': moveNumber,
	// 				'y': move.cwv,
	// 				'ply': plyNum,
	// 				'eval': move.wv
	// 			}
	// 		];

	// 		time = [
	// 			{
	// 				'x': moveNumber,
	// 				'y': Math.round(move.mt / 1000),
	// 				'ply': plyNum
	// 			}
	// 		];

	// 		speed = [
	// 			{
	// 				'x': moveNumber,
	// 				'y': move.s,
	// 				'nodes': move.n,
	// 				'ply': plyNum
	// 			}
	// 		];

	// 		depth = [
	// 			{
	// 				'x': moveNumber,
	// 				'y': depth,
	// 				'ply': plyNum
	// 			}
	// 		];

	// 		tbHits = [
	// 			{
	// 				'x': moveNumber,
	// 				'y': move.tb,
	// 				'ply': plyNum
	// 			}
	// 		];

	// 		if (key % 2 == 0) {
	// 			labels = _.union(labels, [moveNumber]);
	// 			// evalLabels = _.union(evalLabels, [moveNumber]);

	// 			whiteEval = _.union(whiteEval, eval);
	// 			// whiteEval = _.union(whiteEval, [{'x': moveNumber + 0.5, 'y': move.wv, 'eval': evaluation}]);
	// 			whiteTime = _.union(whiteTime, time);
	// 			whiteSpeed = _.union(whiteSpeed, speed);
	// 			whiteDepth = _.union(whiteDepth, depth);
	// 			whiteTBHits = _.union(whiteTBHits, tbHits);

	// 			evalObject = getLiveEval(key, moveNumber, false);

	// 			if (evalObject != -1) {
	// 				liveEval = _.union(liveEval, evalObject);
	// 			}

	// 		} else {
	// 			// evalLabels = _.union(evalLabels, [moveNumber + 0.5]);

	// 			blackEval = _.union(blackEval, eval);
	// 			// blackEval = _.union(blackEval, [{'x': moveNumber + 0.5, 'y': move.wv, 'eval': evaluation}]);
	// 			blackTime = _.union(blackTime, time);
	// 			blackSpeed = _.union(blackSpeed, speed);
	// 			blackDepth = _.union(blackDepth, depth);
	// 			blackTBHits = _.union(blackTBHits, tbHits);

	// 			// evalObject = getLiveEval(key, moveNumber, true);

	// 			// if (evalObject != -1) {
	// 			// 	liveEval = _.union(liveEval, evalObject);
	// 			// }
	// 		}
	// 	}
	// });

	evalChart.data.labels = labels;
	evalChart.data.datasets[0].data = liveEval;

    evalChart.update();
}

function getLiveEval(key, moveNumber, isBlack)
{
	key++;

	evalObject = _.find(liveEngineEval, function(ev) {
		return ev.ply == key;
	});

	if (_.isObject(evalObject)) {
		eval = evalObject.eval;
		if (!isNaN(evalObject.eval)) {
	        if (evalObject.eval > 6.5) {
	        	evalObject.eval = 6.5;
	        } else if (evalObject.eval < -6.5) {
	        	evalObject.eval = -6.5;
	        }
	    } else {
	    	if (evalObject.eval.substring(0,1) == '-') {
	    		evalObject.eval = -6.5;
	    	} else {
	    		evalObject.eval = 6.5;
	    	}
	    }

	    if (isBlack) {
	    	// moveNumber = moveNumber + 0.5;
	    }

	    return [
				{
					'x': moveNumber,
					'y': evalObject.eval,
					'eval': eval
				}
			];
	}

	return -1;
}
