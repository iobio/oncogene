export default function TidyTreeD3(d3) {

  var margin = {top: 30, right: 20, bottom: 20, left: 200},
      width = 300,
      height = 200;

  function chart(data, theOptions) {

    const parentId = theOptions.parentId;

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
      root.dx = 50;
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
        .attr("fill", d => d.data.color)
        .attr("r", 20);

    node.append("text")
        .attr("dx", "0.05em")
        .attr("y", 5)
        .attr("transform", "rotate(-90)")
        .attr("text-anchor", "middle")
        .attr("font-family", "Raleway")
        .attr("font-weight", 500)
        .attr("font-size", "16")
        .attr("fill", "black")
        .text(d => d.data.name)
        .clone(true).lower()
        .attr("stroke", "white");

    g.attr("transform", "rotate(90)");

    return svg.node();

  }

  // This adds the "on" methods to our custom exports
  // d3.rebind(chart, dispatch, "on");

  return chart;
}