(function(){


	// -----------------
	// --- THE MODEL ---
	// -----------------
	var model = raw.model();

	// Valeur total d'une part  	
	var countryCode = model.dimension() 
		.title('Country code')
		.types(String)
		.required(1);

	var countryData1 = model.dimension()
        .title('Dimension')
        .types(Number)
        .required(1);

	// --- Mapping function ---	
	model.map(function (data){
		return data.map(function (d){
			return {
				code : countryCode(d),
				z :  parseInt(countryData1(d)),
			}
		})
	})


	// -----------------
	// --- THE CHART ---
	// -----------------
	var chart = raw.chart()
		.title("Bubble Map")
		.description("Simple representation of a Bubble Map.<br><a href='http://www.highcharts.com/maps/demo/map-bubble'>http://www.highcharts.com/maps/demo/map-bubble</a><br>For more base map, visit <a href='http://code.highcharts.com/mapdata/'>http://code.highcharts.com/mapdata/</a><br><br>Exemple: Yes<br><img src='imgs/exemples/exemple_bubbleMap_monde.png' class='img-exemple'>")
		.thumbnail("imgs/cartogramAnamorphose.png")
		.thumbnail("imgs/bubbleMap.png")
		.model(model)


	// --- Some options we want to expose to the users ---
	var chartCarte = chart.list()
        .title("Base Map")
        .values(['World-countries','France-departements','France-regions2016'])
        .defaultValue('World-countries')

	var chartWidth = chart.number()
		.title('Width')
		.defaultValue(900);

	var chartMinSize = chart.number()
		.title('Min size bubble (px)')
		.defaultValue(4);
	var chartMaxSize = chart.number()
		.title('Max size bubble (%)')
		.defaultValue(12);

	var	chartBubbleOpacity = chart.number()
		.title('Bubble opacity [0,2]')
		.defaultValue(0.6);
	var	chartBubbleStrokeOpacity = chart.number()
		.title('Bubble stroke opacity [0,1]')
		.defaultValue(1);	

	
  	// --- Drawing function ---
	chart.draw(function (selection, data){


		$('h3#options').replaceWith('<h3 id="options">Customize your Visualization<br><span id="wrong-map">If the data does not appear, check that you have chosen the right base map options.</span></h3>');

		var chartHeight = chartWidth.value*(400/600),
			map = selection
				.attr("width", chartWidth())	
				.attr("height", chartHeight);

		$('.highcharts-container').css("width", chartWidth.value);
		$('.highcharts-container').css("width", chartHeight);

		
        if(chartCarte() == 'World-countries'){
        	var carteJoinBy = ['iso-a2', 'code'];
        	var mapData = Highcharts.geojson(Highcharts.maps['custom/world']);
        } else if(chartCarte() == 'France-departements'){
			var carteJoinBy = ['hc-key', 'code'];
			var mapData = Highcharts.geojson(Highcharts.maps['countries/fr/fr-all-all']);
        } else if(chartCarte() == 'France-regions2016'){
        	var mapData = mapRegions[0].data;
			var carteJoinBy = ['codeRegion', 'code'];
        } else { alert("Probleme with the base map. Try again or contact the staff developpement.")}



        // Correct UK to GB in data
        $.each(data, function () {
            if (this.code === 'UK') {
                this.code = 'GB';
            }
        });

       	window.chart = new Highcharts.Map({
            chart : {
            	renderTo: 'chart',
                borderWidth : 1,
                width:chartWidth.value,
                height:chartHeight
            },
			credits: {
      			enabled: false
  			},
			title: {
				text: '',
			},
            legend: {
                enabled: false
            },
            mapNavigation: {
                enabled: true,
                buttonOptions: {
                    verticalAlign: 'bottom'
                }
            },
            tooltip : {
				formatter: function () {
			    	return 'The value for <b>'+this.key+'</b> is <b>'+this.point.z+'</b>';
				}
			},
            series : [{
                name: 'Countries',
                mapData: mapData,
                color: '#E0E0E0',
                enableMouseTracking: false
            }, {
                type: 'mapbubble',
                mapData: mapData,
                joinBy: carteJoinBy,
                data: data,
                minSize: chartMinSize.value,
                maxSize: ''+chartMaxSize.value+'%',
                color: "rgba(124,181,236,"+chartBubbleStrokeOpacity.value+")",
                marker: {
	              fillOpacity: chartBubbleOpacity.value
	            }
            }]
        });
	})

})();


