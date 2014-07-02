var $ = require('jquery-browserify'),
    d3 = require('d3'),
    nv = require('./nv.d3'),
    templates = require('./chart.html'),
    $ = require('jquery-browserify'),
    _ = require('underscore');
    
require('./nv.d3.css');

$.fn.log = function() { 
    console.log(this.selector, this);
    return this;  
};

module.exports = function(chart) { 
    $('body').log().html( templates.body(chart) );
    require('insert-css')(require('./chart.styl'));
    $.ajax(document.location.href+'/data', {dataType: 'json'}).done(function(data) { 
        _.each(data, function(item) { 
            item._date = new Date(Date.parse(item._date));
        });
        $('#last-data').html( templates.last_data(data) );
        chart_d3(chart, data);
    });
};

function chart_d3(chart, data) { 
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

    var x = d3.scale.linear() //time.scale()
        .range([0, width]);

    var y = d3.scale.linear()
        .range([height, 0]);

    var xAxis = d3.svg.axis()
        .scale(x)
        .orient("bottom");

    var yAxis = d3.svg.axis()
        .scale(y)
        .orient("left");

    var line = d3.svg.line()
        .x(function(d, idx) { return x(data.length-idx); })
        .y(function(d) { return y(d.v); });

    var svg = d3.select("#chart")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    x.domain([0, data.length]);
    y.domain(d3.extent(data, function(d) { return d.v; }));

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    svg.append("path")
        .datum(data)
        .attr("class", "line")
        .attr("d", line);
}

function chart_(chart, data) { 
    console.log(chart, data);
    nv.addGraph(function() {
        var chart = nv.models.lineChart()
                .margin({left: 100})  //Adjust chart margins to give the x-axis some breathing room.
                .useInteractiveGuideline(true)  //We want nice looking tooltips and a guideline!
                .transitionDuration(350)  //how fast do you want the lines to transition?
                .showLegend(true)       //Show the legend, allowing users to turn on/off line series.
                .showYAxis(true)        //Show the y-axis
                .showXAxis(true)        //Show the x-axis
        ;

        chart.xAxis     //Chart x-axis settings
              .axisLabel('Time (ms)')
              //.tickFormat(d3.format(',r'));
            .ticks([data[0].values.length])
            .tickFormat(function(d) {
                return d3.time.format('%c')(new Date(d))
            });

        chart.yAxis     //Chart y-axis settings
              .axisLabel('Voltage (v)');
              //.tickFormat(d3.format('.02f'));

        d3.select('#chart')    //Select the <svg> element you want to render the chart in.   
            .datum(data)         //Populate the <svg> element with chart data...
            .call(chart);          //Finally, render the chart!

        //Update the chart when window resizes.
        nv.utils.windowResize(function() { chart.update(); });
        return chart;
    });
}

