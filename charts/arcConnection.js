(function(){

	// -----------------
	// --- THE MODEL ---
	// -----------------
	var model = raw.model();

	var  country = model.dimension() 
		.title('Country')
		.types(String)
		.required(1);

	var  group = model.dimension() 
		.title('Group')
		.types(Number)
		.required(1);

	var data1 = model.dimension() 
		.title('Dimension')
		.types(Number)
		.required(1);

	var source = model.dimension() 
		.title('Source')
		.types(Number)
		.required(1);

	var target = model.dimension() 
		.title('Target')
		.types(Number)
		.required(1);

	// --- Mapping function ---
	model.map(function (data){
		return data.map(function (d){
			return {
			country : country(d),
			group : group(d),
			dataSource : source(d),
			dataTarget : target(d),
			data1 : data1(d)
			}
		})
	})


	// -----------------
	// --- THE CHART ---
	// -----------------
	var chart = raw.chart()
		.title("Arc connection")	
		.description("Simple arc connection diagram.<br><a href='http://bl.ocks.org/comeetie/6506916'>http://bl.ocks.org/comeetie/6506916</a><br><a href='http://mbostock.github.io/protovis/ex/arc.html'>http://mbostock.github.io/protovis/ex/arc.html</a><br><br>Exemple: Yes<br><img src='imgs/exemples/exemple_arcConnection.png' class='img-exemple'>")
		.thumbnail("imgs/arcConnection.png")
		.model(model)


	// --- Some options we want to expose to the users ---
		var chartWidth = chart.number()
			.title('Width')
			.defaultValue(850);
		var chartHeight = chart.number()
			.title('Height')
			.defaultValue(400); 	

		var chartRatio = chart.number()
			.title('Line Ratio')
			.defaultValue(1); 

		var chartOpacity = chart.number()
			.title('Line opacity')
			.defaultValue(0.5); 	




	// --- Drawing function ---
	chart.draw(function (selection, dataBrut){

		var racine = "bower_components/libs_arcConnection/";
		$.when(
			$.ajax({ async: false, url: racine+'jquery.tipsy.min.js', dataType: "script" }),
			$.ajax({ async: false, url: racine+'protovis.min.js', dataType: "script" }),			
			$.ajax({ async: false, url: racine+'tipsy.js', dataType: "script" }),
			$.Deferred(function( deferred ){
	        	$( deferred.resolve );
	    	})
		).done(function(){
			console.log('All scripts loaded');
			chartScript();
		});

		function chartScript(){

			var nodes = [],
				links = [],
				arrMin = [],
				lengthData = dataBrut.length;
			
			for(i=0; i < lengthData; i++){
				//Prepare data nodes
				var node = {'nodeName':dataBrut[i].country, 'group':parseInt(dataBrut[i].group)}
				var lengthNodes = nodes.length; 
				if(lengthNodes == 0) {
					nodes.push(node);
				} else {
					var existe = false;
					for(i2=0; i2 < lengthNodes; i2++){
						if(nodes[i2].nodeName == node.nodeName ){
							existe = true;
						}
					}
					if (existe == false ){
						nodes.push(node);
					}
				}

				//Prepare data links
				var link = {'source':parseInt(dataBrut[i].dataSource), 'target':parseInt(dataBrut[i].dataTarget), 'value':parseFloat(dataBrut[i].data1)};
				if(link.value != 0) {
					links.push(link);
					arrMin.push(link.value);
				}
			}
			nodes.reverse();
			var lengthLinks = links.length;

			console.log(links);

			valMin = Math.min.apply(null, arrMin);
			for(i3=0; i3 < lengthLinks; i3++){
				links[i3].value = (links[i3].value/valMin)*(chartRatio());
			}

			//Création du graphique
			var vis = new pv.Panel().canvas('chart')
			    .width(chartWidth())
			    .height(chartHeight())
			    .bottom(90);
			var arc = vis.add(pv.Layout.Arc)
			    .nodes(nodes)
			    .links(links)
			    .sort(function(a, b) a.group == b.group
			        ? b.linkDegree - a.linkDegree
			        : b.group - a.group);

			var i = 0;
			var i2 = 0;
			arc.link.add(pv.Line)
				.strokeStyle(function(){
					return 'rgba(88,156,205,'+chartOpacity()+')';
					// if(miserables2.links[i].direction == 0){
					// 	i++;
					// 	return 'rgba(187,53,48,0.5)';
					// } else if (miserables2.links[i].direction == 1){
					// 	i++;
					// 	return 'rgba(88,156,205,0.5)';
					// } else { i++; return 'gray'; }
				})
				.text(function(d){
					var index = i2; i2++;
					if(index < lengthLinks) {
						return links[index].value;
					}
				})
			    .event("mouseover", pv.Behavior.tipsy({gravity: "e", fade: true}));

			arc.node.add(pv.Dot)
			    .size(function(d) d.linkDegree + 4)
			    .fillStyle(pv.Colors.category19().by(function(d) d.group))
			    .strokeStyle(function() this.fillStyle().darker());

			arc.label.add(pv.Label)

			vis.render();
		}
	})

})();


