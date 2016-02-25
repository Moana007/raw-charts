(function(){

	// -----------------
	// --- THE MODEL ---
	// -----------------
	var model = raw.model();

	var  idCountry = model.dimension() 
		.title('Country id')
		.types(Number)
		.required(1);

	var  country = model.dimension() 
		.title('Country')
		.types(String)
		.required(1);

	// Valeur d'une donnée
	var data1 = model.dimension() 
		.title('Dimension')
		.types(Number)
		.required(1);

	var population = model.dimension() 
		.title('Population')
		.types(Number);

	// --- Mapping function ---
	model.map(function (data){
		return data.map(function (d){
			return {
			id : idCountry(d),
			NAME : country(d),
			categ : data1(d),
			population : population(d)
			}
		})
	})


	// -----------------
	// --- THE CHART ---
	// -----------------
	var chart = raw.chart()
		.title("Anamorphose Cartogram: France")	
		.description("Anamorphic cartogram of France. Representation that highlights the larger geographic entities<br><a href='http://bl.ocks.org/comeetie/6506916'>http://bl.ocks.org/comeetie/6506916</a><br><a href='http://www.comeetie.fr/galerie/d3-cartogram/'>http://www.comeetie.fr/galerie/d3-cartogram/</a><br><br>Exemple: Yes<br><img src='imgs/exemples/exemple_anamorphose_france.png' class='img-exemple'>")
		.thumbnail("imgs/cartogramAnamorphose.png")
		.model(model)

	// --- Some options we want to expose to the users ---
		var chartWidth = chart.number()
			.title('Width')
			.defaultValue(520);
		var chartHeight = chart.number()
			.title('Height')
			.defaultValue(520); 
		var chartScale = chart.number()
			.title('Zoom (default: 1)')
			.defaultValue(1);		

		var chartX = chart.number()
			.title('Axe X')
			.defaultValue(10);
		var chartY = chart.number()
			.title('Axe Y')
			.defaultValue(47);

		var byPopulation = chart.checkbox()
			.title('Adjust the values by population (Requires data in "Population")')
			.defaultValue(false);




	// --- Drawing function ---
	chart.draw(function (selection, dataBrut){

		// Import des script
		var racine = "bower_components/libs_anamorphose/france/";
		$.when(
			$.ajax({ async: false, url: racine+'d3-v2.min.js', dataType: "script" }),
			$.ajax({ async: false, url: racine+'cartogram.js', dataType: "script" }),			
			$.ajax({ async: false, url: racine+'colorbrewer.js', dataType: "script" }),
			$.ajax({ async: false, url: racine+'topojson.js', dataType: "script" }),
			$.Deferred(function( deferred ){
	        	$( deferred.resolve );
	    	})
		).done(function(){
			console.log('All scripts loaded');
			chartScript();
		});
		
		//Script du graphique
		function chartScript() {
			fields = [{name: "Categ", id: "categ", key: "categ", format:"", lab:"de la catégorie"}],
			fieldsById = d3.nest()
				.key(function(d) { return d.id; })
				.rollup(function(d) { return d[0]; })
				.map(fields),
			field = fields[0],
			colors = colorbrewer.Reds[6];
			var map = selection
				.attr("width", chartWidth())
				.attr("height", chartHeight());

			var zoom = d3.behavior.zoom()
					.translate([0, 0])
					.scale(chartScale())
					.scaleExtent([0.5, 10.0])
					.on("zoom", updateZoom);
			var	layer = map.append("g")
					.attr("id", "layer");
			var	states = layer.append("g")
					.attr("id", "states")
					.selectAll("path");

			updateZoom();

			function updateZoom() {
				var scale = zoom.scale();
				layer.attr("transform",
					"translate(" + zoom.translate() + ") " +
				  	"scale(" + [scale, scale] + ")");
			}
			
			if('function' != typeof(d3.cartogram)){
				$('h3#options').replaceWith('<h3 id="options">Customize your Visualization<br><span style="color:red;">A problem occurred. Thank you to change any data/option to reload the graph.</span></h3>');
			} else {
				$('h3#options').replaceWith('<h3 id="options">Customize your Visualization</h3>');
			}

			var proj = d3.geo.albers().origin([chartX(), chartY()]).scale(2600).parallels([40, 52]),
				topology,
				geometries,
				rawData,
				dataById = {},
				carto = d3.cartogram()
					.projection(proj)
					.properties(function(d) {
						return dataById[d.id];
					})
					.value(function(d) {
						if(byPopulation() == true){
							return +d.properties[key]/d.properties['population'];
					  	} else {
							return +d.properties[key];
					  	}
					})
					.iterations(20);

		 
			d3.json("bower_components/libs_anamorphose/france/france-metropolitaine-regions.topojson", function(topo) {
				topology = topo;
				geometries = topology.objects.regions.geometries;
				
				rawData = dataBrut;
				dataById = d3.nest()
					.key(function(d) { return d.id; })
					.rollup(function(d) { return d[0]; })
					.map(dataBrut);
			  	init();
			});


			function init() {

				var features = carto.features(topology, geometries),
					path = d3.geo.path()
						.projection(proj);

				states = states.data(features)
					.enter()
					.append("path")
					.attr("class", "state")
					.attr("id", function(d) {
						return d.properties.id;
					})
					.attr("fill", "#fafafa")
					.attr("d", path);

				states.append("title");

				update();
			}


			function update() {

				var key = field.key,
					fmt = (typeof field.format === "function")
						? field.format
						: d3.format(field.format || ","),
					value = function(d) {	
						if(byPopulation() == true){
							return +d.properties[key]/d.properties['population'];
					  	} else {
							return +d.properties[key];
					  	}
					},
					values = states.data()
						.map(value)
						.filter(function(n) {
							return !isNaN(n);
						})
						.sort(d3.ascending),
					lo = values[0],
					hi = values[values.length - 1];

				var color = d3.scale.quantize().range(colors).domain([lo,hi]);

				// normalize the scale to positive numbers
				var scale = d3.scale.linear()
					.domain([lo, hi])
					.range([1, 1000]);
		  
				// tell the cartogram to use the scaled values
				carto.value(function(d) {
				  	return scale(value(d));
				});

				// generate the new features, pre-projected
				var features = carto(topology, geometries).features;
				// update the data
				states.data(features)
					.select("title")
						.text(function(d) {
					  		return [d.properties.NAME, fmt(value(d))].join(" : ");
						});

				states.transition()
					.duration(750)
					.ease("linear")
					.attr("fill", function(d) {
						return color(value(d));
				  	})
					.attr("d", carto.path);

				states.attr('stroke','#666').attr('stroke-width',.5);
				$("path.state").hover(
					function() {
						$(this).attr('stroke','#000');
					}, function() {
						$(this).attr('stroke','#666');
					});
				
				setTimeout(function() {
					$.getScript('bower_components/d3/d3.min.js', function(){
						console.log('D3-V3 reloaded');
					});
				}, 3000);
			}
		}
	})

})();


