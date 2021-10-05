export default function TidyTreeD3(d3) {
  var NORMAL = 'n';

  var margin = {top: 35, right: 20, bottom: 20, left: 180}, //todo: test w/ big screen
      width = 350,
      height = 300;

  var dispatch = d3.dispatch("d3subcloneClick");

  function chart(data, theOptions) {

    const parentId = theOptions.parentId;
    const colorMap = theOptions.colorMap;

    // Remove any old chart
    d3.select('#' + parentId).select('svg').remove();

    // Draw new chart
    var svg = d3.select('#' + parentId).append('svg')
        .attr('height', height + margin.top + margin.bottom)
        .attr('width', width + margin.left + margin.right)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    let tree = data => {
      const root = d3.hierarchy(data);
      root.dx = 70;
      root.dy = width / (root.height + 1);
      return d3.tree().nodeSize([root.dx, root.dy])(root);
    }

    const root = tree(data);

    let x0 = Infinity;
    let x1 = -x0;
    root.each(d => {
      if (d.x > x1) x1 = d.x;
      if (d.x < x0) x0 = d.x;
    });

    const g = svg.append("g")
        .attr("font-family", "sans-serif")
        .attr("font-size", 10)
        .attr("transform", `translate(${root.dy / 3},${root.dx - x0})`);

    // Links
    g.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("d", d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));

    // Nodes
    const node = g.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("transform", d => `translate(${d.y},${d.x})`);

    node.append("circle")
        .attr("id", d => 'node_' + d.data.name)
        .attr("class", d => d.data.name === NORMAL ? "normal_node" : "subclone_node")
        .attr("fill", d => colorMap.get(d.data.name))
        .style("stroke", d => d.data.name === NORMAL ? '#555' : '')
        .style("stroke-width", d => d.data.name === NORMAL ? '1.5' : '')
        .style("stroke-opacity", d => d.data.name === NORMAL ? '0.4' : '')
        .attr("r", 30);

    node.append("text")
        .attr("dx", "0.05em")
        .attr("y", 5)
        .attr("class", "subclone_node")
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-family", "Raleway")
        .attr("font-weight", 500)
        .attr("font-size", "16")
        .attr("fill", d => d.data.name === NORMAL ? "#555" : "black")
        .attr("opacity", d => d.data.name === NORMAL ? "0.8" : "1")
        .text(d => d.data.name.toUpperCase())
        .clone(true).lower()
        .attr("stroke", "white");

    d3.selectAll('.subclone_node')
        .on("click", function(d) {
          dispatch.call('d3subcloneClick', this,  d.data.name);
        })
        .on("mouseover", function() {
          d3.select(this).style("cursor", "pointer");
        })
        .on("mouseout", function() {
          d3.select(this).style("cursor", "default");
        });

    g.attr("transform", "rotate(90)");

    return svg.node();
  }

  /*** OUTWARD FACING FUNCTIONS ***/
  chart.highlightNode = function(subcloneId) {
    if (subcloneId) {
      d3.select('#node_' + subcloneId)
          .style('stroke', 'rgb(53, 134, 192)')
          .style('stroke-width', '5');
    } else {
      d3.selectAll('.subclone_node').style('stroke', 'transparent');
    }
  };

  chart.getDispatch = function() {
    return dispatch;
  };

  // This adds the "on" methods to our custom exports
  // d3.rebind(chart, dispatch, "on");

  return chart;
}