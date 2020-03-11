exports.down = function(knex) {
  return knex.schema.table('messages', (table) => {
    table.dropColumn('likes');
  });
}

exports.up = function(knex) {
  return knex.schema.table('messages', (table) => {
    table.integer('likes').defaultTo(0).notNullable();
  });
}
