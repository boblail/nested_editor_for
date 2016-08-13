(function () {

  function enableNestedEditors() {
    enableNestedEditorsIn(document.body);
  }

  function enableNestedEditorsIn(parent) {
    withEach(findNestedEditors(parent), initializeNestedEditor);
  }

  function updateNestedEditors() {
    updateNestedEditorsIn(document.body);
  }

  function updateNestedEditorsIn(parent) {
    withEach(findNestedEditors(parent), updateNestedEditor);
  }

  function findNestedEditors(parent) {
    return $(parent).find('.nested.editor');
  }

  function initializeNestedEditor(nested_editor) {
    $(nested_editor).on('click',    '.add-nested-link', nestedRowAction(addNestedRow));
    $(nested_editor).on('click', '.delete-nested-link', nestedRowAction(deleteNestedRow));
    updateNestedEditor(nested_editor);

    // Hide rows that were created with _destroy="1"
    var deleted_rows = $(nested_editor).find('[data-attr="_destroy"][value="1"]');
    for(var i=0, ii=deleted_rows.length, row, input; i<ii; i++) {
      input = deleted_rows[i];
      row = $(input).closest('.nested-row')[0];
      row && $(row).hide();
    }
  }

  function nestedRowAction(action) {
    return function(e) {
      e.preventDefault();
      e.stopPropagation();
      var row = getNestedRowFromEvent(e);
      row && action(row);
    }
  }

  function getNestedRowFromEvent(e) {
    var row = $(e.target).closest('.nested-row')[0];
    row || FT.debug('[getParentNestedRow] .nested-row not found');
    return row;
  }



  function addNestedRow(row) {
    if(!row.parentNode) {return;}
    var nested_editor = $(row).closest('.nested.editor')[0];

    // Clone a row
    var new_row   = $(row).clone()[0],
        name      = $(new_row).attr('name').replace(/\[(\d+)\]/, function(m, n){return '['+(Number(n)+1)+']';});
    new_row.id    = row.id.replace(/(\d+)$/, function(m, n){return Number(n) + 1;});
    $(new_row).attr('name', name);
    $(new_row).attr('attr', name);
    row.parentNode.appendChild(new_row);

    // Reset the cloned row's values
    setNestedRowFieldValue(new_row, '_destroy', 0);
    setNestedRowFieldValue(new_row, 'id', '');
    resetFormFieldsIn(new_row);
    selectFirstFieldIn(new_row);

    // observer.fire('after_add_nested', [nested_editor, new_row]);
    updateNestedEditor(nested_editor);
  }

  function deleteNestedRow(row) {
    if(!row.parentNode) {return;}
    var nested_editor = $(row).closest('.nested.editor')[0];

    // How many undeleted records are left? Only 1? Create a new empty record.
    var undeleted_rows = 0;
    withEach(row.parentNode.childNodes, function(row) {
      (getNestedRowFieldValue(row, '_destroy') != '1') && (undeleted_rows++);
    });
    (undeleted_rows <= 1) && addNestedRow(row);

    // Give focus either to the previous row or the next row
    var previous_row = $(row).prev()[0] || $(row).next()[0];
    selectFirstFieldIn(previous_row);

    // Remove or hide the deleted record
    if(getNestedRowFieldValue(row, 'id')) {
      setNestedRowFieldValue(row, '_destroy', 1);
      $(row).hide();
    } else {
      row.parentNode.removeChild(row);
    }

    // observer.fire('after_delete_nested', [nested_editor, row]);
    updateNestedEditor(nested_editor);
  }

  function getNestedRowFieldValue(row, attr) {
    var field = getNestedRowField(row, attr);
    return field && field.value;
  }

  function setNestedRowFieldValue(row, attr, value) {
    var field = getNestedRowField(row, attr);
    field && (field.value = value);
  }

  function getNestedRowField(row, attr) {
    return $(row).find('[data-attr="' + attr + '"]')[0];
  }




  function updateNestedEditor(nested_editor) {
    var object_name   = $(nested_editor).attr('name'),
        rows          = $(nested_editor).find('.nested-row'),
        visible_rows  = [],
        row;

    for(var i=0, ii=rows.length; i<ii; i++) {
      row = rows[i];
      renumberNestedRow(row, i);
      (getNestedRowFieldValue(row, '_destroy') != '1') && visible_rows.push(row);
    }

    var ii = visible_rows.length - 1;
    for(var i=0; i<ii; i++) { setAddNestedVisibility(visible_rows[i],  'hidden'); }
    if(ii >= 0)             { setAddNestedVisibility(visible_rows[ii], 'visible'); }

    // observer.fire('after_reset_nested', nested_editor);
  }

  function renumberNestedRow(row, i) {
    withEach($(row).find('input, textarea, select'), function(e) {
      var name = $(e).attr('name');
      if(name) {
        $(e).attr('name', name.replace(/\[(\d+)\]/, function() { return '[' + i + ']'; }));
      }
    });
  }

  function setAddNestedVisibility(row, add_visibility) {
    var add_link = $(row).find('.add-link')[0];
    add_link && $(add_link).css({visibility: add_visibility});
  }



  function resetNestedEditor(nested_editor) {
    var nested_rows = $(nested_editor).find('.nested-row');
    for(var i=1, ii=nested_rows.length; i<ii; i++) {
      var row = nested_rows[i];
      row.parentNode.removeChild(row);
    }
    updateNestedEditor(nested_editor);
  }



  function withEach(array, fn) {
    for(var i=0, ii=array.length; i<ii; i++) { fn(array[i]); }
  }

  function member(array, item) {
    for(var i=0, ii=array.length; i<ii; i++) {
      if(array[i] == item) { return true; }
    }
    return false;
  }

  function resetFormFieldsIn(parent, options) {
    var inputs          = $(parent).find('input[type="text"], input[type="tel"], input[type="email"], textarea'),
        selects         = $(parent).find('select'),
        nested_editors  = $(parent).find('.nested.editor');
        options         = options || {};

    function fieldToBeReset(id) {
      return !(options.only && !member(options.only, input.id)) &&
             !(options.except && member(options.except, input.id));
    }

    for(var i=0, ii=inputs.length; i<ii; i++) {
      var input = inputs[i];
      fieldToBeReset(input.id) && (input.value = '');
    }
    for(var i=0, ii=selects.length; i<ii; i++) {
      var select = selects[i];
      fieldToBeReset(select.id) && (select.selectedIndex = 0);
    }
    for(var i=0, ii=nested_editors.length; i<ii; i++) {
      resetNestedEditor(nested_editors[i]);
    }

    $(parent).trigger('nested-editor.reset');
  }

  function selectFirstFieldIn(parent) {
    var inputs = $(parent).find('input, select, textarea');
    for(var i=0, ii=inputs.length; i<ii; i++) {
      var input = inputs[i];
      if($(input).is(':visible') && (input.type != 'hidden')) {
        $(input).focus();
        return;
      }
    }
  }



  window.NestedEditorFor = {
    init:             enableNestedEditors,
    enableAll:        enableNestedEditors,
    enableIn:         enableNestedEditorsIn,
    updateAll:        updateNestedEditors,
    updateIn:         updateNestedEditorsIn,

    addRow:           addNestedRow,
    deleteRow:        deleteNestedRow,
    getRowFromEvent:  getNestedRowFromEvent
  };
})();
