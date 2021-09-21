export default function stackedBarChartD3(d3) {

  //var dispatch = d3.dispatch("d3click");

  var margin = {top: 30, right: 20, bottom: 20, left: 50},
      width = 310,
      height = 300;


  function chart(subcloneObjs, theOptions) {
    const parentId = theOptions.parentId;
    let colors = theOptions.colorMap;

    // Remove any old chart
    d3.select('#' + parentId).select('svg').remove();

    // Draw new chart
    var svg = d3.select('#' + parentId).append('svg')
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + (margin.top - 15) + ")");


    var vals = d3.rollup(subcloneObjs, ([d]) => d, d => d.timepoint, d => d.subclone).values();

    var colorArr = [];
    for (let key of colors.keys()) {
      colorArr.push(key);
    }

    var stack = d3.stack()
        .keys(colorArr)
        .value((group, key) => group.get(key).prev)
        .order(d3.stackOrderReverse);
    var s = stack(vals);
    var series = s.map(s => (s.forEach(d => d.data = d.data.get(s.key)), s));

    var color = d3.scaleOrdinal()
        .domain(colors.keys())
        .range(colors.values())

    var x = d3.scaleBand()
        .domain(subcloneObjs.map(d => d.timepoint))
        .rangeRound([margin.left, width - margin.right])

    var y = d3.scaleLinear()
        .domain([0, d3.max(series, d => d3.max(d, d => d[1]))]).nice()
        .range([height - margin.bottom, margin.top])

    var xAxis = d3.axisBottom(x);

    var yAxis = d3.axisLeft(y);

    svg.append("g")
        .selectAll("g")
        .data(series)
        .join("g")
        .attr("fill", ({key}) => color(key))
        .call(g => g.selectAll("rect")
            .data(d => d)
            .join("rect")
            .attr("x", d => x(d.data.timepoint))
            .attr("y", d => y(d[1]))
            .attr("width", x.bandwidth())
            .attr("height", d => y(d[0]) - y(d[1]))
            .append("title")
            .text(d => `${d.data.subclone}@${d.data.timepoint}: ${d.data.prev}`));

    svg.append("g")
        .attr("class", "x sub-axis")
        .attr("transform", "translate(0," + (height -10)  + ")")
        .call(xAxis)
        .append("text")
        .attr("x", 0)
        .attr("dx", "13em")
        .attr("dx", "13em")
        .attr("dy", "3em")
        .style("text-anchor", "middle")
        .style("font-family", "Raleway")
        .style("fill", 'black')
        .text("Timepoints");


    svg.append("g")
        .attr("class", "y sub-axis")
        .call(yAxis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0)
        .attr("dx", "-11em")
        .attr("dy", "-3em")
        .style("text-anchor", "middle")
        .style("font-family", "Raleway")
        .style("fill", 'black')
        .text("Prevalence");

    return svg.node();
  }

  // This adds the "on" methods to our custom exports
  // d3.rebind(chart, dispatch, "on");

  return chart;
}