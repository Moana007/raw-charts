(function(){

  // -----------------
  // --- THE MODEL ---
  // -----------------
  var model = raw.model();

  var  dataCountryCode = model.dimension() 
    .title('Country code')
    .types(String)
    .required(1);

  var  dataCountryName = model.dimension() 
    .title('Country name')
    .types(String)
    .required(1);

  var dataPopulation = model.dimension() 
    .title('Dimension')
    .types(Number)
    .required(1);

  // --- Mapping function ---
  model.map(function (data){
    return data.map(function (d){
      return {
      dataCountryCode : dataCountryCode(d),
      dataCountryName : dataCountryName(d),
      dataPopulation : dataPopulation(d)
      }
    })
  })


  // -----------------
  // --- THE CHART ---
  // -----------------
  var chart = raw.chart()
    .title("Anamorphose Cartogram: World")
    .description("Anamorphic cartogram of the world. Representation that highlights the larger geographic entities<br><a href='http://th-mayer.de/cartogram/'>http://th-mayer.de/cartogram/</a><br><br>Exemple: Yes<br><img src='imgs/exemples/exemple_anamorphose_monde.png' class='img-exemple'>Data model file : Yes<br><a class='data-model' href='cartogram-anamorphoses/modele-anamorphoses-France-World.xlsx'></a>")
    .thumbnail("imgs/cartogramAnamorphose.png")
    .thumbnail("imgs/cartogramAnamorphoseMonde.png")
    .model(model)

  // --- Some options we want to expose to the users ---
    var chartWidth = chart.number()
      .title('Width')
      .defaultValue(800);
    var chartHeight = chart.number()
      .title('Height')
      .defaultValue(650); 
    var chartZoom = chart.number()
      .title('Zoom (default: 0.8)')
      .defaultValue(.8);   

    var chartAxeX = chart.number()
      .title('Axe X')
      .defaultValue(15);
    var chartAxeY = chart.number()
      .title('Axe Y')
      .defaultValue(140);


  // --- Drawing function ---
  chart.draw(function (selection, dataBrut){
    // Import des script
    var racine = "bower_components/libs_anamorphose/monde/";
    $.when(
      $.ajax({ async: false, url: racine+'d3.v3.js', dataType: "script" }),
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

      $('h3#options').replaceWith('<h3 id="options">Customize your Visualization<br><span id="status"></span><br></h3>');

      var chartUnit = "";

      var fields = [{name: "Population", id: "population", key: "Population", unit: ""}],
          fieldsById = d3.nest()
            .key(function(d) { return d.id; })
            .rollup(function(d) { return d[0]; })
            .map(fields),
          field = fields[0],
          colors = colorbrewer.YlOrRd[3]
            .map(function(rgb) { return d3.hsl(rgb); });

          stat = d3.select("#status")
            .style('color','#999');

      var map = selection
            .attr("width", chartWidth())
            .attr("height", chartHeight()),
          zoom = d3.behavior.zoom()
            .translate([chartAxeX(),chartAxeY()])
            .scale(chartZoom())
            .on("zoom", updateZoom),
          layer = map.append("g")
            .attr("id", "layer"),
          worldcountries = layer.append("g")
            .attr("id", "worldcountries")
            .selectAll("path");

      updateZoom();

      function updateZoom() {
        var scale = zoom.scale();
        layer.attr("transform",
          "translate(" + zoom.translate() + ") " +
          "scale(" + [scale, scale] + ")");
      }

      var proj = d3.geo.mercator(),
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
              return +d.properties[field];
            });

      window.onhashchange = function() {
        parseHash();
      };

      var url = ["bower_components/libs_anamorphose/monde","worldcountries.topojson"].join("/");
      d3.json(url, function(topo) {
        topology = topo;
        geometries = topology.objects.worldcountries.geometries;

          rawData = dataBrut;
          dataById = d3.nest()
            .key(function(d) {return d.dataCountryCode; })
            .rollup(function(d) {  return d[0]; })
            .map(dataBrut);
            
          init();


      });

      function init() {
        var features = carto.features(topology, geometries),
            path = d3.geo.path()
              .projection(proj);
       
        worldcountries = worldcountries.data(features)
          .enter()
          .append("path")
            .attr("class", "state")
            .attr("id", function(d) {
              return d.properties.dataCountryCode;
            })
            .attr("fill", "#fafafa")
            .attr("d", path)
            .attr("cursor","pointer");

        worldcountries.append("title");

        parseHash();
      }


      function update() {
        var start = Date.now();
        
        var key = "data"+field.key; // = Population
        var fmt = (typeof field.format === "function")
              ? field.format
              : d3.format(field.format || ","),
            value = function(d) {
              return +d.properties[key];
            },
            values = worldcountries.data()
              .map(value)
              .filter(function(n) {
                return !isNaN(n);
              })
              .sort(d3.ascending),
            lo = values[0],
            hi = values[values.length - 1];

        var color = d3.scale.linear()
          .range(colors)
          .domain(lo < 0
            ? [lo, 0, hi]
            : [lo, d3.mean(values), hi]);

        // normalize the scale to positive numbers
        var scale = d3.scale.linear()
          .domain([lo, hi])
          .range([10, 1000]);

        // tell the cartogram to use the scaled values
        carto.value(function(d) {
          return scale(value(d));
        });

        // generate the new features, pre-projected
        var features = carto(topology, geometries).features;
        // update the data
        worldcountries.data(features)
          .select("title")
            .text(function(d) {
              return [d.properties.dataCountryName, fmt(value(d))].join(": ") + field.unit;
            });

        worldcountries.transition()
          .duration(2750)
          .ease("linear")
          .attr("fill", function(d) {
            return color(value(d));
          })
          .attr("d", carto.path);

        worldcountries.attr('stroke','#666').attr('stroke-width',.5);
        $("path.state").hover(
        function() {
         $(this).attr('stroke','#000');
        }, function() {
         $(this).attr('stroke','#666');
        });

        var delta = (Date.now() - start) / 1000;
        stat.text(["Calculated in", delta.toFixed(1), "seconds"].join(" "));
      }
      
      var deferredUpdate = (function() {
        var timeout;
        return function() {
          var args = arguments;
          clearTimeout(timeout);
          stat.text("Calculating...");
          return timeout = setTimeout(function() {
            update.apply(null, arguments);
          }, 10);
        };
      })();

      var hashish = d3.selectAll("a.hashish")
        .datum(function() {
          return this.href;
        });

      function parseHash() {
        var parts = location.hash.substr(1).split("/"),
            desiredFieldId = parts[0],
            desiredYear = +parts[1];

        field = fieldsById[desiredFieldId] || fields[0];

        deferredUpdate();
      }
    }
  })

})();


