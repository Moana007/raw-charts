(function(){


	// -----------------
	// --- THE MODEL ---
	// -----------------
	var model = raw.model();

	var  idCountry = model.dimension() 
		.title('id du pays')
		.types(Number)
		.required(1);

	// Valeur d'une donnée
	var data1 = model.dimension() 
		.title('Données')
		.types(Number)
		.required(1);

	// --- Mapping function ---
	model.map(function (data){
		return data.map(function (d){
			return {
			idCountry : idCountry(d),
			data1 : +data1(d)
			}
		})
	})


	// -----------------
	// --- THE CHART ---
	// -----------------
	var chart = raw.chart()
		.title("Sqares Cartogram")
		.description("This chart provides a <b>representation of data on a map as squares<b>. The squares are proportionals to their value. It bring out the data, regardless the size of the country..<br><a href='https://github.com/StudioV2/Demers_Cartogram_Example'>https://github.com/StudioV2/Demers_Cartogram_Example</a><br><br><strong>DEBUG :</strong><br> - Travail en cours...<br>")
		.thumbnail("imgs/cartogramSquare.png")
		.model(model)


	// --- Some options we want to expose to the users ---

	var chartWidth = chart.number()
		.title('Width')
		.defaultValue(728) // default-> 600

	var chartHeight = chart.number()
		.title('Height')
		.defaultValue(428) //default->480 //chartWidth*0.8
	
	var chartRatio = chart.number()
		.title('Ratio')
		.defaultValue(500)

	var chartScale = chart.number()
		.title('Scale')
		.defaultValue(114)


	// --- Drawing function ---
	chart.draw(function (selection, dataBrut){

		// VARIABLES
		var taille = 1; //1.5

		var margin = {top: 0, right: 0 , bottom: 0, left: 0},
		    width = (chartWidth() - margin.left - margin.right)*taille,
		    height = (chartHeight() - margin.top - margin.bottom)*taille,
		    padding = 0;

		var force = d3.layout.force()
		    .charge(0)
		    .gravity(0)
		    .size([width, height]);

		var svg = selection
		    .attr("width", width)
		    .attr("height", height);

		var arr = Array();

		allGraph(chartRatio(), chartScale());

		// FUNCTIONS
		function allGraph(ratio, scale) {
		  
		  	//console.log(data);
		  	var datalength = dataBrut.length,
		  		data = {type:"featureCollection", features:[]},
		  		arrayMaxValue = [],
		  		totalData = 0;
		  	for (var i=0; i < datalength ; i++) {
		  		totalData =  totalData + dataBrut[i].data1
		  	}

		  	for (var i=0; i < datalength ; i++) {
		  		var dataValue = (dataBrut[i].data1*100)/totalData;
		  		data.features.push({id:dataBrut[i].idCountry, properties:{value:dataValue}})
		  		arrayMaxValue.push(dataValue);


		  	};
		  	maxValue = d3.max(arrayMaxValue);




		    $.each(data.features, function (index, value) {
		        arr.push([value.id, value.properties.value]);
		    });

		    var projection = d3.geo.equirectangular()
		      .scale(scale*taille) //default 114
		      .translate([width / 2, height / 2]);

		    var radius = d3.scale.sqrt()
		      .domain([0, maxValue/100]) // MAX value ratio OR todo: "d3.max(value)"  ||  16.5 / 100 = .165 
		      .range([0, 30]);

		    graph(radius, ratio, projection);
		}

		function graph(radius, ratio, projection) {
		  d3.json("data/centroid-country.json", function(error, states) {

		    if (error) throw error;

		    var nodes = states.features
		          .map(function(d) {
		            var value = d.properties.value;
		            var trueValue = d.properties.value;

		            arr.forEach(function (element, index, array) {
		                if (d.id == element[0]) {
		                    value = element[1]*6 ;
		                    trueValue = element[1];
		                }
		            });

		            value+=1;

		            var point = projection(d.geometry.coordinates),
		                RatioReserve = value/ratio, //default = 500
		                titre = "id: "+d.id+", Country: "+d.properties.name+", Value: "+trueValue.toFixed(2)+"%";

		            return {
		              x: point[0], y: point[1],
		              x0: point[0], y0: point[1],
		              r: radius(RatioReserve)*taille,
		              titre: titre,
		              trueValue: trueValue
		            };   
		          });

		      force
		          .nodes(nodes)
		          .on("tick", tick)
		          .start();

		    var node = svg.selectAll("rect")
		        .data(nodes)
		      .enter().append("rect")
		        .attr("width", function(d) { return (d.r*2);})
		        .attr("height", function(d) { return (d.r*2);})
		        .each(function(){ 
		          d3.select(this).attr("fill",  function(d) {return getColorFromValue(d.trueValue);});
		          d3.select(this).attr("title",  function(d) { return d.titre; } );
		        });

		    // FUNCTION OF GRAPH()
		    function tick(e) {
		      node.each(gravity(e.alpha * .1))
		          .each(collide(.5))
		          .attr("x", function(d) { return (d.x - d.r); })
		          .attr("y", function(d) { return (d.y - d.r); });
		    }

		    function gravity(k) {
		      return function(d) {
		        d.x += (d.x0 - d.x) * k;
		        d.y += (d.y0 - d.y) * k;
		      };
		    }

		    function collide(k) {
		      var q = d3.geom.quadtree(nodes);
		      return function(node) {
		        var nr = node.r + padding,
		            nx1 = node.x - nr,
		            nx2 = node.x + nr,
		            ny1 = node.y - nr,
		            ny2 = node.y + nr;
		        q.visit(function(quad, x1, y1, x2, y2) {
		          if (quad.point && (quad.point !== node)) {
		            var x = node.x - quad.point.x,
		                y = node.y - quad.point.y,
		                lx = Math.abs(x),
		                ly = Math.abs(y),
		                r = nr + quad.point.r;
		            if (lx < r && ly < r) {
		              if (lx > ly) {
		                lx = (lx - r) * (x < 0 ? -k : k);
		                node.x -= lx;
		                quad.point.x += lx;
		              } else {
		                ly = (ly - r) * (y < 0 ? -k : k);
		                node.y -= ly;
		                quad.point.y += ly;
		              }
		            }
		          }
		          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
		        });
		      };
		    }

    		function getColorFromValue(value) {
		    	if (value > 10) {
		        	return "#B12535";
			    } else if (value > 5) {
			        return "#D76D43";
			    } else if (value > 0) {
			        return "#EFC46E";
			    } else {
			        return "#ECECED";
			    }
		    }

		  });
		}





	})

})();


