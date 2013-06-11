var H5P = H5P || {};

/**
 * Constructor.
 * 
 * @param {object} params Options for this library.
 * @param {string} contentPath The path to our content folder.
 */
H5P.ContinuousText = function (params, contentPath) {
  this.text = params.text === undefined ? '<div class="ct"><em>New text</em></div>' : params.text;
};

/**
 * Wipe out the content of the wrapper and put our HTML in it.
 * 
 * @param {jQuery} $wrapper
 */
H5P.ContinuousText.prototype.attach = function ($wrapper) {
  $wrapper.addClass('h5p-ct').html(this.text);
};

var createNodeStructure = function() {

  var current = {children:[]};
  var sequence = [];
  
  HTMLParser(text, {
    start: function(tag, attrs, unary) {
      console.log("START: " + tag + ", " + attrs);
      var obj = {tag:tag, attrs:attrs, parent: current, children:[]};
      current.children.push(obj); 
      current = obj;
      sequence.push(obj);
    },
    end: function(tag) {
      current = current.parent;
    },
    chars: function(text) {
      current.text = text;
    },
    comment: function(text) {
      // TODO - remove if possible!
    }
  });
  
  return sequence;
};

var createHtmlFromSequence = function(sequence, start, stop) {
  var html = '';
  
  for(var i=start; i<=stop && i<sequence.length; i++) {
    var node = sequence[i];
    
    /* Create start tag */
    if(node.tag) {
      html += '<'+node.tag+'>';
      // TODO - add attributes
      if(node.text) {
        html += node.text;
      }
    }

    // Run end tag creation when on leaf node
    // or last node included
    if(node.children.length == 0 || i==stop) {
      html += H5P.ContinuousText.createEndTags(node,i==stop);
    }
  }
      
  return html;
};

H5P.ContinuousText.reflow = function(content, slides) {
  
  var nodes = createNodeStructure(content),
    position = 0,
    ctElements = [];
  
  H5P.jQuery.each(slides, function(slideIdx, slide){
    ctElements = ctElements.concat(slide.elements.filter(function(element){return element.action.library.split('.')[1].split(' ')[0] === 'ContinuousText';}));
  });
  
  var end = nodes.length-1;
  H5P.jQuery.each(ctElements, function(idx, element){
    position = H5P.jQuery('.ct',element.container).fitText(nodes, position, end, end, 1) + 1;
    
    // TODO - remove:
    H5P.jQuery('.ct',element.container).css('background-color', '#CCC');
    
    
    
    //element.action.params.text = idx+': reflowCT';
    //element.action.params.index = idx;
    //console.log('!!!!!!!!',element.action.params);
    
    if(position == end) {
      console.log("FERDIG GITT");
      return false;
    }
  });
};

H5P.ContinuousText.createEndTags = function(node, force) {
  var html = '';
  
  if(node.tag) {
    html += '</'+node.tag+'>';
  }
  
  // If last child, create end tag for parent aswell:
  if((node.parent && force) || (node.parent && node.parent.children[node.parent.children.length-1] == node)) {
    html += H5P.ContinuousText.createEndTags(node.parent, force);
  }
  
  return html;
};

H5p.jQuery.fn.insideParent = function() {
  return $(this).parent().innerHeight() > $(this).outerHeight(); 
};

H5p.jQuery.fn.notFullYet = function() {
  return ($(this).parent().innerHeight() - $(this).outerHeight()) > lineheight; 
}; 

H5p.jQuery.fn.fitText = function(sequence, start, middle, end, step) {
  var $me = $(this);
  
  middle = Math.floor(middle);
  
  // Create HTML for relevant children, and set it
  $me.html(createHtmlFromSequence(sequence,start,middle));
  
  var stepSize = Math.floor(((end-start)/2)/step);
  
  console.log(start,middle,end,step,stepSize);
  
  // Check if inside
  if ($me.notFullYet() && (middle<end) && (stepSize > 1)) {
    return $me.fitText(sequence, start, middle+stepSize, end, step+1);
  }
  else if(!$me.insideParent() && stepSize > 0) {
    // Need to break up sub-tags:
    //return $me.fitText(text,start,middle-stepSize,end,step+1);
    return $me.fitText(sequence, start, middle-stepSize, end, step+1);
  }
  
  return middle;
};

