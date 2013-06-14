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

  return {
    run: function (cpEditor) {
      var slides = cpEditor.params;
      var wrappers = cpEditor.ct.wrappers;
      var content = cpEditor.field.field.fields[2].text;
      var $ = H5P.jQuery;

      // Find all ct elements.
      var ctElements = [];
      H5P.jQuery.each(slides, function(slideIdx, slide){
        ctElements = ctElements.concat(slide.elements.filter(function (element) {
          return element.action.library.split('.')[1].split(' ')[0] === 'ContinuousText';
        }));
      });

      // Temporary document DOM.
      var $temporaryDocument = $('<div/>').html(content);

      $.each(ctElements, function (idx, element) {
        var $container = wrappers[element.index];
        var $newParent = $container.clone();
        var $ct = $newParent.find('.ct');

        $newParent.appendTo('.h5p-slide.h5p-current');

        // Inner height used here to allow for padding/margin/borders on containers.
        var containerBottom = $newParent.offset().top + $newParent.innerHeight();

        // Remaining blocks in the temporary document.
        $blocks = $temporaryDocument.children();

        if ($blocks.length === 0) {
          $container.addClass('no-more-content');
          $ct.html('-- no more content --');
        }
        else {
          $ct.html('');
          $blocks.each(function () {
            var $block = $(this);
            $ct.append($block); // Append it to get height calculated by browser.
            var thisBottom = $block.offset().top + $block.outerHeight();
            if (thisBottom > containerBottom) {
              // Pull back to the temp doc. This would be the perfect place to split it up.
              $temporaryDocument.prepend($block);

              return false;
            }
          });
          // Store data on element
          element.action.params.text = $ct.html();
          $container.find('.ct').html(element.action.params.text);
        }
        // Cleanup
        $newParent.remove();
        $container.css('background-color', 'pink');
      });
      // Cleanup Temporary document.
      $temporaryDocument.remove();
    }
  };
})();
