//SCRIPTS.JS
	/**
	*
	*
	*
	*	NOTES:
	*		[1] Slider could be improved. No displayed limits. Values are hidden. Etc.
	*		[2] This chart's API is restricted and makes assumptions. E.g., legend entries provided to 'rose' and 'legend' are the same.
	*
	*
	*
	*	@author Kristofer Gryte. http://www.kgryte.com
	*
	*
	*/

	var Chart = {};

	Chart.rose = function() {

		var margin = {'top': 20, 'right': 20, 'bottom': 20, 'left': 20},
			height = 600,
			width = 900,
			color = 'rgb(0,0,0)',
			area = function(d) { return [d.y]; },
			angle = function(d) { return d.x; },
			radiusScale = d3.scale.linear(),
			angleScale = d3.scale.linear().range( [Math.PI, 3*Math.PI ] ),
			domain = [0, 1],
			legend = [''],
			label = function(d) { return d.label; },
			delay = 1000,
			duration = 100,
			canvas, graph, centerX, centerY, numWedges, wedgeGroups, wedges, legendGroup;

		// Arc Generator:
		var arc = d3.svg.arc()
			.innerRadius( 0 )
			.outerRadius( function(d,i) { return radiusScale( d.radius ); } )
			.startAngle( function(d,i) { return angleScale( d.angle ); } );

		function chart( selection ) {

			selection.each( function( data ) {
				//CUSTUM			
				var listeStrings = [], listeData1 = [], listeData2 = [], listeData3 = []
				for (i = 0; i < data.length; i++) {
				   listeStrings[i] = data[i].dataTotal;
				   listeData1[i] = data[i].data1;
				   listeData2[i] = data[i].data2;
				   listeData3[i] = data[i].data3;
				}
				allListe = [listeStrings, listeData1, listeData2, listeData3];
				//console.log(allListe);
				// Determine the number of wedges:
				numWedges = data.length;

				// Standardize the data:
				data = formatData( data );

				// Update the chart parameters:
				updateParams();

				// Create the chart base:
				createBase( this );

				// Create the wedges:
				createWedges( data, allListe );

			});

		}; // end FUNCTION chart()

		//
		function formatData( data ) {
			// Convert data to standard representation; needed for non-deterministic accessors:
			console.log(data);
			data = data.map( function(d, i) {
				return {
					'angle': angle.call(data, d, i),
					'area': area.call(data, d, i),
					'label': label.call(data, d, i)		
				};
			});

			// Now convert the area values to radii:
			// http://understandinguncertainty.org/node/214 
			return data.map( function(d, i) {
				return {
					'angle': d.angle,
					'label': d.label,
					'radius': d.area.map( function(area) {
						return Math.sqrt( area*numWedges / Math.PI );
					})
				}
			})
		}; // end FUNCTION formatData()

		//
		function updateParams() {
			// Update the arc generator:
			arc.endAngle( function(d,i) { return angleScale( d.angle ) + (Math.PI / (numWedges/2)); } );

			// Determine the chart center:
			centerX = (width - margin.left - margin.right) / 2;
			centerY = (height - margin.top - margin.bottom) / 2;

			// Update the radius scale:
			radiusScale.domain( domain )
				.range( [0, d3.min( [centerX, centerY] ) ] );

			// Update the angle scale:
			angleScale.domain( [0, numWedges] );		
		}; // end FUNCTION updateParams()

		// 
		function createBase( selection ) {

			// Create the SVG element:
			canvas = d3.select( selection ).append('svg:svg')
				.attr('width', width)
				.attr('height', height)
				.attr('class', 'canvas');


			// Create the graph element:
			graph = canvas.append('svg:g')
				.attr('class', 'graph')
				.attr('transform', 'translate(' + (centerX + margin.left) + ',' + (centerY + margin.top) + ')');
		}; // end FUNCTION createBase()


		function createWedges( data, allListe ) {
			// Create the wedge groups:
			wedgeGroups = graph.selectAll('.wedgeGroup')
				.data( data )
			  .enter().append('svg:g')
			  	.attr('class', 'wedgeGroup')
			  	.attr('transform', 'scale(0,0)');

			// Create the wedges:
			wedges = wedgeGroups.selectAll('.wedge')
			  	.data( function(d) { 
			  		var ids = d3.range(0, legend.length);

			  		ids.sort( function(a,b) { 
				  		var val2 = d.radius[b],
				  			val1 = d.radius[a]
				  		return  val2 - val1; 
				  	});
				  	return ids.map( function(i) {
				  		return {
				  			'legend': legend[i],
				  			'radius': d.radius[i],
				  			'angle': d.angle
				  		};
				  	});
			  	})
			  .enter().append('svg:path')
			  	.attr('class', function(d) { return 'wedge ' + d.legend; })
			  	.attr('d', arc );

			//CUSTUM
			var dataTotal;
			for (i = 0; i < allListe[0].length; i++) {
				dataTotal = allListe[0][i];
			}
			// Append title tooltips:
			wedges.append('svg:title')
				.text( function(d) { return d.legend + ': ' + (Math.floor(Math.pow(d.radius,2) * Math.PI / numWedges)) / (1000*12 /dataTotal); });
				// .text( function(d) { return d.legend + ': ' + Math.floor(Math.pow(d.radius,2) * Math.PI / numWedges); });


			// Transition the wedges to view:
			wedgeGroups.transition()
				.delay( delay )
				.duration( function(d,i) { 
					return duration*i;
				})
				.attr('transform', 'scale(1,1)');

			// Append labels to the wedgeGroups:
			var numLabels = d3.selectAll('.label-path')[0].length;
			
			wedgeGroups.selectAll('.label-path')
				.data( function(d,i) { 
					return [
						{
							'index': i,
							'angle': d.angle,
							'radius': d3.max( d.radius.concat( [23] ) )
						}
					];
				} )
			  .enter().append('svg:path')
			  	.attr('class', 'label-path')
			  	.attr('id', function(d) {
			  		return 'label-path' + (d.index + numLabels);
			  	})
				.attr('d', arc)
			  	.attr('fill', 'none')
			  	.attr('stroke', 'none');

			// var data1;
			// //for (i = 0; i < allListe[0].length; i++) {
			// 	data1 = allListe[1][i];
			// 	ii++;
			// //}
			wedgeGroups.selectAll('.label')
				.data( function(d,i) { 
					return [
						{
							'index': i,
							'label': d.label
						}
					];
				} )
			  .enter().append('svg:text')
		   		.attr('class', 'label')
		   		.attr('text-anchor', 'start')
		   		.attr('x', 5)
		   		.attr('dy', '-.71em')
		   		.attr('text-align', 'center')
		  		.append('textPath')
		  			.attr('xlink:href', function(d,i) { 
		  				return '#label-path' + (d.index + numLabels);
		  			})
		  			.text( function(d, i) { return d.label+" - d1= "+allListe[1][d.index]/(1000*12/allListe[0][d.index])+", d2= "+allListe[2][d.index]/(1000*12/allListe[0][d.index])+", d3= "+allListe[3][d.index]/(1000*12/allListe[0][d.index]); });

		}; // end FUNCTION createWedges()	

		// Set/Get: margin
		chart.margin = function( _ ) {
			if (!arguments.length) return margin;
			margin = _;
			return chart;
		};

		// Set/Get: width
		chart.width = function( _ ) {
			if (!arguments.length) return width;
			width = _;
			return chart;
		};

		// Set/Get: height
		chart.height = function( _ ) {
			if (!arguments.length) return height;
			height = _;
			return chart;
		};

		// Set/Get: area
		chart.area = function( _ ) {
			if (!arguments.length) return area;
			area = _;
			return chart;
		};

		// Set/Get: angle
		chart.angle = function( _ ) {
			if (!arguments.length) return angle;
			angle = _;
			return chart;
		};

		// Set/Get: label
		chart.label = function( _ ) {
			if (!arguments.length) return label;
			label = _;
			return chart;
		};

		// Set/Get: domain
		chart.domain = function( _ ) {
			if (!arguments.length) return domain;
			domain = _;
			return chart;
		};

		// Set/Get: legend
		chart.legend = function( _ ) {
			if (!arguments.length) return legend;
			legend = _;
			return chart;
		};

		// Set/Get: delay
		chart.delay = function( _ ) {
			if (!arguments.length) return delay;
			delay = _;
			return chart;
		};

		// Set/Get: duration
		chart.duration = function( _ ) {
			if (!arguments.length) return duration;
			duration = _;
			return chart;
		};

		return chart;

	}; // end FUNCTION rose()





	Chart.legend = function( entries ) {
		// NOTE: positioning handled by CSS.

		// Add a legend:
		var legend = {}, 
			height,
			symbolRadius = 5;

		legend.container = d3.select('body').append('div')
			.attr('class', 'legend');

		height = parseInt( d3.select('.legend').style('height'), 10);
		legend.canvas = legend.container.append('svg:svg')
				.attr('class', 'legend-canvas');

		legend.entries = legend.canvas.selectAll('.legend-entry')
			.data( entries )
		  .enter().append('svg:g')
		  	.attr('class', 'legend-entry')
		  	.attr('transform', function(d,i) { return 'translate('+ (symbolRadius + i*120) +', ' + (height/2) + ')'; });

		// Append circles to each entry with appropriate class:
		legend.entries.append('svg:circle')
			.attr('class', function(d) { return 'legend-symbol ' + d;} )
			.attr('r', symbolRadius )
			.attr('cy', 0 )
			.attr('cx', 0 );

		// Append text to each entry:
		legend.entries.append('svg:text')
			.attr('class', 'legend-text' )
			.attr('text-anchor', 'start')
			.attr('dy', '.35em')
			.attr('transform', 'translate(' + (symbolRadius*2) + ',0)')
			.text( function(d) { return d; } );

		// Add interactivity:
		legend.entries.on('mouseover.focus', mouseover)
			.on('mouseout.focus', mouseout);

		//
		function mouseover() {

			// Select the current element and get the symbol child class:
			var _class = d3.select( this ).select('.legend-symbol')
				.attr('class')
				.replace('legend-symbol ', ''); // left with legend class.

			d3.selectAll('.wedge')
				.filter( function(d,i) {
					// Select those elements not belonging to the same symbol class:
					return !d3.select( this ).classed( _class );
				})
				.transition()
					.duration( 1000 )
					.attr('opacity', 0.05 );

		}; // end FUNCTION mouseover()

		function mouseout() {

			d3.selectAll('.wedge')
				.transition()
					.duration( 500 )
					.attr('opacity', 1 );

		}; // end FUNCTION mouseout()

	}; // end FUNCTION legend()
 
		

(function(){


	// -----------------
	// --- THE MODEL ---
	// -----------------
	var model = raw.model();

	// Valeur total d'une part  	
	var dataTotal = model.dimension() 
		.title('Total de l\'ensemble')
		.types(Number)
		.required(1);

	// angle/ordre/centre (=date)
	var  dataAngle = model.dimension() 
		.title('Catégories (Label)')
		.types(String)
		.required(1);

	// Valeur d'une donnée
	var data1 = model.dimension() 
		.title('Données 1')
		.types(Number)
		.required(1);

	// Valeur de la 2eme donnée 
	var data2 = model.dimension() 
		.title('Données 2')
		.types(Number)

	// Valeur de la 3eme donnée
	var data3 = model.dimension() 
		.title('Données 3')
		.types(Number)


	// --- Mapping function ---
	// For each record in the data returns the values
	// for the X and Y dimensions and casts them as numbers
	model.map(function (data){
		var i = 0;
		return data.map(function (d){
			return {
				dataTotal : +dataTotal(d),
				data1 : +data1(d),
				data2 : +data2(d),
				data3 : +data3(d),
				dataAngle : dataAngle(d),
				order: i++ 
			}
			//i = i+1;
		})
	})



	// -----------------
	// --- THE CHART ---
	// -----------------
	var chart = raw.chart()
		.title("Nightingale Rose (Original)")
		.description("Simple representation of an original history of Nightingale Rose<br><a href='http://bl.ocks.org/kgryte/5926740'>http://bl.ocks.org/kgryte/5926740</a><br><br><strong>DEBUG :</strong><br> - Données du graphique affichées sur les cotés. -> Voir pour afficher la donnée directement dans le graphique.")
		.thumbnail("imgs/nightingale-original.png")
		.model(model)


	// --- Some options we want to expose to the users ---
	// For each of them a GUI component will be created
	// Options can be use within the Draw function
	// by simply calling them (i.e. witdh())
	// the current value of the options will be returned
	// Width
	var chartWidth = chart.number()
		.title('Width')
		.defaultValue(900)
	// Height
	var chartHeight = chart.number()
		.title('Height')
		.defaultValue(600)

	var chartRotation = chart.number()
		.title('Rotation')
		.defaultValue(180)

	var colors1 = chart.color()
		.title("Color Data1")
		.defaultValue("#D90009")

	var colors2 = chart.color()
		.title("Color Data2")
		.defaultValue("#1900D4")

	var colors3 = chart.color()
		.title("Color Data3")
		.defaultValue("#04c86d")


	// --- Drawing function ---
	// selection represents the d3 selection (svg)
	chart.draw(function (selection, data){
//1
		var rose = Chart.rose(),
			format = d3.time.format('%m/%Y'),
			causes = ['data1', 'data2', 'data3'],
			labels = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'];

		// svg size
		selection
			.attr("width", chartWidth())
			.attr("height", chartHeight())

		var scalar;
		data.forEach(function(d){

			d.label = d.dataAngle;
			//d.dataAngle = format.parse(d.dataAngle);
			//d.label = labels[d.dataAngle.getMonth()];
			//d.label = d.dataAngle;

			// Calculate the average annual mortality, as done by Nightingale:
			// http://understandinguncertainty.org/node/214 
			scalar = 1000*12 /d.dataTotal;
			d.data1 = d.data1 * scalar; //disease
			d.data2 = d.data2 * scalar; //wounds
			d.data3 = d.data3 * scalar; //autre
		} );
//2
		// Get the maximum value:
		var maxVal = d3.max(data, function(d){
			return d3.max([d.data1, d.data2, d.data3]);
		});

		// Where the maximum value gives us the maximum radius:
		var maxRadius = Math.sqrt(maxVal*12 / Math.PI);
//3	

		//Update the chart generator settings:
		rose.legend(causes)
			.width(chartWidth.value)
			.height(chartHeight.value)
			.delay(0)
			.domain([0, maxRadius])
			.angle(function(d){ return d.order; })
			.area(function(d, i){ return [d.data1, d.data2, d.data3]; });
//4				
		// Bind the data and generate a new chart:
		selection.datum(data).call( rose );

		// dynamic css		
		$("#chart .data1").css("fill", colors1());
		$("#chart .data2").css("fill", colors2());
		$("#chart .data3").css("fill", colors3());
		var translate = $("#chart .graph").attr("transform");
		$("#chart .graph").attr("transform", translate+" rotate("+chartRotation.value+")");

		// static css
		$("#chart .wedge").css("stroke", "#aaa").css("stroke-width", "1px");
		$("#chart .label").css("font-size", "8px");
	
	})

})();


