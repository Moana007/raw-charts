'use strict';

/* Controllers */

angular.module('raw.controllers', [])

  .controller('RawCtrl', function ($scope, dataService) {

    $scope.samples = [
      { title : '<span class="titleListeData lvl1">DEFAULTS :</span>'},
      { title : '<span class="simpleListeData">Cars (multivariate)</span>', url : 'data/multivariate.csv' },
      { title : '<span class="simpleListeData">Movies (dispersions)</span>', url : 'data/dispersions.csv' },
      { title : '<span class="simpleListeData">Music (flows) (+Streamgraph)</span>', url : 'data/flows.csv' },
      { title : '<span class="simpleListeData">Cocktails (correlations) (+Circle Packing)</span>', url : 'data/correlations.csv' },
      { title : '<span class="titleListeData lvl1">CUSTOMS :</span>'},
      { title : '<span class="simpleListeData">Causes morts à l\'armée (Nightingale)</span>', url : 'data/deathArmy.csv' },
      { title : '<span class="simpleListeData">Causes morts en entreprises (CoxCombChart)</span>', url : 'data/pdmEntreprise.csv' },
      { title : '<span class="titleListeData lvl2">Squares Cartogram :</span>'},
      { title : '<span class="simpleListeData">Réserves de pétroles (Squares cartogram )</span>', url : 'data/cartogram-squares/centroid-dataExemple.csv' },
      { title : '<span class="simpleListeData">Modèle de données : Squares cartogram </span>', url : 'data/cartogram-squares/model-dataSquare-country.csv' },
      { title : '<span class="titleListeData lvl2">Anamorphose :</span>'},
      { title : '<span class="simpleListeData">Ventes motos Leboncoin jusqu\'à jan 2013 (Anamorphose cartogram: FR)</span>', url : 'data/cartogram-anamorphoses/achatMotosLeboncoin.csv' },
      { title : '<span class="simpleListeData">Population mondiale 2010 (Anamorphose cartogram: Monde)</span>', url : 'data/cartogram-anamorphoses/countries_population_2010.csv' },
      { title : '<span class="titleListeData lvl2">Bubble Map :<span>'},
      { title : '<span class="simpleListeData">Population mondiale 2013 (Bubble Map: Monde)</span>', url : 'data/bubbleMap/countries_population_2013.csv' },
      { title : '<span class="simpleListeData">Modèle de données : Bubble Map France (Départements)</span>', url : 'data/bubbleMap/model-bubbleMap.csv' },
      { title : '<span class="simpleListeData">Modèle de données : Bubble Map France (Régions 2016)</span>', url : 'data/bubbleMap/model-bubbleMap-fr-regions.csv' }
      
    ]

    $scope.$watch('sample', function (sample){
      if (!sample) return;
      dataService.loadSample(sample.url).then(
        function(data){
          $scope.text = data;
        }, 
        function(error){
          $scope.error = error;
        }
      );
    });

    // init
    $scope.raw = raw;
    $scope.data = [];
    $scope.metadata = [];
    $scope.error = false;
    $scope.loading = true;

    $scope.categories = ['Correlations', 'Distributions', 'Time Series', 'Hierarchies', 'Others'];

    $scope.parse = function(text){

      if ($scope.model) $scope.model.clear();

      $scope.data = [];
      $scope.metadata = [];
      $scope.error = false;
      $scope.$apply();

      try {
        var parser = raw.parser();
        $scope.data = parser(text);
        $scope.metadata = parser.metadata(text);
        $scope.error = false;
      } catch(e){
        $scope.data = [];
        $scope.metadata = [];
        $scope.error = e.name == "ParseError" ? +e.message : false;
      }
      if (!$scope.data.length && $scope.model) $scope.model.clear();
      $scope.loading = false;
    }

    $scope.delayParse = dataService.debounce($scope.parse, 500, false);

    $scope.$watch("text", function (text){
      $scope.loading = true;
      $scope.delayParse(text);
    });

    $scope.charts = raw.charts.values().sort(function (a,b){ return a.title() < b.title() ? -1 : a.title() > b.title() ? 1 : 0; });
    $scope.chart = $scope.charts[0];
    $scope.model = $scope.chart ? $scope.chart.model() : null;


    $scope.$watch('error', function (error){
      if (!$('.CodeMirror')[0]) return;
      var cm = $('.CodeMirror')[0].CodeMirror;
      if (!error) {
        cm.removeLineClass($scope.lastError,'wrap','line-error');
        return;
      }
      cm.addLineClass(error, 'wrap', 'line-error');
      cm.scrollIntoView(error);
      $scope.lastError = error;

    })

    $('body').mousedown(function (e,ui){
      if ($(e.target).hasClass("dimension-info-toggle")) return;
      $('.dimensions-wrapper').each(function (e){
        angular.element(this).scope().open = false;
        angular.element(this).scope().$apply();
      })
    })

    //A COMMENTER
    // $('button[ng-model=sample]').on('mouseup', function(){
    //   $('a','ul[role=select]').on('click', function(){
    //     $('.dimensionName').text($(this).text());
    //   })
    // })

    

    $scope.codeMirrorOptions = {
      lineNumbers : true,
      lineWrapping : true,
      placeholder : 'Paste your text or drop a file here. No data on hand? Try one of our sample datasets!'
    }

    $scope.selectChart = function(chart){
      if (chart == $scope.chart) return;
      
      setTimeout(function(){ 
        var imgExemple_url = $('.img-exemple').attr('src');
        if (imgExemple_url != undefined) {
          $('#block_exemple .image_exemple_show').attr('src', imgExemple_url);
          $('.txt-showExemple').show();
        } else {
          $('#block_exemple .image_exemple_show').attr('src', '#');
          $('.txt-showExemple').hide();
          // ENLEVER BTN 'Show data exemple'
        }
      }, 500);

      $("#block_exemple").hide();
      $(".hide-show").text('Show');

      $scope.model.clear();
      $scope.chart = chart;
      $scope.model = $scope.chart.model();
    }
    // Slide block exemple
    $('.txt-showExemple').on('click', function(){
      $("#block_exemple").slideToggle("slow");
      var hideShow = $(".hide-show");
      if(hideShow.text() == 'Show'){
        hideShow.text('Hide');
      } else {
        hideShow.text('Show');
      } 
    })

    function refreshScroll(){
      $('[data-spy="scroll"]').each(function () {
        $(this).scrollspy('refresh');
      });
    }

    $(window).scroll(function(){

      // check for mobile
      if ($(window).width() < 760 || $('#mapping').height() < 300) return;

      var scrollTop = $(window).scrollTop() + 0,
          mappingTop = $('#mapping').offset().top + 10,
          mappingHeight = $('#mapping').height(),
          isBetween = scrollTop > mappingTop + 50 && scrollTop <= mappingTop + mappingHeight - $(".sticky").height() - 20,
          isOver = scrollTop > mappingTop + mappingHeight - $(".sticky").height() - 20,
          mappingWidth = mappingWidth ? mappingWidth : $('.col-lg-9').width();
     
      if (mappingHeight-$('.dimensions-list').height() > 90) return;
      //console.log(mappingHeight-$('.dimensions-list').height())
      if (isBetween) {
        $(".sticky")
          .css("position","fixed")
          .css("width", mappingWidth+"px")
          .css("top","20px")
      } 

     if(isOver) {
        $(".sticky")
          .css("position","fixed")
          .css("width", mappingWidth+"px")
          .css("top", (mappingHeight - $(".sticky").height() + 0 - scrollTop+mappingTop) + "px");
          return;
      }

      if (isBetween) return;

      $(".sticky")
        .css("position","relative")
        .css("top","")
        .css("width", "");

    })

    $(document).ready(refreshScroll);


  })