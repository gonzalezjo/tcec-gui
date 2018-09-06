var evalChart;
var timeChart;
var speedChart;
var depthChart;
var tbHitsChart;

var evalChartData = {
  labels: [],
  datasets: [{
    label: 'White Engine Eval',
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    data: [
    ]
  }, {
    label: 'Black Engine Eval',
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    
    fill: false,
    data: [
    ]
  }]
};

var timeChartData = {
  labels: [],
  datasets: [{
    label: 'White Engine Time',
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    data: [
    ]
  }, {
    label: 'Black Engine Time',
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    
    fill: false,
    data: [
    ]
  }]
};

var speedChartData = {
  labels: [],
  datasets: [{
    label: 'White Engine Speeds',
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    data: [
    ],
    yAxisID: 'y-axis-1',
  }, {
    label: 'Black Engine Speed',
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    
    fill: false,
    data: [
    ],
    yAxisID: 'y-axis-2'
  }]
};

var depthChartData = {
  labels: [],
  datasets: [{
    label: 'White Engine Depth',
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    data: [
    ]
  }, {
    label: 'Black Engine Depth',
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    
    fill: false,
    data: [
    ]
  }]
};

var tbHitsChartData = {
  labels: [],
  datasets: [{
    label: 'White Engine TB Hits',
    borderColor: '#EFEFEF',
    backgroundColor: '#EFEFEF',
    fill: false,
    data: [
    ]
  }, {
    label: 'Black Engine TB Hits',
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
    
    fill: false,
    data: [
    ]
  }]
};

$(function() {
	evalChart = Chart.Line($('#eval-graph'), {
	  data: evalChartData,
	  options: {
	    responsive: true,
	    hoverMode: 'index',
	    stacked: false,
	    lineTension: 0,
	    legend: {
	      display: false
	    },
	    title: {
	      display: false
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'y-axis-1',

	        // grid line settings
	        gridLines: {
	          drawOnChartArea: false, // only want the grid lines for one axis to show up
	        },
	      }],
	    }
	  }
	});

	timeChart = Chart.Line($('#time-graph'), {
	  data: timeChartData,
	  options: {
	    responsive: true,
	    hoverMode: 'index',
	    stacked: false,
	    lineTension: 0,
	    legend: {
	      display: false
	    },
	    title: {
	      display: false
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'y-axis-1',

	        // grid line settings
	        gridLines: {
	          drawOnChartArea: false, // only want the grid lines for one axis to show up
	        },
	      }],
	    }
	  }
	});

	speedChart = Chart.Line($('#speed-graph'), {
	  data: speedChartData,
	  options: {
	    responsive: true,
	    hoverMode: 'index',
	    stacked: false,
	    lineTension: 0,
	    legend: {
	      display: false
	    },
	    title: {
	      display: false
	    },
        tooltips: {
	      callbacks: {
	            label: function(tooltipItem, data) {
	                var value = parseInt(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index].y);
	                if (value >= 1000000) {
			  			value = Math.round (value / 10000) / 100;
				  		value += 'Mnps'
				  	} else {
				  		value = Math.round (value / 10) / 100;
				  		value += 'Knps'
				  	}
				    return value;
	            }
	      } // end callbacks:
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'y-axis-1',
	        ticks: {
			  callback: function(value, index, values) {
			  	if (value >= 1000000) {
			  		value = Math.round (value / 100000) / 10;
			  		value += 'M'
			  	} else {
			  		value = Math.round (value / 100) / 10;
			  		value += 'K'
			  	}
			    return value;
			  }
			}
	      }, {
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'right',
	        id: 'y-axis-2',

	        // grid line settings
	        gridLines: {
	          drawOnChartArea: false, // only want the grid lines for one axis to show up
	        },
	        ticks: {
			  callback: function(value, index, values) {
			  	if (value >= 1000000) {
			  		value = Math.round (value / 100000) / 10;
			  		value += 'M'
			  	} else {
			  		value = Math.round (value / 100) / 10;
			  		value += 'K'
			  	}
			    return value;
			  }
			}
	      }],
	    }
	  }
	});

	depthChart = Chart.Line($('#depth-graph'), {
	  data: depthChartData,
	  options: {
	    responsive: true,
	    hoverMode: 'index',
	    stacked: false,
	    lineTension: 0,
	    legend: {
	      display: false
	    },
	    title: {
	      display: false
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'y-axis-1',

	        // grid line settings
	        gridLines: {
	          drawOnChartArea: false, // only want the grid lines for one axis to show up
	        },
	      }],
	    }
	  }
	});

	tbHitsChart = Chart.Line($('#tbhits-graph'), {
	  data: tbHitsChartData,
	  options: {
	    responsive: true,
	    hoverMode: 'index',
	    stacked: false,
	    lineTension: 0,
	    legend: {
	      display: false
	    },
	    title: {
	      display: false
	    },
	    scales: {
	      yAxes: [{
	        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
	        display: true,
	        position: 'left',
	        id: 'y-axis-1',

	        // grid line settings
	        gridLines: {
	          drawOnChartArea: false, // only want the grid lines for one axis to show up
	        },
	      }],
	    }
	  }
	});
});

function updateChartData()
{
	evalChart.data.labels = [];
	evalChart.data.datasets[0].data = [];
	evalChart.data.datasets[1].data = [];

	timeChart.data.labels = [];
	timeChart.data.datasets[0].data = [];
	timeChart.data.datasets[1].data = [];

	speedChart.data.labels = [];
	speedChart.data.datasets[0].data = [];
	speedChart.data.datasets[1].data = [];

	depthChart.data.labels = [];
	depthChart.data.datasets[0].data = [];
	depthChart.data.datasets[1].data = [];

	tbHitsChart.data.labels = [];
	tbHitsChart.data.datasets[0].data = [];
	tbHitsChart.data.datasets[1].data = [];
	
	labels = [];

	whiteEval = [];
	blackEval = [];

	whiteTime = [];
	blackTime = [];

	whiteSpeed = [];
	blackSpeed = [];

	whiteDepth = [];
	blackDepth = [];

	whiteTBHits = [];
	blackTBHits = [];

	_.each(loadedPgn.Moves, function(move, key) {
		if (!move.book) {
			moveNumber = Math.round(key / 2) + 1;

			if (key % 2 != 0) {
				moveNumber--;
			}

			depth = move.d;
			if (move.sd > depth) {
            //arun
				//depth = move.sd;
			}

         //arun: cap moves at 6.5
         if (move.wv > 6.5)
         {
            move.wv= 6.5;
         }
         else if (move.wv < -6.5)
         {
            move.wv= -6.5;
         }
			eval = [
				{
					'x': moveNumber,
					'y': move.wv
				}
			];

			time = [
				{
					'x': moveNumber,
					'y': Math.round(move.mt / 1000)
				}
			];

			speed = [
				{
					'x': moveNumber,
					'y': move.s
				}
			];

			depth = [
				{
					'x': moveNumber,
					'y': depth
				}
			];

			tbHits = [
				{
					'x': moveNumber,
					'y': move.tb
				}
			];

			if (key % 2 == 0) {
				labels = _.union(labels, [moveNumber]);

				whiteEval = _.union(whiteEval, eval);
				whiteTime = _.union(whiteTime, time);
				whiteSpeed = _.union(whiteSpeed, speed);
				whiteDepth = _.union(whiteDepth, depth);
				whiteTBHits = _.union(whiteTBHits, tbHits);
			} else {
				blackEval = _.union(blackEval, eval);
				blackTime = _.union(blackTime, time);
				blackSpeed = _.union(blackSpeed, speed);
				blackDepth = _.union(blackDepth, depth);
				blackTBHits = _.union(blackTBHits, tbHits);
			}
		}
	});

	evalChart.data.labels = labels;
	evalChart.data.datasets[0].data = whiteEval;
	evalChart.data.datasets[1].data = blackEval;

	timeChart.data.labels = labels;
	timeChart.data.datasets[0].data = whiteTime;
	timeChart.data.datasets[1].data = blackTime;

	speedChart.data.labels = labels;
	speedChart.data.datasets[0].data = whiteSpeed;
	speedChart.data.datasets[1].data = blackSpeed;

	depthChart.data.labels = labels;
	depthChart.data.datasets[0].data = whiteDepth;
	depthChart.data.datasets[1].data = blackDepth;

	tbHitsChart.data.labels = labels;
	tbHitsChart.data.datasets[0].data = whiteTBHits;
	tbHitsChart.data.datasets[1].data = blackTBHits;

    evalChart.update();
    timeChart.update();
    speedChart.update();
    depthChart.update();
    tbHitsChart.update();
}
