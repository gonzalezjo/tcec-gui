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

	_.each(loadedPgn.Moves, function(move, key) {
		moveNumber = Math.round(key / 2) + 1;
		if (key % 2 == 0) {
			labels = _.union(labels, [moveNumber]);

			evalObject = getLiveEval(key, moveNumber, false);

			if (evalObject != -1) {
				liveEval = _.union(liveEval, evalObject);
			}

		} else {
			evalObject = getLiveEval(key, moveNumber, true);

			if (evalObject != -1) {
				liveEval = _.union(liveEval, evalObject);
			}
		}
	});

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
					'x': Math.round(evalObject.ply / 2) + 1,
					'y': evalObject.eval,
					'eval': eval
				}
			];
	}

	return -1;
}
