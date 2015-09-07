require "nested_editor_for/version"
require "nested_editor_for/engine"
require "nested_editor_for/builder"
require "action_view/helpers"

ActionView::Helpers::FormBuilder.send :prepend, NestedEditorFor::Builder
