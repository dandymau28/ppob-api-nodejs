/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.increments('user_id');
    table.string('username', 50).notNullable();
    table.string('no_handphone', 20);
    table.string('email', 50);
    table.string('password', 255);
    table.string('mac_address', 20);
    table.string('token', 255);
    table.dateTime('token_expired_at');
    table.dateTime('login_time');
    table.integer('login_client');
    table.dateTime('created_at');
    table.dateTime('updated_at');
  })
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
    return knex.schema.dropTable('users');
};
