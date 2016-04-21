(function(){

	// -----------------
	// --- THE MODEL ---
	// -----------------
	var model = raw.model();

	var  name = model.dimension() 
		.title('Hierarchy')
		.types(String)
		.required(1);

	var relationships = model.dimension() 
		.title('Relationship')
		.types(String)
		.required(1);

	// --- Mapping function ---
	model.map(function (data){
		return data.map(function (d){
			return {
				name : name(d),
				imports : relationships(d)
			}
		})
	})


	// -----------------
	// --- THE CHART ---
	// -----------------
	var chart = raw.chart()
		.title("Chord diagram (Only relation)")	
		.description("A simple chord diagram in D3.js. Only for represent relationships, without value.<br><a href='http://bl.ocks.org/mbostock/1046712'>http://bl.ocks.org/mbostock/1046712</a><br><br>Exemple: In Progress...<br><img src='imgs/exemples/exemple_chordDiagram.png' class='img-exemple'>Data model file : Yes<br><a class='data-model' href='chordDiagram/modele-chordDiagram-OnlyRelation.xlsx'></a>")
		.thumbnail("imgs/chordDiagram.png")
		.model(model)


	// --- Some options we want to expose to the users ---
		var chartWidth = chart.number()
			.title('Width')
			.defaultValue(780); 

		var chartPadding = chart.number()
			.title('Padding')
			.defaultValue(.04);

		var chartOpacity = chart.number()
			.title('Opacity [0;1]')
			.defaultValue(.5); 

		var chartArc = chart.number()
			.title('Thickness of the arc')
			.defaultValue(20); 


	// --- Drawing function ---
	chart.draw(function (selection, dataBrut){

		lenDataBrut = dataBrut.length;
		for(i=0;i<lenDataBrut;i++){
			dataBrut[i].imports = dataBrut[i].imports.replace(/ \//g,"/").replace(/\/ /g,"/").split("/");
		}
		//console.log(dataBrut);

		var outerRadius = chartWidth() / 2,
     		innerRadius = outerRadius - 130;

		var fill = d3.scale.category20c();

		var chord = d3.layout.chord()
	    	.padding(chartPadding())
	    	.sortSubgroups(d3.descending)
	    	.sortChords(d3.descending);

		var arc = d3.svg.arc()
	    	.innerRadius(innerRadius)
	    	.outerRadius(innerRadius + chartArc()); // Epaisseur de l'arc
		
		var svg = selection
	    	.attr("width", outerRadius * 2)
	    	.attr("height", outerRadius * 2)
	      	.append("g")
	      		.attr("transform", "translate(" + outerRadius + "," + outerRadius + ")");

	    var indexByName = d3.map(),
	        nameByIndex = d3.map(),
	        matrix = [],
	        n = 0;

	    // Returns the Flare package name for the given class name.
	    function name(name) {
	    	return name.substring(0, name.lastIndexOf(".")).substring(6);
	    }

	    // Compute a unique index for each package name.
	    dataBrut.forEach(function(d) {
	    	if (!indexByName.has(d = name(d.name))) {
	        	nameByIndex.set(n, d);
	        	indexByName.set(d, n++);
	      	}
	    });

	    // Construct a square matrix counting package imports.
	    dataBrut.forEach(function(d) {
	    	var source = indexByName.get(name(d.name)),
	        	row = matrix[source];
	    	if (!row) {
	    		row = matrix[source] = [];
	    		for (var i = -1; ++i < n;) row[i] = 0;
	    	}
	    	d.imports.forEach(function(d) { row[indexByName.get(name(d))]++; });
	    });

	    chord.matrix(matrix);

	    var g = svg.selectAll(".group")
        	.data(chord.groups)
      	  .enter().append("g")
        	.attr("class", "group");

	    g.append("path")
	        .style("fill", function(d) { return fill(d.index); })
	        .style("stroke", function(d) { return fill(d.index); })
	        .attr("d", arc);

	    g.append("text")
	        .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
	        .attr("dy", ".35em")
	        .attr("transform", function(d) {
	          return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
	            	+ "translate(" + (innerRadius + 26) + ")"
	            	+ (d.angle > Math.PI ? "rotate(180)" : "");
	        })
	        .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
	        .text(function(d) { return nameByIndex.get(d.index); });

	    svg.selectAll(".chord")
	        .data(chord.chords)
	      .enter().append("path")
	        .attr("class", "chord")
	        .style("stroke", function(d) { return d3.rgb(fill(d.source.index)).darker(); })
	        .style("fill", function(d) { return fill(d.source.index); })
	        .style("fill-opacity", chartOpacity())
	        .attr("d", d3.svg.chord().radius(innerRadius));
	        // TOOLTIP (need to test. May bug) - For activate/desactivate :
	        // Uncomment .tooltipChordDiagram at the end of css/raw.css file. 
	        // Uncomment div.tooltipChordDiagram after the openning body tag.
	        // .on({
	        //   mouseover: function(d,i){ $('.tooltipChordDiagram').html(dataBrut[i].name); return $('.tooltipChordDiagram').css('visibility', 'visible'); },
	        //   mousemove: function(d){ return $('.tooltipChordDiagram').css({'top':(d3.event.pageY-40)+'px', 'left':(d3.event.pageX+10)+'px'}); },
	        //   mouseout: function(d){ return $('.tooltipChordDiagram').css('visibility', 'hidden'); }
	        // });
			

		d3.select(self.frameElement).style("height", outerRadius * 2 + "px");

	})

})();


