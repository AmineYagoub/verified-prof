export interface LanguageConfig {
  module: string;
  query: string;
}

const COMMON_QUERIES = {
  COMMENT: '(comment) @comment',
  LINE_COMMENT: '(line_comment) @comment',
};

const buildQuery = (parts: string[]): string =>
  parts.filter(Boolean).join('\n');

export const LANGUAGES_CONFIG: Record<string, LanguageConfig> = {
  javascript: {
    module: 'tree-sitter-javascript',
    query: buildQuery([
      '(import_statement) @import',
      '(class_declaration name: (identifier) @class.name) @class.def',
      '(function_declaration name: (identifier) @func.name) @func.def',
      '(method_definition name: (property_identifier) @func.name) @func.def',
      '[(if_statement) (for_statement) (while_statement) (switch_case) (ternary_expression)] @complexity.branch',
      COMMON_QUERIES.COMMENT,
    ]),
  },
  typescript: {
    module: 'tree-sitter-typescript',
    query: buildQuery([
      '(import_statement) @import',
      '(class_declaration name: (type_identifier) @class.name) @class.def',
      '(function_declaration name: (identifier) @func.name) @func.def',
      '(method_definition name: (property_identifier) @func.name) @func.def',
      '(interface_declaration name: (type_identifier) @class.name) @class.def',
      '[(if_statement) (for_statement) (while_statement) (switch_case) (ternary_expression)] @complexity.branch',
      COMMON_QUERIES.COMMENT,
    ]),
  },
  python: {
    module: 'tree-sitter-python',
    query: buildQuery([
      '[(import_from_statement) (import_statement)] @import',
      '(class_definition name: (identifier) @class.name) @class.def',
      '(function_definition name: (identifier) @func.name) @func.def',
      '[(if_statement) (for_statement) (while_statement) (with_statement)] @complexity.branch',
      COMMON_QUERIES.COMMENT,
    ]),
  },
  go: {
    module: 'tree-sitter-go',
    query: buildQuery([
      '(import_spec) @import',
      '(type_declaration (type_spec name: (type_identifier) @class.name)) @class.def',
      '(function_declaration name: (identifier) @func.name) @func.def',
      '(method_declaration name: (field_identifier) @func.name) @func.def',
      '[(if_statement) (for_statement) (communication_case) (select_statement)] @complexity.branch',
      COMMON_QUERIES.COMMENT,
    ]),
  },
  rust: {
    module: 'tree-sitter-rust',
    query: buildQuery([
      '(use_declaration) @import',
      '[(struct_item name: (type_identifier) @class.name) (enum_item name: (type_identifier) @class.name) (trait_item name: (type_identifier) @class.name)] @class.def',
      '(function_item name: (identifier) @func.name) @func.def',
      '(impl_item (function_item name: (identifier) @func.name)) @func.def',
      '[(if_expression) (for_expression) (while_expression) (match_arm)] @complexity.branch',
      COMMON_QUERIES.LINE_COMMENT,
    ]),
  },
  php: {
    module: 'tree-sitter-php',
    query: buildQuery([
      '[(namespace_definition) (namespace_use_declaration)] @import',
      '(class_declaration name: (name) @class.name) @class.def',
      '(function_definition name: (name) @func.name) @func.def',
      '(method_declaration name: (name) @func.name) @func.def',
      '[(if_statement) (for_statement) (foreach_statement) (while_statement) (switch_case)] @complexity.branch',
      COMMON_QUERIES.COMMENT,
    ]),
  },
  zig: {
    module: 'tree-sitter-zig',
    query: buildQuery([
      '(ContainerDecl) @class.def',
      '(FnProto name: (identifier) @func.name) @func.def',
      '[(IfPrefix) (ForPrefix) (WhilePrefix)] @complexity.branch',
      COMMON_QUERIES.LINE_COMMENT,
    ]),
  },
  yaml: {
    module: '@tree-sitter-grammars/tree-sitter-yaml',
    query: buildQuery([
      '(block_mapping_pair key: (flow_node) @key) @pair',
      '(block_sequence_item) @item',
      '(flow_mapping) @flow_map',
      '(plain_scalar) @scalar',
    ]),
  },
  json: {
    module: 'tree-sitter-json',
    query: buildQuery([
      '(pair key: (string) @key value: (_) @value) @pair',
      '(object) @object',
      '(array) @array',
    ]),
  },
  vue: {
    module: 'tree-sitter-vue',
    query: buildQuery([
      '(script_start (import_statement) @import)',
      '(component_definition name: (identifier) @class.name) @class.def',
      '(function_definition name: (identifier) @func.name) @func.def',
      '[(if_statement) (for_statement) (while_statement) (switch_case) (ternary_expression)] @complexity.branch',
      COMMON_QUERIES.COMMENT,
    ]),
  },
};
