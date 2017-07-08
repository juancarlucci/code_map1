$(document).ready(function() {

	var cities;
	var map = L.map('map', {
			center: [38.3, -122.],
			zoom: 12,
			minZoom: 8
		});

	L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ'
	}).addTo(map);

	// $.getJSON("data/city-data.json")
	$.getJSON("data/codeCycle_faux.geojson")
	
		.done(function(data) {

			// var info = processData(data);
			// createPropSymbols(info.timestamps, data);
			// createLegend(info.min,info.max);
			// createSliderUI(info.timestamps);
			// createChartLegend(info.timestamps);
			console.log(data);


		})
		.fail(function() { alert("There has been a problem loading the data.")});

		function processData(data) {

			var timestamps = [];
			var	min = Infinity;
			var	max = -Infinity;

			for (var feature in data.features) {

				var properties = data.features[feature].properties;

				for (var attribute in properties) {

					// if ( attribute != 'id' &&
					// 	 attribute != 'name' &&
					// 	 attribute != 'lat' &&
					// 	 attribute != 'lon' )
					// {
						if ( $.inArray(attribute,timestamps) ===  -1) {
							timestamps.push(attribute);
						}
						if (properties[attribute] < min) {
							min = properties[attribute];
						}
						if (properties[attribute] > max) {
							max = properties[attribute];
						}
					// }
				}
			}
			return {
				timestamps : timestamps,
				min : min,
				max : max
			}
		}  // end processData()
	function createPropSymbols(timestamps, data) {

		cities = L.geoJson(data, {

			pointToLayer: function(feature, latlng) {

				return L.circleMarker(latlng, {

				    fillColor: "#708598",
				    color: '#537898',
				    weight: 1,
				    fillOpacity: 0.6

				}).on({

					mouseover: function(e) {
						this.openPopup();
						this.setStyle({color: 'yellow'});
					},
					mouseout: function(e) {
						this.closePopup();
						this.setStyle({color: '#537898'});

					}
				});
			}
		}).addTo(map);

		//updatePropSymbols() function takes as a parameter the value stored in the 
		//first index position of the timestamps array (i.e., the first date in the time series)
		updatePropSymbols(timestamps[0]);

	} // end createPropSymbols()

	function updatePropSymbols(timestamp, max) {

		cities.eachLayer(function(layer) {

			var props = layer.feature.properties;
			var	radius = calcPropRadius(props[timestamp]);
			var	popupContent = "<b>" + String(props[timestamp]) + " units</b><br>" +
							   "<i>" + props.name + " " + props.kwhSavings +
							   "</i> in </i>" + timestamp + "</i>";

			layer.setRadius(radius);
			if(radius > max) {
				L.DomUtil.toBack(layer);
			}
			layer.bindPopup(popupContent, { offset: new L.Point(0,-radius) });

		});
	} // end updatePropSymbols
	function calcPropRadius(attributeValue) {

		var scaleFactor = 45,
			area = attributeValue * scaleFactor;

		//determine the area (instead of radius) of proportional circle 
		return Math.sqrt(area/Math.PI);

	} // end calcPropRadius
	function createLegend(min, max, timestamps) {

		if (min < 10) {
			min = 10;
		}

		function roundNumber(inNumber) {

       		return (Math.round(inNumber/10) * 10);
		}
		function getTotal(total, num) {
		    return total + num;
		}
		// const sum = getTotal(timestamps);
		
		// const sum = timestamps.reduce((total, amount) => total + amount); 
		// console.log(sum);

		var legend = L.control( { position: 'bottomright' } );

		legend.onAdd = function(map) {

			var legendContainer = L.DomUtil.create("div", "legend");
			var	symbolsContainer = L.DomUtil.create("div", "symbolsContainer");
			var	classes = [roundNumber(min), roundNumber((max-min)/2), roundNumber(max)];
			var	legendCircle;
			var	lastRadius = 0;
			var  currentRadius;
			var  margin;

			//disables panning under legend
			L.DomEvent.addListener(legendContainer, 'mousedown', function(e) {
				L.DomEvent.stopPropagation(e);
			});

			$(legendContainer).append("<h2 id='legendTitle'>kwh savings</h2>");

			for (var i = 0; i <= classes.length-1; i++) {

				legendCircle = L.DomUtil.create("div", "legendCircle");

				currentRadius = calcPropRadius(classes[i]);

				//nesting by negative value of left margin
				margin = -currentRadius - lastRadius - 2;

				$(legendCircle).attr("style", "width: " + currentRadius*2 +
					"px; height: " + currentRadius*2 +
					"px; margin-left: " + margin + "px" );

				$(legendCircle).append("<span class='legendValue'>"+classes[i]+"<span>");

				$(symbolsContainer).append(legendCircle);

				lastRadius = currentRadius;

			}

			$(legendContainer).append(symbolsContainer);

			return legendContainer;

		};

		legend.addTo(map);
	} // end createLegend()
	function createSliderUI(timestamps) {

		var sliderControl = L.control({ position: 'bottomleft'} );

		sliderControl.onAdd = function(map) {

			var slider = L.DomUtil.create("input", "range-slider");

			L.DomEvent.addListener(slider, 'mousedown', function(e) {

				L.DomEvent.stopPropagation(e);

			});

			$(slider)
				.attr({'type':'range', 'max': timestamps[timestamps.length-1], 'min':timestamps[0], 'step': 1,'value': String(timestamps[0])})
		        .on('input change', function() {
		        	updatePropSymbols($(this).val().toString());
		            $(".temporal-legend").text(this.value);
		        });

			return slider;
		}

		sliderControl.addTo(map);
		createTemporalLegend(timestamps[0]);
	} // end createSliderUI()
	function createTemporalLegend(startTimestamp) {

		var temporalLegend = L.control({ position: 'bottomleft' });

		temporalLegend.onAdd = function(map) {

			var output = L.DomUtil.create("output", "temporal-legend");

			return output;
		}

		temporalLegend.addTo(map);
		$(".temporal-legend").text(startTimestamp);
	}	// end createTemporalLegend()

	function createChartLegend(timestamps) {
		var center = [38.3, -122.];
		// Let us generate fake data
		function fakeData() {
		  return [Math.random(), Math.random(), Math.random()];
		}

		// Create a barchart
		var myBarChart = L.minichart(center, {data: fakeData()});
		map.addLayer(myBarChart);

		// Update data every 2 seconds
		setInterval(function() {
		  myBarChart.setOptions({data: fakeData()})
		}, 2000);

		var chartLegend = L.control({ position: 'topright' });

		chartLegend.onAdd = function(map) {

			var output = L.DomUtil.create("output", "chart-legend");

			return output;
		}

		chartLegend.addTo(map);

		// const toNumber = Number(timestamps);
		// const sum = toNumber.reduce((total, amount) => total + amount); 
		// console.log(sum);
		$(".chart-legend").text(myBarChart);
		// createChartLegend(timestamps[0]);
	}	// end chartLegend()

	
});
