//SCRIPTS.JS
	/*!
	 * Copyright (c) 2012 Guillermo Winkler
	 * Licensed under the MIT (http://www.opensource.org/licenses/mit-license.php) license.
	 */

	 /*
	 * coxcomb chart method on paper
	 */
	/*\
	 * Paper.coxCombChart
	 [ method ]
	 **
	 * Creates a coxcomb chart
	 **
	 > Parameters
	 **
	 - cx (number) x coordinate of the chart
	 - cy (number) y coordinate of the chart
	 - r (integer) radius of the chart
	 - data
	 - opts (object) options for the chart
	 o {
	     categoryFontSize (int)
	     seriesFontSize (int)
	     onClick (fn)
	     categorySize (int)
	 o }
	 **
	 > Usage
	 | r.coxCombChart(cx, cy, r, data, opts)
	 \*/
	(function () {

	    var currentColor = 0;
	    var rad = Math.PI / 180;

	    function positionLabel(paper, cx, cy, r, startAngle, endAngle, params) {
	      //need to add text at the middle point between the two lower ones
	      var labelAngle = startAngle + (endAngle - startAngle) / 2,
	          xLabel = cx + r * Math.cos(-labelAngle * rad),
	          yLabel = cy + r * Math.sin(-labelAngle * rad),
	          label = paper.text(xLabel, yLabel, params.text).attr({fill: params.fontColor, "font-size": params.fontSize});
	      //the label never should be bottom up in order for the
	      //text to be read without turning your head or your screen
	      if (labelAngle >= 90 && labelAngle < 270) {
	          labelAngle += 180;
	      }
	      label.transform("r" + -labelAngle);
	      return label;
	    };
	    
	    function categorySlice(paper, cx, cy, r, startAngle, endAngle, params) {
	      var x1 = cx + r * Math.cos(-startAngle * rad),
	          x2 = cx + r * Math.cos(-endAngle * rad),
	          y1 = cy + r * Math.sin(-startAngle * rad),
	          y2 = cy + r * Math.sin(-endAngle * rad);
	      var slice = paper.path(["M", cx, cy, 
	                              "L", x1, y1, 
	                              "A", r, r, 0, +(endAngle - startAngle > 180), 0, x2, y2, 
	                              "z"]).attr(params);
	      //position the category label in the middle of the slice
	      positionLabel(paper, cx, cy, r/2, startAngle, endAngle, params);
	      return slice;
	    };

	    /*
	     * Creates a data bar inside a category
	     * r1 radius of the category
	     * r2 radius of the data bar
	     */
	    function coxCombBar(paper, cx, cy, r1, r2, startAngle, endAngle, params) {
	      var x1 = cx + r1 * Math.cos(-startAngle * rad),
	          y1 = cy + r1 * Math.sin(-startAngle * rad),
	          x2 = cx + r2 * Math.cos(-startAngle * rad),
	          y2 = cy + r2 * Math.sin(-startAngle * rad),
	          x3 = cx + r2 * Math.cos(-endAngle * rad),
	          y3 = cy + r2 * Math.sin(-endAngle * rad),
	          x4 = cx + r1 * Math.cos(-endAngle * rad),
	          y4 = cy + r1 * Math.sin(-endAngle * rad);
	      
	      var polygon = paper.path([ "M", x1, y1, 
	                                 "L", x2, y2, 
	                                 "A", r2, r2, 0, +(endAngle - startAngle > 180), 0, x3, y3, 
	                                 "L", x4, y4, 
	                                 "A", r1, r1, 0, +(endAngle - startAngle > 180), 0, x1, y1, 
	                                 "z"]).attr(params);
	      var label = positionLabel(paper, cx, cy, (r1 + r2) / 2, startAngle, endAngle, params); 
	      var section = paper.set();
	      section.push(polygon, label);
	      var onClick = function() {
	        if (typeof(params.onClick) === "function") {
	            section.toFront();
	            params.onClick(polygon, params.text);
	        }
	      };
	      var onMouseOver = function() {
	        polygon.attr({ "fill-opacity" : 0.2 });
	      };
	      var onMouseOut = function() {
	        polygon.attr({ "fill-opacity": params["fill-opacity"] || 1 });
	      };
	      section.mouseover(onMouseOver)
	           .mouseout(onMouseOut)
	           .click(onClick);
	      return section;
	    };

	    function getSeriesColor(category, serie, dataset) {
	      if (dataset.colors) {
	        if (dataset.colors.byCategory && dataset.colors.byCategory[category]) {
	            return dataset.colors.byCategory[category];
	        }
	        if (dataset.colors.bySeries && dataset.colors.bySeries[serie]) {
	            return dataset.colors.bySeries[serie];
	        }
	      }
	      currentColor+=1;
	      return {
	         color: Raphael.hsb(currentColor, 1, 1)
	      };
	    };

	    /*
	     * {
	     *  data: {
	     *      jan : {
	     *          disease : 80,
	     *          battle : 20             
	     *      },
	     *      feb : {
	     *          disease : 70,
	     *          battle : 10
	     *      }
	     *  },
	     *  colors : {
	     *      category : #fff,
	     *      opacity : 0.2,
	     *      byCategory : {
	     *          jan : {
	     *              color : #fff,
	     *              hover : #fff,
	     *              opacity : 0.5
	     *          },
	     *          feb : {
	     *              color: #fff
	     *          }
	     *      },
	     *      bySeries : {
	     *          disease : {
	     *              color : #fff,
	     *              hover : #fff
	     *          },
	     *          battle : {
	     *              color : #fff
	     *              hover : #fff
	     *          }
	     *      }
	     *  }
	     * }
	     */
	    function CoxCombChart(paper, cx, cy, r, dataset, opts) {
	        var chart = paper.set();

	        //categories and series should be counted in order
	        //to set the angles properly
	        var totalCategories = 0;
	        var totalSeries = {};
	        var maxValue;
	        var cat, serie;
	        for (cat in dataset.data) {
	            if (dataset.data.hasOwnProperty(cat)) {
	                totalCategories+=1;
	                if (typeof(dataset.data[cat]) === "object") {
	                    totalSeries[cat] = 0;
	                    for (serie in dataset.data[cat]) {
	                        if (dataset.data[cat].hasOwnProperty(serie)) {
	                            totalSeries[cat]+=1;
	                            //the maximum value of all the series is used
	                            //for normalization of the radius
	                            if (!maxValue || maxValue < dataset.data[cat][serie]) {
	                                maxValue = dataset.data[cat][serie];
	                            }
	                        }
	                    }
	                }
	            }
	        }
	        var catSize = (opts && opts.categorySize) || 0.30;
	        var currentAngle = 0;
	        var catRadius = r * catSize;
	        var catAngle = 360 * (1 / totalCategories);
	        for (cat in dataset.data) {
	            if (typeof(dataset.data[cat]) === "object") {
	                categorySlice(paper, cx, cy, catRadius, currentAngle, currentAngle + catAngle, 
	                              {fill: dataset.colors.category, 
	                               "fill-opacity": dataset.colors.opacity, 
	                               text: cat,
	                               fontSize: opts.categoryFontSize,
	                               fontColor: dataset.colors.fontColor,
	                               stroke: opts.stroke, 
	                               "stroke-width": 3 });
	                for (serie in dataset.data[cat]) {
	                    var serieRadius = catRadius + (r * (1 - catSize) * (dataset.data[cat][serie] / maxValue));
	                    var serieAngle = catAngle / totalSeries[cat];
	                    var color = getSeriesColor(cat, serie, dataset);
	                    coxCombBar(paper, cx, cy, catRadius, serieRadius, 
	                               currentAngle, currentAngle + serieAngle, 
	                               { fill: color.color, 
	                                 stroke: opts.stroke,
	                                 hoverColor : color.hover,    
	                                 fontSize: opts.seriesFontSize,
	                                 fontColor: color.fontColor,
	                                 text: serie,
	                                 "fill-opacity": color.opacity, 
	                                 "stroke-width": 3,
	                                 onClick: opts.onClick});
	                    //when the last serie is finished for this category
	                    //the angle is at the beginning of the next one
	                    currentAngle += serieAngle;
	                }
	            }
	        }
	    }

	    //public
	    Raphael.fn.coxCombChart = function(cx, cy, r, dataset, opts) {
	        return new CoxCombChart(this, cx, cy, r, dataset, opts);
	    };
	    
	}());

		

(function(){


	// -----------------
	// --- THE MODEL ---
	// -----------------
	var model = raw.model();



	var  categorie = model.dimension() 
		.title('Categories/Label')
		.types(String)
		.required(1);

	// Valeur d'une donnée
	var data1 = model.dimension() 
		.title('Dimension 1')
		.types(Number)
		.required(1);

	// Valeur de la 2eme donnée 
	var data2 = model.dimension() 
		.title('Dimension 2')
		.types(Number)
		.required(1);





	// --- Mapping function ---
	model.map(function (data){
		return data.map(function (d){
			return {
			categorie : categorie(d),
			data1 : +data1(d),
			data2 : +data2(d),
			}
		})
	})





	// -----------------
	// --- THE CHART ---
	// -----------------
	var chart = raw.chart()
		.title("CoxComb Chart")
		.description("It's slightly modified from the original Nightingale Rose, since it doesn't display the bars stacked but side by side. It's better to display superposed labels that way.<br><a href='https://github.com/guilespi/coxcomb-chart'>https://github.com/guilespi/coxcomb-chart</a><br><br><strong>DEBUG :</strong><br> - Bug de couleur (quand l'utilisateur utilise l'interface).<br> - Afficher les données sur le graphe.<br> - Voir la cohérence des données + ordre d'affichage (sort())<br><br>Exemple: Yes<br><img src='imgs/exemples/exemple_coxCombChart.png' class='img-exemple'>")
		.thumbnail("imgs/cartogramAnamorphose.png")
		.thumbnail("imgs/coxCombChart.png")
		.model(model)


	// --- Some options we want to expose to the users ---
	// Width
	var chartWidth = chart.number()
		.title('Width')
		.defaultValue(600)
	// Height
	var chartHeight = chart.number()
		.title('Height')
		.defaultValue(480) // chartWidth*0.8

	//COLOR
		var colorCenter = chart.color()
			.title("Color center")
			.defaultValue("#2B2B2B")

		var colorCenterFont = chart.color()
			.title("Color font center")
			.defaultValue("#fff")

		var colorData1 = chart.color()
			.title("Color dimension 1")
			.defaultValue("#E9E581")

		var colorData2 = chart.color()
			.title("Color dimension 2")
			.defaultValue("#DE1B1B")

		var colorDataFont1 = chart.color()
			.title("Color font dimension 1")
			.defaultValue("#000")

		var colorDataFont2 = chart.color()
			.title("Color font dimension 2")
			.defaultValue("#fff")

	// --- Drawing function ---
	chart.draw(function (selection, data){

		var lastSelection;
		var properties = {
			categorySize : 0.20, // percentage of radius used for categories
			categoryFontSize: 10,
			seriesFontSize: 10,
			onClick: function(polygon, text) { 
			    if (lastSelection) {
			        lastSelection.remove();
			    }
			    lastSelection = polygon.glow();
			},
			stroke: "#fff"
		};


		//console.log(function(d) { console.log('toto'); return d.color ? colorData1()(d.color) : colorData1()(null); });

		var pcolor = {
			category : colorCenter(), //color of the category
		    opacity : 0.8,
		    fontColor: colorCenterFont(),
		    bySeries : { //this color scheme repeats the same color for the same series
		        data1  : {
		          color : colorData1(),
		          opacity : 0.8,
		          fontColor: colorDataFont1(),
		        },
		        data2 : {
		          color: colorData2(),
		          opacity: 0.8,
		          fontColor: colorDataFont2()
		        }
		    }
		}
		//console.log(pcolor);

		var dataT = {}, cart = {},
		nbData = data.length;
		for (i = 0; i < nbData; i++){
			cart[data[i].categorie] = {};
			cart[data[i].categorie] = {data1:data[i].data1, data2:data[i].data2};
		}

		dataSet = {data:cart, colors:pcolor};


		var paperWidth = chartWidth.value;
	  	var paperHeight = paperWidth * 0.8;
	  	Raphael("chart", paperWidth, paperHeight)
	          .coxCombChart(paperWidth / 2,paperHeight / 2, paperHeight / 2, dataSet, properties);
		})

})();


