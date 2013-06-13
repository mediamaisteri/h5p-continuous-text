var H5P = H5P || {};

/**
 * Constructor.
 * 
 * @param {object} params Options for this library.
 * @param {string} contentPath The path to our content folder.
 */
H5P.ContinuousText = function (params, contentPath) {
  this.text = params.text === undefined ? '<div class="ct"><em>New text</em></div>' : '<div class="ct">'+params.text+'</div>';
};

/**
 * Wipe out the content of the wrapper and put our HTML in it.
 * 
 * @param {jQuery} $wrapper
 */
H5P.ContinuousText.prototype.attach = function ($wrapper) {
  $wrapper.addClass('h5p-ct').html(this.text);
};

H5P.ContinuousText.Engine = (function() {
  
  var lineheight = 30;
  
  var createEndTags = function(node, force) {
    var html = '';
    
    if(node.tag) {
      html += '</'+node.tag+'>';
    }
    
    // If last child, create end tag for parent aswell:
    if((node.parent && force) || (node.parent && node.parent.children[node.parent.children.length-1] == node)) {
      html += createEndTags(node.parent, force);
    }
    
    return html;
  };
  
  var insideParent = function($node) {
    
    console.log('insideParent: ',$node.parent().innerHeight(),$node.outerHeight());
    
    return $node.parent().innerHeight() > $node.outerHeight(); 
  };

  var notFullYet = function($node) {
    console.log('notFullYet: ',$node.parent().innerHeight(),$node.outerHeight());
    
    return ($node.parent().innerHeight() - $node.outerHeight()) > lineheight; 
  };

  

  var fitText = function($node, sequence, start, middle, end, step, meta) {
    middle = Math.floor(middle);
    
    // Create HTML for relevant children, and set it
    meta.html = createHtmlFromSequence(sequence,start,middle);
      
    $node.html(meta.html);
    
    var stepSize = Math.floor(((end-start)/2)/step);
    
    //console.log(start,middle,end,step,stepSize);
    
    // Check if inside
    if (notFullYet($node) && (middle<end) && (stepSize > 1)) {
      return fitText($node,sequence, start, middle+stepSize, end, step+1, meta);
    }
    else if(!insideParent($node) && stepSize > 0) {
      // Need to break up sub-tags:
      //return $me.fitText(text,start,middle-stepSize,end,step+1);
      return fitText($node,sequence, start, middle-stepSize, end, step+1, meta);
    }
    
    return middle;
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
        html += createEndTags(node,i==stop);
      }
    }
    
    return html;
  };
  
  var createNodeStructure = function(text) {
    var current = {children:[]};
    var sequence = [];
    
    HTMLParser(text, {
      start: function(tag, attrs, unary) {
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
  
  return {
    run : (function(cpEditor) {
      var slides = cpEditor.params;  
      var wrappers = cpEditor.ct.wrappers;  
      var content = cpEditor.field.field.fields[2].text;
      
      console.log('content',content);
      
      var nodes = createNodeStructure(content),
        position = 0,
        ctElements = [];
      
      H5P.jQuery.each(slides, function(slideIdx, slide){
        ctElements = ctElements.concat(slide.elements.filter(function(element){return element.action.library.split('.')[1].split(' ')[0] === 'ContinuousText';}));
      });
      
      var end = nodes.length-1;
      var noMoreContent = false;
      H5P.jQuery.each(ctElements, function(idx, element){
        var $container = wrappers[element.index];
        
        if(noMoreContent) {
          $container.addClass('no-more-content');
          H5P.jQuery('.ct', $container).html('-- no more content --');
        }
        else {
          // Clone it, and move it to the current slide:
          
          var $newParent = $container.clone();
          $newParent.appendTo('.h5p-slide.h5p-current');
          var $node = H5P.jQuery('.ct',$newParent);
          var meta = {};
          position = fitText($node, nodes, position, end, end, 1, meta) + 1;
          $newParent.remove();
          $node = H5P.jQuery('.ct',$container);
          $node.html(meta.html);
          element.action.params.text = meta.html;

          noMoreContent = (position === end);
        }
        
        $container.css('background-color', 'pink');
      });
    })
  };
})();

