(function(){

	// -----------------
	// --- THE MODEL ---
	// -----------------
	var model = raw.model();

	var  name1 = model.dimension() 
		.title('Label 1')
		.types(String)
		.required(1);

	var  name2 = model.dimension() 
		.title('Label 2')
		.types(String)
		.required(1);

	var relationships1 = model.dimension() 
		.title('Value label 1')
		.types(Number)
		.required(1);

	var relationships2 = model.dimension() 
		.title('Value label 2')
		.types(Number)
		.required(1);

	// --- Mapping function ---
	model.map(function (data){
		return data.map(function (d){
			return {
				importer1 : name1(d),
				importer2 : name2(d),
				flow1 : relationships1(d),
				flow2 : relationships2(d)
			}
		})
	})


	// -----------------
	// --- THE CHART ---
	// -----------------
	var chart = raw.chart()
		.title("Chord diagram (relation + value)")	
		.description("A simple chord diagram in D3.js adjusting with value.<br><a href='http://www.delimited.io/blog/2013/12/8/chord-diagrams-in-d3'>http://www.delimited.io/blog/2013/12/8/chord-diagrams-in-d3</a><br><a href='https://github.com/sghall/d3-chord-diagrams/blob/master/trade-a.html'>https://github.com/sghall/d3-chord-diagrams/blob/master/trade-a.html</a><br><br>Exemple: In Progress...<br><img src='imgs/exemples/exemple_chordDiagramValue.png' class='img-exemple'>Data model file : Yes<br><a class='data-model' href='chordDiagram/modele-chordDiagram-RelationAndValue.xlsx'></a>")
		.thumbnail("imgs/chordDiagramValue.png")
		.model(model)


	// --- Some options we want to expose to the users ---
		var chartWidth = chart.number()
			.title('Width')
			.defaultValue(880); 

		var chartHeight = chart.number()
			.title('Height')
			.defaultValue(680); 

		var chartPadding = chart.number()
			.title('Padding')
			.defaultValue(.02);

		var chartOpacity = chart.number()
			.title('Opacity [0;1]')
			.defaultValue(.7);

		var chartStrokeWidth = chart.number()
			.title('Lines stroke width')
			.defaultValue(.25);

		var chartArc = chart.number()
			.title('Thickness of the arc')
			.defaultValue(20); 


	// --- Drawing function ---
	chart.draw(function (selection, dataBrut){

	//*******************************************************************
	//  1 - CHORD MAPPER FUNCTION
	//*******************************************************************
		function chordMpr (data) {
		  var mpr = {}, mmap = {}, n = 0,
		      matrix = [], filter, accessor;

		  mpr.setFilter = function (fun) {
		    filter = fun;
		    return this;
		  },
		  mpr.setAccessor = function (fun) {
		    accessor = fun;
		    return this;
		  },
		  mpr.getMatrix = function () {
		    matrix = [];
		    _.each(mmap, function (a) {
		      if (!matrix[a.id]) matrix[a.id] = [];
		      _.each(mmap, function (b) {
		       var recs = _.filter(data, function (row) {
		          return filter(row, a, b);
		        })
		        matrix[a.id][b.id] = accessor(recs, a, b);
		      });
		    });
		    return matrix;
		  },
		  mpr.getMap = function () {
		    return mmap;
		  },
		  mpr.printMatrix = function () {
		    _.each(matrix, function (elem) {
		      console.log(elem);
		    })
		  },
		  mpr.addToMap = function (value, info) {
		    if (!mmap[value]) {
		      mmap[value] = { name: value, id: n++, data: info }
		    }
		  },
		  mpr.addValuesToMap = function (varName, info) {
		    var values = _.uniq(_.pluck(data, varName));
		    _.map(values, function (v) {
		      if (!mmap[v]) {
		        mmap[v] = { name: v, id: n++, data: info }
		      }
		    });
		    return this;
		  }
		  return mpr;
		}
		//*******************************************************************
		//  CHORD READER
		//*******************************************************************
		function chordRdr (matrix, mmap) {
		  return function (d) {
		    var i,j,s,t,g,m = {};
		    if (d.source) {
		      i = d.source.index; j = d.target.index;
		      s = _.where(mmap, {id: i });
		      t = _.where(mmap, {id: j });
		      m.sname = s[0].name;
		      m.sdata = d.source.value;
		      m.svalue = +d.source.value;
		      m.stotal = _.reduce(matrix[i], function (k, n) { return k + n }, 0);
		      m.tname = t[0].name;
		      m.tdata = d.target.value;
		      m.tvalue = +d.target.value;
		      m.ttotal = _.reduce(matrix[j], function (k, n) { return k + n }, 0);
		    } else {
		      g = _.where(mmap, {id: d.index });
		      m.gname = g[0].name;
		      m.gdata = g[0].data;
		      m.gvalue = d.value;
		    }
		    m.mtotal = _.reduce(matrix, function (m1, n1) { 
		      return m1 + _.reduce(n1, function (m2, n2) { return m2 + n2}, 0);
		    }, 0);
		    return m;
		  }
		}


	//*******************************************************************
	//  2 - CREATE MATRIX AND MAP
	//*******************************************************************
	    var data = dataBrut;
	    var mpr = chordMpr(data);

	    mpr
	      .addValuesToMap('importer1')
	      .addValuesToMap('importer2')
	      .setFilter(function (row, a, b) {
	        return (row.importer1 === a.name && row.importer2 === b.name) ||
	               (row.importer1 === b.name && row.importer2 === a.name)
	      })
	      .setAccessor(function (recs, a, b) {
	        if (!recs[0]) return 0;
	          return recs[0].importer1 === a.name ? +recs[0].flow1 : +recs[0].flow2; 
	      });
	    drawChords(mpr.getMatrix(), mpr.getMap());

      //*******************************************************************
      //  3 - DRAW THE CHORD DIAGRAM
      //*******************************************************************
      function drawChords (matrix, mmap) {
	        var w = chartWidth(), h = chartHeight(), r1 = h / 2, r0 = r1 - 110;

	        // var fill = d3.scale.ordinal()
	        //     .range(['#c7b570','#c6cdc7','#335c64','#768935','#507282','#5c4a56','#aa7455','#574109','#837722','#73342d','#0a5564','#9c8f57','#7895a4','#4a5456','#b0a690','#0a3542',]);

	        var fill = d3.scale.category20c();

	        var chord = d3.layout.chord()
	            .padding(chartPadding())
	            .sortSubgroups(d3.descending)
	            .sortChords(d3.descending);

	        var arc = d3.svg.arc()
	            .innerRadius(r0)
	            .outerRadius(r0 + chartArc());

	        var svg = selection
	            .attr("width", w)
	            .attr("height", h)
	          .append("svg:g")
	            .attr("id", "circleChord")
	            .attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

	            svg.append("circle")
	                .attr("r", r0 + chartArc())
	                .style("fill","none")
                	.style("pointer-events","all");

	        var rdr = chordRdr(matrix, mmap);
	        chord.matrix(matrix);


	        var g = svg.selectAll("g.group")
	            .data(chord.groups())
	          .enter().append("svg:g")
	            .attr("class", "group")
	            .style("fill-opacity", ".8")
	            .on("mouseover", mouseover)
	            .on("mouseout", function (d) { d3.select("#tooltipChordDiagramValue").style("visibility", "hidden") });

	        g.append("svg:path")
	            .style("stroke", "black")
            	.style("stroke-opacity", "0.4")
	            .style("fill", function(d) { return fill(rdr(d).gname); })
	            .style("fill-opacity", ".8")
	            .attr("d", arc);

	        g.append("svg:text")
	            .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
	            .attr("dy", ".35em")
	            .style("font-family", "helvetica")
	            .style("font-size", "9px")
	            .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
	            .attr("transform", function(d) {
	              return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
	                  + "translate(" + (r0 + 26) + ")"
	                  + (d.angle > Math.PI ? "rotate(180)" : "");
	            })
	            .text(function(d) { return rdr(d).gname; });

	          var chordPaths = svg.selectAll("path.chord")
	                .data(chord.chords())
	              .enter().append("svg:path")
	                .attr("class", "chord")
	                .style("stroke", function(d) {
	                  if(d3.rgb(fill(rdr(d).sname)).darker()) {
	                    return d3.rgb(fill(rdr(d).sname)).darker(); 
	                  } else { return "#000"; }
	                })
	                .style("fill", function(d) { return fill(rdr(d).sname); })
	        		.style("fill-opacity", chartOpacity())
	        		.style("stroke-width", chartStrokeWidth())
	                .attr("d", d3.svg.chord().radius(r0))
	                .on("mouseover", function (d) {
	                  d3.select("#tooltipChordDiagramValue")
	                    .style("visibility", "visible")
	                    .html(chordTip(rdr(d)))
	                    .style("top", function () { return (d3.event.pageY - 170)+"px";})
	                    .style("left", function () { return (d3.event.pageX - 100)+"px";});
	                })
	                .on("mouseout", function (d) { d3.select("#tooltipChordDiagramValue").style("visibility", "hidden") });

	          function chordTip (d) {
	            var p = d3.format(".1%"), q = d3.format(",.2f")
	            return "Chord Info:<br/>"
	              +  d.tname + " to " + d.sname
	              + ": $" + q(d.svalue) + "M<br/>"
	              + p(d.svalue/d.stotal) + " of " + d.sname + "'s Total (" + q(d.stotal) + ")<br/>"
	              + p(d.svalue/d.mtotal) + " of Matrix Total (" + q(d.mtotal) + ")<br/>"
	              + "<br/>"
	              + d.sname + " to " + d.tname
	              + ": $" + q(d.tvalue) + "M<br/>"
	              + p(d.tvalue/d.ttotal) + " of " + d.tname + "'s Total (" + q(d.ttotal) + ")<br/>"
	              + p(d.tvalue/d.mtotal) + " of Matrix Total (" + q(d.mtotal) + ")";
	          }

	          function groupTip (d) {
	            var p = d3.format(".1%"), q = d3.format(",.2f")
	            return "Group Info:<br/>"
	                + d.gname + " : " + q(d.gvalue) + "M<br/>"
	                + p(d.gvalue/d.mtotal) + " of Matrix Total (" + q(d.mtotal) + "M)"
	          }

	          function mouseover(d, i) {
	            d3.select("#tooltipChordDiagramValue")
	              .style("visibility", "visible")
	              .html(groupTip(rdr(d)))
	              .style("top", function () { return (d3.event.pageY - 80)+"px"})
	              .style("left", function () { return (d3.event.pageX - 130)+"px";})

	            chordPaths.classed("fadeChord", function(p) {
	              return p.source.index != i
	                  && p.target.index != i;
	            });
	          }
	      }

	})

})();


