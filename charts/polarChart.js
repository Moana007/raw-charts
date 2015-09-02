(function(){


	// -----------------
	// --- THE MODEL ---
	// -----------------
	var model = raw.model();

	// Valeur total d'une part  	
	var categ = model.dimension() 
		.title('Catégorie de donnée (label)')
		.types(String)
		.required(1);

	var list = model.dimension()
        .title('Dimensions')
        .multiple(true)
        .types(Number)
        .required(1);

	// Valeur d'une donnée
	// var data1 = model.dimension() 
	// 	.title('Données 1')
	// 	.types(Number)


	// --- Mapping function ---
	model.map(function (data){
		if (!list()) return;
		return data.map(function (d){
			i = 0;
			var obj = { dimensions: {}, categ : categ(d) };
            list().forEach(function (l){
                obj.dimensions[i] = d[l];
                i++;
            })
			return obj;
		})
		// return data.map(function (d){
		// 	return {
		// 		categ : categ(d),
		// 		data1 : +data1(d)
		// 	}
		// })
	})



	// -----------------
	// --- THE CHART ---
	// -----------------
	var chart = raw.chart()
		.title("Polar Column")
		.description("Simple representation of a polar column")
		.thumbnail("imgs/polarChart.png")
		.model(model)


	// --- Some options we want to expose to the users ---
	var chartWidth = chart.number()
		.title('Width(only the chart)')
		.defaultValue(300)

	// var nbList = list().length;
	// for (i = 0; i < nbList; i++){			
	// 	var colors1 = chart.color()
	// 		.title("Color Data1")
	// 		.defaultValue("#D90009")
	// }



	// --- Drawing function ---
	chart.draw(function (selection, data){
		selection
			.attr("width", chartWidth())
			.attr("height", "500px")
		
		var dataCategories = [], dataSeries = [],
		nbData = data.length;

		if (list().length == 1) {
			for (i = 0; i < nbData; i++){
				dataCategories.push(data[i].categ);
				dataSeries.push(parseInt(data[i].dimensions[0]));
			}

			list().forEach(function (l){
                nameList = l;
			});

			dataSeries = [{
				type: 'column',
				pointPlacement: 'on',
				name: nameList,
				data: dataSeries // DYNAMIC
  			}];
		}
		else {
			for (i = 0; i < nbData; i++){
				dataCategories.push(data[i].categ);
			}

			list().forEach(function (l,e){
                var element = {};
                element['name'] = l;
                element['data'] = [];
                element['type'] = 'column';
                element['pointPlacement'] = 'on';
                for (i = 0; i < nbData; i++){
                	element['data'].push(parseInt(data[i].dimensions[e]));
                }
                dataSeries.push(element);
            })
		}
		
		// series: [{
	      //       type: 'column',
	      //       name: 'Jour malade',
	      //       data: [1, 8, 5],
	      //       pointPlacement: 'on'
          // }, {
	      //       type: 'column',
	      //       name: 'Jour Autre',
	      //       data: [10, 7, 0],
	      //       pointPlacement: 'on'
          // },

		window.chart = new Highcharts.Chart({    
			chart: {
				renderTo: "chart",
				polar: true,
				type: 'bar'
			},
			title: {
				text: '',
			},
			pane: {
				size : chartWidth.value
			},
			tooltip : {
				formatter: function () {
			    	return 'La valeur pour <b>'+this.x+'</b> est <b>'+this.y+'</b>';
				}
			},
		    plotOptions: {
        	    column: {
		            pointPadding: 0,
		            groupPadding: 0
		        }
		    }, 
			xAxis: {
				categories: dataCategories, // DYNAMIC
				tickmarkPlacement: 'on',
				lineWidth: 0
			},
			yAxis: { 
				lineWidth: 0,
				min: 0,
			},           
			series: dataSeries // DYNAMIC

      	});
	
	})

})();


